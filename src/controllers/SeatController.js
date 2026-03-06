
const { Op } = require('sequelize');
const Seat = require('../app/models/Seat.js');
const ReservationSeat = require('../app/models/ReservationSeat.js');
const Reservation = require('../app/models/Reservation.js');

class SeatController {
  async available(req, res) {
    const { tripId } = req.params;

    try {
      // 1️⃣ buscar reservas ativas através da ReservationSeat
      const activeReservationSeats = await ReservationSeat.findAll({
        where: {
          trip_id: tripId
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
            required: true
          }
        ],
        attributes: ['seat_id'],
      });

      const reservedSeatIds = activeReservationSeats.map((rs) => rs.seat_id);

      // 2️⃣ buscar assentos livres
      const whereCondition = {
        trip_id: tripId,
      };

      if (reservedSeatIds.length > 0) {
        whereCondition.id = {
          [Op.notIn]: reservedSeatIds,
        };
      }

      const seats = await Seat.findAll({
        where: whereCondition,
        order: [['seat_number', 'ASC']],
      });

      return res.json(seats);
    } catch (error) {
      console.error('Erro ao buscar assentos disponíveis:', error);
      return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  }
}

module.exports = new SeatController();