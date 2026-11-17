const express = require('express');
const config = require('./config');
const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const productsRouter = require('./routes/products');
const favoritesRouter = require('./routes/favorites');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();
const databaseReady = initDatabase();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API funcionando correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRouter);
app.use('/api/productos', productsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/favoritos', favoritesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(port = config.port) {
  await databaseReady;

  return app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
  databaseReady,
};
