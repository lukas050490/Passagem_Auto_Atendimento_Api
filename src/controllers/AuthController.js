const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Admin = require('../app/models/Admin.js');
const authConfig = require('../config/auth.js');

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    return res.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        company_id: admin.company_id,
      },
      token: jwt.sign(
        { id: admin.id, role: admin.role, company_id: admin.company_id },
        authConfig.secret,
        { expiresIn: authConfig.expiresIn },
      ),
    });
  }
}

module.exports = new AuthController();
