
const { Sequelize, Op } = require('sequelize');
const Reservation = require('../app/models/Reservation.js');
const ReservationSeat = require('../app/models/ReservationSeat.js');
const Seat = require('../app/models/Seat.js');
const Trip = require('../app/models/Trip.js');

class ReservationController {
  async create(req, res) {
    try {
      const { passenger_cpf, seats } = req.body;

      console.log('Dados recebidos:', { passenger_cpf, seats });
      // No início do método create
      console.log('Body recebido:', JSON.stringify(req.body, null, 2));
      console.log('Tipo do passenger_cpf:', typeof req.body.passenger_cpf);
      console.log('seats é array?', Array.isArray(req.body.seats));

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
        });

        if (!seat) {
          return res.status(400).json({
            error: `Assento ${item.seat_id} não encontrado na viagem ${item.trip_id}`,
          });
        }

        // Verificar se o assento já não está reservado
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
                  [Op.in]: ['PENDING', 'PAID'],
                },
                expires_at: {
                  [Op.gt]: new Date(),
                },
              },
              required: true,
            },
          ],
        });

        if (existingReservation) {
          return res.status(400).json({
            error: `Assento número ${seat.seat_number} já está reservado`,
          });
        }
      }

      // Criar a reserva
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const reservation = await Reservation.create({
        passenger_cpf,
        status: 'PENDING',
        expires_at: expiresAt,
      });

      console.log('Reserva criada:', reservation.id);

      // Criar os registros em reservation_seats
      for (const item of seats) {
        await ReservationSeat.create({
          reservation_id: reservation.id,
          trip_id: item.trip_id,
          seat_id: item.seat_id,
        });
      }

      // Buscar a reserva completa com os assentos
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
      console.error('Erro detalhado ao criar reserva:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}

module.exports = new ReservationController();