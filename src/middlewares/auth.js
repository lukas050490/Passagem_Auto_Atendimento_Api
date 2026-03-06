const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, authConfig.secret);

    req.adminId = decoded.id;
    req.adminRole = decoded.role;
    req.companyId = decoded.company_id;
    console.log('middleware rodou');

    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
