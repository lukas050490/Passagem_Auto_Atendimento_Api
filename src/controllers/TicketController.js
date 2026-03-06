const Ticket = require('../app/models/Ticket.js');

class TicketController {
  async show(req, res) {
    const { reservation_id } = req.params;

    const ticket = await Ticket.findOne({
      where: { reservation_id },
    });

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket não encontrado',
      });
    }

    return res.json(ticket);
  }
}

module.exports = new TicketController();
