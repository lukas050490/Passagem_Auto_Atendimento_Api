
const express = require('express');
const authMiddleware = require('../middlewares/auth');
const AuthController = require('../controllers/AuthController');
const AdminController = require('../controllers/AdminController');
const CompanyController = require('../controllers/CompanyController');
const TripController = require('../controllers/TripController');
const SeatController = require('../controllers/SeatController');
const ReservationController = require('../controllers/ReservationController');
const PaymentController = require('../controllers/PaymentController');
const TicketController = require('../controllers/TicketController');
const ReportsController = require('../controllers/ReportsController');

const routes = express.Router();

// ========== ROTAS PÚBLICAS (NÃO REQUEREM AUTENTICAÇÃO) ==========
routes.post('/login', AuthController.login);
routes.get('/trips/:tripId/available', SeatController.available);
routes.get('/trips', TripController.index);
routes.get('/companies', CompanyController.index);
routes.get('/trips/available-times', TripController.availableTimes);
routes.post('/reservations', ReservationController.create);
routes.post('/payments', PaymentController.create);
routes.get('/tickets/:reservation_id', TicketController.show);

// Rotas de reserva temporária (públicas)
routes.post('/trips/:tripId/seats/reserve', SeatController.reserve);
routes.post('/trips/:tripId/seats/release', SeatController.release);
routes.post('/trips/:tripId/seats/confirm', SeatController.confirm);
routes.post('/sessions/cleanup', SeatController.cleanupSession);

// ========== MIDDLEWARE DE AUTENTICAÇÃO ==========
// Todas as rotas abaixo desta linha exigem token
routes.use(authMiddleware);

// ========== ROTAS PROTEGIDAS (REQUEREM AUTENTICAÇÃO) ==========

// Rotas de administradores (apenas super admin)
routes.get('/admins', AdminController.index);
routes.post('/admins', AdminController.create);
routes.put('/admins/:id', AdminController.update);
routes.delete('/admins/:id', AdminController.delete);

// Rotas de empresas (protegidas)
routes.post('/companies', CompanyController.create);
routes.put('/companies/:id', CompanyController.update);
routes.delete('/companies/:id', CompanyController.delete);

// Rotas de viagens (protegidas)
routes.post('/trips', TripController.store);
routes.put('/trips/:id', TripController.update);
routes.delete('/trips/:id', TripController.delete);

// NOVAS ROTAS: Reservas
routes.get('/reservations', ReservationController.index);
routes.get('/reservations/:id', ReservationController.show);
routes.put('/reservations/:id/status', ReservationController.updateStatus);

// NOVAS ROTAS: Relatórios
routes.get('/reports', ReportsController.index);
routes.get('/reports/export', ReportsController.export);

module.exports = routes;