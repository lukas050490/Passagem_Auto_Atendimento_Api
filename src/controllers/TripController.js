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


  async availableTimes(req, res) {
    const { origin, destination, date } = req.query;

    console.log('Parâmetros recebidos:', { origin, destination, date });

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

      console.log(`Encontradas ${trips.length} viagens`);

      // 2. Para cada viagem, verificar disponibilidade
      const availableTrips = [];

      for (const trip of trips) {
        const totalSeats = trip.seats ? trip.seats.length : 0;

        // CORREÇÃO AQUI: Contar reservas ativas através da ReservationSeat
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

        console.log(
          `Trip ${trip.id}: totalSeats=${totalSeats}, activeReservations=${activeReservations}`,
        );

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
