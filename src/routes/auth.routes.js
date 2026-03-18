const express = require('express');
const authMiddleware = require('../middlewares/auth.js');
const AuthController = require('../controllers/AuthController');
const CompanyController = require('../controllers/CompanyController');
const TripController = require('../controllers/TripController');
const SeatController = require('../controllers/SeatController');
const ReservationController = require('../controllers/ReservationController');
const PaymentController = require('../controllers/PaymentController');
const TicketController = require('../controllers/TicketController');

const routes = express.Router();

// Rotas públicas
routes.post('/login', AuthController.login);
routes.get('/trips/:tripId/available', SeatController.available);
routes.get('/trips', TripController.index);
routes.get('/companies', CompanyController.index);
routes.get('/trips/available-times', TripController.availableTimes);
routes.post('/reservations', ReservationController.create);
routes.post('/payments', PaymentController.create);
routes.get('/tickets/:reservation_id', TicketController.show);

// Novas rotas para reserva temporária
routes.post('/trips/:tripId/seats/reserve', SeatController.reserve);
routes.post('/trips/:tripId/seats/release', SeatController.release);
routes.post('/trips/:tripId/seats/confirm', SeatController.confirm);
routes.post('/sessions/cleanup', SeatController.cleanupSession);

// Rotas protegidas (requerem autenticação)
routes.use(authMiddleware);

routes.post('/companies', CompanyController.create);
routes.post('/trips', TripController.store);

module.exports = routes;