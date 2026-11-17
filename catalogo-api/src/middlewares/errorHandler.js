function notFoundHandler(req, res) {
  return res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.originalUrl,
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  const statusCode = error.statusCode || 500;
  const message = statusCode < 500 ? error.message : 'Error interno del servidor';

  return res.status(statusCode).json({ message });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
