const { Op } = require('sequelize');
const Seat = require('../app/models/Seat');
const TempReservation = require('../app/models/TempReservation');
const ReservationSeat = require('../app/models/ReservationSeat');
const Reservation = require('../app/models/Reservation');

class SeatController {
  // Listar assentos disponíveis
  async available(req, res) {
    try {
      const { tripId } = req.params;
      const { sessionId } = req.query;

      // Limpar reservas expiradas
      await TempReservation.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date(),
          },
          status: 'active',
        },
      });

      // Atualizar status dos assentos com reservas expiradas
      await Seat.update(
        {
          status: 'available',
          reserved_until: null,
          reserved_by_session: null
        },
        {
          where: {
            status: 'reserved',
            reserved_until: {
              [Op.lt]: new Date(),
            },
          },
        },
      );

      // Buscar todos os assentos da viagem
      const seats = await Seat.findAll({
        where: { trip_id: tripId },
        order: [['seat_number', 'ASC']],
      });

      // Verificar assentos vendidos (apenas PAID são considerados vendidos)
      const soldSeats = await ReservationSeat.findAll({
        where: { trip_id: tripId },
        include: [
          {
            model: Reservation,
            as: 'reservation',
            where: {
              status: {
                [Op.in]: ['PAID'], // ✅ Apenas PAID - assentos realmente comprados
              },
            },
            required: true,
          },
        ],
      });

      const soldSeatIds = soldSeats.map(rs => rs.seat_id);

      // Formatar resposta
      const formattedSeats = seats.map(seat => {
        const seatData = {
          id: seat.id,
          seat_number: seat.seat_number,
          available: seat.status === 'available' && !soldSeatIds.includes(seat.id),
          status: seat.status,
        };

        // Se for reservado, verificar se é pela sessão atual
        if (seat.status === 'reserved') {
          seatData.reservedByCurrentSession = seat.reserved_by_session === sessionId;
          seatData.reservedUntil = seat.reserved_until;
          // Só está disponível se for reservado pela sessão atual
          seatData.available = seat.reserved_by_session === sessionId;
        }

        // Se estiver vendido, não está disponível
        if (soldSeatIds.includes(seat.id)) {
          seatData.available = false;
          seatData.status = 'sold';
        }

        return seatData;
      });

      return res.json(formattedSeats);
    } catch (error) {
      console.error('Erro ao buscar assentos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Reservar assento temporariamente
  async reserve(req, res) {
    try {
      const { tripId } = req.params;
      const { seatId, sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID é obrigatório' });
      }

      // Verificar se o assento já foi vendido
      const soldSeat = await ReservationSeat.findOne({
        where: {
          seat_id: seatId,
          trip_id: tripId,
        },
        include: [
          {
            model: Reservation,
            as: 'reservation',
            where: {
              status: {
                [Op.in]: ['PAID'], // ✅ Apenas PAID
              },
            },
          },
        ],
      });

      if (soldSeat) {
        return res.status(409).json({
          error: 'Este assento já foi vendido',
          code: 'SEAT_SOLD'
        });
      }

      // Verificar se já existe reserva temporária ativa de outra sessão
      const existingReservation = await TempReservation.findOne({
        where: {
          trip_id: tripId,
          seat_id: seatId,
          status: 'active',
          expires_at: {
            [Op.gt]: new Date(),
          },
          session_id: {
            [Op.ne]: sessionId,
          },
        },
      });

      if (existingReservation) {
        return res.status(409).json({
          error: 'Este assento está reservado por outro usuário',
          code: 'SEAT_RESERVED'
        });
      }

      // Remover reservas antigas da mesma sessão para este assento
      await TempReservation.destroy({
        where: {
          trip_id: tripId,
          seat_id: seatId,
          session_id: sessionId,
        },
      });

      // Criar nova reserva temporária
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutos de reserva

      const tempReservation = await TempReservation.create({
        session_id: sessionId,
        trip_id: tripId,
        seat_id: seatId,
        expires_at: expiresAt,
        status: 'active',
      });

      // Atualizar status do assento
      await Seat.update(
        {
          status: 'reserved',
          reserved_until: expiresAt,
          reserved_by_session: sessionId,
        },
        {
          where: {
            id: seatId,
            trip_id: tripId,
          },
        },
      );

      return res.json({
        success: true,
        message: 'Assento reservado temporariamente',
        expiresAt,
        reservationId: tempReservation.id,
      });
    } catch (error) {
      console.error('Erro ao reservar assento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Liberar assento
  async release(req, res) {
    try {
      const { tripId } = req.params;
      const { seatId, sessionId } = req.body;

      // Remover reserva temporária
      await TempReservation.destroy({
        where: {
          session_id: sessionId,
          trip_id: tripId,
          seat_id: seatId,
        },
      });

      // Atualizar status do assento
      await Seat.update(
        {
          status: 'available',
          reserved_until: null,
          reserved_by_session: null,
        },
        {
          where: {
            id: seatId,
            trip_id: tripId,
            reserved_by_session: sessionId,
          },
        },
      );

      return res.json({
        success: true,
        message: 'Assento liberado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao liberar assento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Confirmar reservas (quando avança para identificação)
  async confirm(req, res) {
    try {
      const { tripId } = req.params;
      const { seatIds, sessionId } = req.body;

      // Verificar se todos os assentos ainda estão disponíveis para esta sessão
      const unavailableSeats = [];

      for (const seatId of seatIds) {
        // Verificar se já foi vendido
        const soldSeat = await ReservationSeat.findOne({
          where: { seat_id: seatId, trip_id: tripId },
          include: [{
            model: Reservation,
            as: 'reservation',
            where: {
              status: {
                [Op.in]: ['PAID'] // ✅ Apenas PAID
              }
            },
          }],
        });

        if (soldSeat) {
          unavailableSeats.push({ seatId, reason: 'sold' });
          continue;
        }

        // Verificar reserva temporária
        const tempReservation = await TempReservation.findOne({
          where: {
            trip_id: tripId,
            seat_id: seatId,
            status: 'active',
            expires_at: { [Op.gt]: new Date() },
          },
        });

        if (tempReservation && tempReservation.session_id !== sessionId) {
          unavailableSeats.push({ seatId, reason: 'reserved_by_other' });
        }
      }

      if (unavailableSeats.length > 0) {
        return res.status(409).json({
          error: 'Alguns assentos não estão mais disponíveis',
          unavailableSeats,
        });
      }

      // Se tudo OK, apenas retorna sucesso (a reserva definitiva será feita no ReservationController)
      return res.json({
        success: true,
        message: 'Assentos confirmados temporariamente',
      });
    } catch (error) {
      console.error('Erro ao confirmar assentos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Limpar sessão (quando usuário sai da página)
  async cleanupSession(req, res) {
    try {
      const { sessionId } = req.body;

      // Remover todas as reservas temporárias da sessão
      await TempReservation.destroy({
        where: { session_id: sessionId },
      });

      // Liberar os assentos
      await Seat.update(
        {
          status: 'available',
          reserved_until: null,
          reserved_by_session: null,
        },
        {
          where: { reserved_by_session: sessionId },
        },
      );

      return res.json({ success: true });
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new SeatController();