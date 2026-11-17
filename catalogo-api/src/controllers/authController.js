const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/userRepository');
const { sanitizeUser } = require('../models/user');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function register(req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'El correo no es válido' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const existingUser = await userRepository.findUserByEmail(email);

  if (existingUser) {
    return res.status(409).json({ message: 'El correo ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({
    name,
    email,
    passwordHash,
    role: 'usuario',
  });

  return res.status(201).json({
    message: 'Usuario registrado correctamente',
    user: sanitizeUser(user),
  });
}

async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'El correo no es válido' });
  }

  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );

  return res.json({
    token,
    user: sanitizeUser(user),
  });
}

module.exports = {
  register,
  login,
};
