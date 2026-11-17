function notFoundHandler(req, res) {
  return res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.originalUrl,
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  return res.status(error.statusCode || 500).json({
    message: error.message || 'Error interno del servidor',
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
