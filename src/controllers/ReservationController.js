const { Op } = require('sequelize');
const sequelize = require('../config/sequelize.cjs')
const Reservation = require('../app/models/Reservation');
const ReservationSeat = require('../app/models/ReservationSeat');
const Seat = require('../app/models/Seat');
const Trip = require('../app/models/Trip');
const TempReservation = require('../app/models/TempReservation');

class ReservationController {
  async create(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { passenger_cpf, seats, sessionId } = req.body;

      if (!seats || seats.length === 0) {
        return res.status(400).json({ error: 'Nenhum assento selecionado' });
      }

      // Validar se todos os assentos estão disponíveis
      for (const item of seats) {
        // Verificar se o assento existe
        const seat = await Seat.findOne({
          where: {
            id: item.seat_id,
            trip_id: item.trip_id,
          },
          transaction,
        });

        if (!seat) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Assento ${item.seat_id} não encontrado na viagem ${item.trip_id}`,
          });
        }

        // Verificar se já foi vendido - CORRIGIDO!
        const existingReservation = await ReservationSeat.findOne({
          where: {
            seat_id: item.seat_id,
            trip_id: item.trip_id,
          },
          include: [
            {
              model: Reservation,
              as: 'reservation',
              where: {
                status: {
                  [Op.in]: ['PENDING', 'PAID'], // ✅ Apenas valores que existem
                },
              },
              required: true,
            },
          ],
          transaction,
        });

        if (existingReservation) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Assento número ${seat.seat_number} já está reservado`,
          });
        }

        // Verificar reserva temporária (se não for da mesma sessão)
        if (sessionId) {
          const tempReservation = await TempReservation.findOne({
            where: {
              trip_id: item.trip_id,
              seat_id: item.seat_id,
              status: 'active',
              expires_at: {
                [Op.gt]: new Date(),
              },
              session_id: {
                [Op.ne]: sessionId,
              },
            },
            transaction,
          });

          if (tempReservation) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Assento número ${seat.seat_number} está temporariamente reservado`,
            });
          }
        }
      }

      // Criar a reserva
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const reservation = await Reservation.create({
        passenger_cpf,
        status: 'PENDING',
        expires_at: expiresAt,
      }, { transaction });

      // Criar os registros em reservation_seats
      for (const item of seats) {
        await ReservationSeat.create({
          reservation_id: reservation.id,
          trip_id: item.trip_id,
          seat_id: item.seat_id,
        }, { transaction });

        // Atualizar status do assento para sold
        await Seat.update(
          {
            status: 'sold',
            reserved_until: null,
            reserved_by_session: null,
          },
          {
            where: { id: item.seat_id },
            transaction,
          },
        );

        // Remover reservas temporárias
        await TempReservation.destroy({
          where: {
            trip_id: item.trip_id,
            seat_id: item.seat_id,
          },
          transaction,
        });
      }

      await transaction.commit();

      // Buscar a reserva completa
      const completeReservation = await Reservation.findByPk(reservation.id, {
        include: [
          {
            model: ReservationSeat,
            as: 'reservation_seats',
            include: [
              {
                model: Seat,
                as: 'seat',
              },
              {
                model: Trip,
                as: 'trip',
              },
            ],
          },
        ],
      });

      return res.status(201).json({
        success: true,
        message: 'Reserva criada com sucesso',
        reservation: completeReservation,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro detalhado ao criar reserva:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message,
      });
    }
  }
}

module.exports = new ReservationController();