const Trip = require('../app/models/Trip.js');
const Seat = require('../app/models/Seat.js');
const Reservation = require('../app/models/Reservation.js');
const ReservationSeat = require('../app/models/ReservationSeat.js');
const { Sequelize, Op, fn, col } = require('sequelize');


class TripController {
  async store(req, res) {
    const {
      origin,
      destination,
      departure_time,
      arrival_time,
      service_type,
      price,
      total_seats,
    } = req.body;
    try {
      const trip = await Trip.create({
        company_id: req.companyId, // vem do token
        origin,
        destination,
        departure_time,
        arrival_time,
        service_type,
        price,
      });

      // 2️⃣ cria os assentos
      const seats = [];

      for (let i = 1; i <= total_seats; i++) {
        seats.push({
          trip_id: trip.id,
          seat_number: i,
        });
      }

      await Seat.bulkCreate(seats);
      return res.status(201).json(trip);
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      return res
        .status(500)
        .json({ error: 'Erro interno do servidor', details: error.message });
    }
  }

  async index(req, res) {
    try {
      const { companyId } = req.query;
      const whereClause = companyId ? { company_id: companyId } : {};
      const trips = await Trip.findAll({ where: whereClause });
      res.json(trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  }

  // 🔥 UPDATE - Atualizar viagem
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        origin,
        destination,
        departure_time,
        arrival_time,
        service_type,
        price,
        total_seats,
      } = req.body;

      // Verificar se a viagem existe
      const trip = await Trip.findByPk(id);

      if (!trip) {
        return res.status(404).json({ error: 'Viagem não encontrada' });
      }

      // Verificar se a empresa tem permissão (opcional, se for SUPER_ADMIN pode editar qualquer uma)
      if (req.userRole !== 'SUPER_ADMIN' && trip.company_id !== req.companyId) {
        return res.status(403).json({ error: 'Sem permissão para editar esta viagem' });
      }

      // Atualizar dados da viagem
      await trip.update({
        origin: origin || trip.origin,
        destination: destination || trip.destination,
        departure_time: departure_time || trip.departure_time,
        arrival_time: arrival_time || trip.arrival_time,
        service_type: service_type || trip.service_type,
        price: price || trip.price,
      });

      // Se total_seats foi informado e é diferente do atual, ajustar os assentos
      if (total_seats && total_seats !== trip.total_seats) {
        const currentSeats = await Seat.findAll({
          where: { trip_id: id },
          order: [['seat_number', 'ASC']]
        });

        const currentCount = currentSeats.length;

        if (total_seats > currentCount) {
          // Adicionar novos assentos
          const newSeats = [];
          for (let i = currentCount + 1; i <= total_seats; i++) {
            newSeats.push({
              trip_id: id,
              seat_number: i,
            });
          }
          await Seat.bulkCreate(newSeats);
        } else if (total_seats < currentCount) {
          // Verificar se os assentos a serem removidos estão ocupados
          const seatsToRemove = currentSeats.slice(total_seats);
          const seatsToRemoveIds = seatsToRemove.map(s => s.id);

          // Verificar se algum assento está reservado ou vendido
          const occupiedSeats = await ReservationSeat.findAll({
            where: {
              seat_id: seatsToRemoveIds,
              trip_id: id
            },
            include: [{
              model: Reservation,
              as: 'reservation',
              where: {
                status: {
                  [Op.in]: ['PENDING', 'PAID']
                }
              },
              required: true
            }]
          });

          if (occupiedSeats.length > 0) {
            return res.status(400).json({
              error: 'Não é possível reduzir o número de assentos pois alguns estão ocupados',
              occupiedSeats: occupiedSeats.map(s => s.seat_number)
            });
          }

          // Remover assentos excedentes
          await Seat.destroy({
            where: {
              id: seatsToRemoveIds
            }
          });
        }
      }

      // Buscar a viagem atualizada com os assentos
      const updatedTrip = await Trip.findByPk(id, {
        include: [{
          model: Seat,
          as: 'seats'
        }]
      });

      return res.json({
        message: 'Viagem atualizada com sucesso',
        trip: updatedTrip
      });

    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  // 🔥 DELETE - Excluir viagem
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se a viagem existe
      const trip = await Trip.findByPk(id);

      if (!trip) {
        return res.status(404).json({ error: 'Viagem não encontrada' });
      }

      // Verificar se a empresa tem permissão
      if (req.userRole !== 'SUPER_ADMIN' && trip.company_id !== req.companyId) {
        return res.status(403).json({ error: 'Sem permissão para excluir esta viagem' });
      }

      // Verificar se há reservas ativas (PENDING ou PAID)
      const activeReservations = await ReservationSeat.findOne({
        where: { trip_id: id },
        include: [{
          model: Reservation,
          as: 'reservation',
          where: {
            status: {
              [Op.in]: ['PENDING', 'PAID']
            }
          },
          required: true
        }]
      });

      if (activeReservations) {
        return res.status(400).json({
          error: 'Não é possível excluir viagem com reservas ativas. As reservas devem ser canceladas primeiro.'
        });
      }

      // Excluir assentos da viagem
      await Seat.destroy({ where: { trip_id: id } });

      // Excluir registros de reservation_seats (se houver, mas já foram verificados)
      await ReservationSeat.destroy({ where: { trip_id: id } });

      // Excluir a viagem
      await trip.destroy();

      return res.json({
        message: 'Viagem excluída com sucesso',
        deletedTripId: id
      });

    } catch (error) {
      console.error('Erro ao excluir viagem:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  async availableTimes(req, res) {
    const { origin, destination, date } = req.query;

    if (!origin || !destination || !date) {
      return res
        .status(400)
        .json({ error: 'Parâmetros obrigatórios: origin, destination, date' });
    }

    try {
      // 1. Buscar viagens que correspondem aos filtros
      const trips = await Trip.findAll({
        where: [
          { origin },
          { destination },
          Sequelize.where(fn('DATE', col('departure_time')), Op.eq, date),
        ],
        include: [
          {
            model: Seat,
            as: 'seats',
            required: false,
          },
        ],
      });

      // 2. Para cada viagem, verificar disponibilidade
      const availableTrips = [];

      for (const trip of trips) {
        const totalSeats = trip.seats ? trip.seats.length : 0;

        // Contar reservas ativas através da ReservationSeat
        const activeReservations = await ReservationSeat.count({
          where: {
            trip_id: trip.id
          },
          include: [
            {
              model: Reservation,
              as: 'reservation',
              where: {
                status: {
                  [Op.in]: ['PENDING', 'PAID']
                },
                expires_at: {
                  [Op.gt]: new Date()
                }
              },
              required: true
            }
          ]
        });

        // Se há assentos disponíveis, adicionar à lista
        if (totalSeats > activeReservations) {
          availableTrips.push({
            id: trip.id,
            departure_time: trip.departure_time,
            arrival_time: trip.arrival_time,
            price: trip.price,
            service_type: trip.service_type,
            available_seats: totalSeats - activeReservations,
          });
        }
      }

      return res.json(availableTrips);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  }
}

module.exports = new TripController();