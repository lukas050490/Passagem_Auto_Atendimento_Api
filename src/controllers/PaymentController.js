const Payment = require('../app/models/Payment.js');
const Reservation = require('../app/models/Reservation.js');
const Ticket = require('../app/models/Ticket.js');
const QRCode = require('qrcode');

class PaymentController {
  async create(req, res) {
    try {
      const { reservation_id, method, amount } = req.body;

      // Validações básicas
      if (!reservation_id || !method || !amount) {
        return res.status(400).json({
          error: 'Campos obrigatórios: reservation_id, method, amount'
        });
      }

      // 1️⃣ Busca reserva
      const reservation = await Reservation.findByPk(reservation_id);

      if (!reservation) {
        return res.status(404).json({ error: 'Reserva não encontrada' });
      }

      // 2️⃣ Verifica status
      if (reservation.status !== 'PENDING') {
        return res.status(400).json({
          error: `Reserva não está disponível para pagamento. Status atual: ${reservation.status}`,
        });
      }

      // 3️⃣ Verifica expiração
      if (new Date() > reservation.expires_at) {
        await reservation.update({ status: 'EXPIRED' });
        return res.status(400).json({
          error: 'Reserva expirada',
        });
      }

      // 4️⃣ Cria pagamento
      const payment = await Payment.create({
        reservation_id,
        amount,
        method,
        status: 'PAID',
        paid_at: new Date(),
      });

      // 5️⃣ Atualiza reserva
      await reservation.update({ status: 'PAID' });

      // 6️⃣ Gerar QR Code
      const qrContent = JSON.stringify({
        reservation_id,
        passenger_cpf: reservation.passenger_cpf,
        issued_at: new Date(),
      });

      const qrCode = await QRCode.toDataURL(qrContent);

      // 7️⃣ Criar ticket (CORREÇÃO: salvar a variável)
      const ticket = await Ticket.create({
        reservation_id,
        qr_code: qrCode,
        issued_at: new Date(),
      });

      return res.status(201).json({
        message: 'Pagamento realizado com sucesso',
        payment,
        ticket,  // Agora ticket está definido!
      });

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      return res.status(500).json({
        error: 'Erro interno ao processar pagamento',
        details: error.message
      });
    }
  }
}

module.exports = new PaymentController();