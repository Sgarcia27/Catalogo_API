const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticateToken(req, res, next) {
  const authorizationHeader = req.headers.authorization || '';
  const token = authorizationHeader.startsWith('Bearer ') ? authorizationHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    const isExpired = error && error.name === 'TokenExpiredError';
    return res.status(401).json({
      message: isExpired ? 'Token expirado' : 'Token inválido',
    });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
