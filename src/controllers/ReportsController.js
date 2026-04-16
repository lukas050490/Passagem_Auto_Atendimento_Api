// src/controllers/ReportsController.js
const { Op } = require('sequelize');
const sequelize = require('../config/sequelize.cjs');
const Reservation = require('../app/models/Reservation');
const ReservationSeat = require('../app/models/ReservationSeat');
const Trip = require('../app/models/Trip');
const Company = require('../app/models/Company');

class ReportsController {
    async index(req, res) {
        try {
            const { company_id, start_date, end_date } = req.query;

            if (!company_id) {
                return res.status(400).json({ error: 'company_id é obrigatório' });
            }

            // Configurar período
            const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
            const endDate = end_date ? new Date(end_date + ' 23:59:59') : new Date();

            // Buscar todas as viagens da empresa no período
            const trips = await Trip.findAll({
                where: {
                    company_id,
                    departure_time: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                attributes: ['id', 'origin', 'destination', 'departure_time', 'price']
            });

            const tripIds = trips.map(t => t.id);

            // Buscar reservas pagas
            const paidReservations = await Reservation.findAll({
                where: {
                    status: 'PAID',
                    created_at: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: ReservationSeat,
                        as: 'reservation_seats',
                        where: {
                            trip_id: { [Op.in]: tripIds }
                        },
                        required: true,
                        include: [
                            {
                                model: Trip,
                                as: 'trip'
                            }
                        ]
                    }
                ]
            });

            // Calcular estatísticas
            let totalRevenue = 0;
            let totalSeatsSold = 0;

            paidReservations.forEach(res => {
                res.reservation_seats.forEach(rs => {
                    if (rs.trip && rs.trip.price) {
                        totalRevenue += parseFloat(rs.trip.price);
                        totalSeatsSold++;
                    }
                });
            });

            // Buscar reservas recentes
            const recentReservations = await Reservation.findAll({
                where: {
                    created_at: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: ReservationSeat,
                        as: 'reservation_seats',
                        where: {
                            trip_id: { [Op.in]: tripIds }
                        },
                        required: true,
                        include: [
                            {
                                model: Trip,
                                as: 'trip',
                                attributes: ['origin', 'destination', 'price']
                            }
                        ]
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: 10
            });

            // Formatar reservas recentes
            const formattedRecentReservations = recentReservations.map(res => {
                let amount = 0;
                let tripInfo = null;

                res.reservation_seats.forEach(rs => {
                    if (rs.trip) {
                        amount += parseFloat(rs.trip.price);
                        tripInfo = rs.trip;
                    }
                });

                return {
                    id: res.id,
                    passenger_cpf: res.passenger_cpf,
                    status: res.status,
                    created_at: res.created_at,
                    amount: amount,
                    trip: tripInfo
                };
            });

            return res.json({
                stats: {
                    totalTrips: trips.length,
                    totalReservations: paidReservations.length,
                    totalPaid: paidReservations.length,
                    totalRevenue: totalRevenue,
                    occupancyRate: trips.length > 0 ? (totalSeatsSold / (trips.length * 40)) * 100 : 0,
                    totalSeatsSold: totalSeatsSold,
                    totalSeatsAvailable: trips.length * 40
                },
                recentReservations: formattedRecentReservations,
                trips: trips
            });
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            return res.status(500).json({ error: 'Erro ao gerar relatório' });
        }
    }

    async export(req, res) {
        try {
            const { company_id, start_date, end_date } = req.query;

            if (!company_id) {
                return res.status(400).json({ error: 'company_id é obrigatório' });
            }

            const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
            const endDate = end_date ? new Date(end_date + ' 23:59:59') : new Date();

            const reservations = await Reservation.findAll({
                where: {
                    status: 'PAID',
                    created_at: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: ReservationSeat,
                        as: 'reservation_seats',
                        include: [
                            {
                                model: Trip,
                                as: 'trip',
                                where: { company_id },
                                required: true,
                                attributes: ['origin', 'destination', 'departure_time', 'price']
                            },
                            {
                                model: Seat,
                                as: 'seat',
                                attributes: ['seat_number']
                            }
                        ]
                    }
                ]
            });

            // Gerar CSV
            let csv = 'Data da Reserva,CPF Passageiro,Origem,Destino,Data da Viagem,Assento,Valor\n';

            reservations.forEach(res => {
                res.reservation_seats.forEach(rs => {
                    if (rs.trip) {
                        csv += `${new Date(res.created_at).toLocaleDateString('pt-BR')},`;
                        csv += `${res.passenger_cpf},`;
                        csv += `${rs.trip.origin},`;
                        csv += `${rs.trip.destination},`;
                        csv += `${new Date(rs.trip.departure_time).toLocaleDateString('pt-BR')},`;
                        csv += `${rs.seat?.seat_number || 'N/A'},`;
                        csv += `${parseFloat(rs.trip.price).toFixed(2)}\n`;
                    }
                });
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=relatorio_${start_date}_a_${end_date}.csv`);
            return res.send(csv);
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            return res.status(500).json({ error: 'Erro ao exportar relatório' });
        }
    }
}

module.exports = new ReportsController();