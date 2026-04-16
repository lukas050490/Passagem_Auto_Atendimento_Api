// src/controllers/ReservationController.js
const { Op } = require('sequelize');
const sequelize = require('../config/sequelize.cjs');
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

        // Verificar se já foi vendido
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

        // Verificar reserva temporária
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

  // Listar reservas (com filtro por empresa)
  async index(req, res) {
    try {
      const { company_id, status, start_date, end_date } = req.query;

      let whereCondition = {};

      // Filtrar por status
      if (status && status !== 'all') {
        whereCondition.status = status;
      }

      // Primeiro, buscar as viagens da empresa (se company_id for fornecido)
      let tripIds = null;
      if (company_id) {
        const trips = await Trip.findAll({
          where: { company_id },
          attributes: ['id']
        });
        tripIds = trips.map(t => t.id);
      }

      // Construir query
      let includeConditions = [
        {
          model: ReservationSeat,
          as: 'reservation_seats',
          include: [
            {
              model: Trip,
              as: 'trip',
              attributes: ['id', 'origin', 'destination', 'departure_time', 'price', 'company_id']
            },
            {
              model: Seat,
              as: 'seat',
              attributes: ['id', 'seat_number']
            }
          ]
        }
      ];

      // Filtrar por empresa (através das viagens)
      if (tripIds && tripIds.length > 0) {
        includeConditions[0].include[0].where = {
          id: { [Op.in]: tripIds }
        };
      } else if (company_id) {
        // Se tem company_id mas não encontrou viagens, retorna vazio
        return res.json([]);
      }

      // Filtrar por data de criação da reserva
      if (start_date && end_date) {
        whereCondition.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date + ' 23:59:59')]
        };
      }

      const reservations = await Reservation.findAll({
        where: whereCondition,
        include: includeConditions,
        order: [['created_at', 'DESC']], // Mudado de 'created_at' (sem aspas) para a string correta
        attributes: ['id', 'passenger_cpf', 'status', 'created_at', 'expires_at'] // Garantir que created_at seja selecionado
      });

      // Formatar resposta
      const formattedReservations = reservations.map(res => {
        let totalAmount = 0;
        const seats = [];

        if (res.reservation_seats && res.reservation_seats.length > 0) {
          res.reservation_seats.forEach(rs => {
            if (rs.trip && rs.trip.price) {
              totalAmount += parseFloat(rs.trip.price);
            }
            seats.push({
              id: rs.id,
              seat_number: rs.seat?.seat_number,
              seat: rs.seat, // Incluir o objeto seat completo
              trip: rs.trip ? {
                id: rs.trip.id,
                origin: rs.trip.origin,
                destination: rs.trip.destination,
                departure_time: rs.trip.departure_time,
                price: rs.trip.price
              } : null
            });
          });
        }

        return {
          id: res.id,
          passenger_cpf: res.passenger_cpf,
          status: res.status,
          created_at: res.created_at, // Agora isso virá do banco
          expires_at: res.expires_at,
          amount: totalAmount,
          seats: seats
        };
      });

      return res.json(formattedReservations);
    } catch (error) {
      console.error('Erro ao listar reservas:', error);
      return res.status(500).json({ error: 'Erro ao listar reservas', details: error.message });
    }
  }
  // Atualizar status da reserva
  async updateStatus(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['PENDING', 'PAID', 'CANCELED', 'EXPIRED'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      const reservation = await Reservation.findByPk(id, {
        include: [
          {
            model: ReservationSeat,
            as: 'reservation_seats',
            include: [
              {
                model: Seat,
                as: 'seat'
              }
            ]
          }
        ],
        transaction
      });

      if (!reservation) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Reserva não encontrada' });
      }

      // Se estiver cancelando, liberar os assentos
      if (status === 'CANCELED' && reservation.status !== 'PAID') {
        for (const rs of reservation.reservation_seats) {
          await Seat.update(
            { status: 'available' },
            { where: { id: rs.seat_id }, transaction }
          );
        }
      }

      // Atualizar status
      await reservation.update({ status }, { transaction });

      await transaction.commit();

      return res.json({
        success: true,
        message: `Reserva ${status === 'PAID' ? 'confirmada' : 'cancelada'} com sucesso`,
        reservation: {
          id: reservation.id,
          status: reservation.status
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao atualizar status:', error);
      return res.status(500).json({ error: 'Erro ao atualizar status da reserva' });
    }
  }

  // Buscar detalhes de uma reserva específica
  async show(req, res) {
    try {
      const { id } = req.params;

      const reservation = await Reservation.findByPk(id, {
        include: [
          {
            model: ReservationSeat,
            as: 'reservation_seats',
            include: [
              {
                model: Trip,
                as: 'trip'
              },
              {
                model: Seat,
                as: 'seat'
              }
            ]
          }
        ]
      });

      if (!reservation) {
        return res.status(404).json({ error: 'Reserva não encontrada' });
      }

      return res.json(reservation);
    } catch (error) {
      console.error('Erro ao buscar reserva:', error);
      return res.status(500).json({ error: 'Erro ao buscar reserva' });
    }
  }
}

module.exports = new ReservationController();