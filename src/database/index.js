const Sequelize = require('sequelize');
const dbConfig = require('../config/database.cjs');

const Company = require('../app/models/Company.js');
const Admin = require('../app/models/Admin.js');
const Trip = require('../app/models/Trip.js');
const Seat = require('../app/models/Seat.js');
const Reservation = require('../app/models/Reservation.js');
const Payment = require('../app/models/Payment.js');
const Ticket = require('../app/models/Ticket.js');
const ReservationSeat = require('../app/models/ReservationSeat.js');

const models = [Company, Admin, Trip, Seat, Reservation, Payment, Ticket, ReservationSeat];

class Database {
  constructor() {
    this.init();
  }

  init() {
    const env = process.env.NODE_ENV || 'development';

    this.connection = new Sequelize(dbConfig[env]);

    models.forEach((model) => {
      model.init(this.connection);
    });

    // 2️⃣ Associa models
    models.forEach((model) => {
      if (model.associate) {
        model.associate(this.connection.models);
      }
    });
  }
}

module.exports = new Database();
