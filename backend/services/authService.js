/**
 * Authentication business logic: registration, login, and JWT creation/verification.
 * Controllers call this; it knows nothing about HTTP requests/responses.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const JWT_ALGORITHM = 'HS256';
// One generic message for "unknown email" and "wrong password" so the API does not
// reveal which emails have accounts.
const INVALID_CREDENTIALS = 'Invalid email or password';

/** jsonwebtoken treats a bare number string like "7200" as MILLISECONDS; treat it as seconds. */
function expiresInValue() {
  const v = config.jwtExpiresIn;
  return /^\d+$/.test(v) ? Number(v) : v;
}

function signToken(userId) {
  return jwt.sign({}, config.jwtSecret, {
    subject: String(userId), // "sub" claim = the user's _id. This is the ONLY identity the API trusts.
    expiresIn: expiresInValue(),
    algorithm: JWT_ALGORITHM,
  });
}

/** Returns the decoded payload or throws a 401 AppError. Pins the algorithm (blocks "alg: none" tokens). */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: [JWT_ALGORITHM] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Your session has expired. Please log in again.');
    }
    throw AppError.unauthorized('Invalid authentication token');
  }
}

async function register({ name, email, password }) {
  const existing = await User.exists({ email });
  if (existing) throw duplicateEmailError();

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  let user;
  try {
    // Explicitly guarantee role is 'user' and status is 'active' for public registration
    user = await User.create({ name, email, passwordHash, role: 'user', status: 'active' });
  } catch (err) {
    // Two registrations for the same email at the same instant: the unique index rejects the second.
    if (err.code === 11000) throw duplicateEmailError();
    throw err;
  }
  return { user, token: signToken(user._id) };
}

function duplicateEmailError() {
  const message = 'An account with this email already exists';
  return AppError.conflict(message, { fields: { email: message } });
}

// Hash used to burn the same CPU time when the email is unknown, so response time
// does not reveal whether an account exists. Computed once, lazily.
let dummyHashPromise;
function getDummyHash() {
  if (!dummyHashPromise) dummyHashPromise = bcrypt.hash('artha-dummy-password', config.bcryptRounds);
  return dummyHashPromise;
}

async function login({ email, password }, reqMeta = {}) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const hash = user ? user.passwordHash : await getDummyHash();
  const passwordMatches = await bcrypt.compare(password, hash);

  if (!user || !passwordMatches) throw AppError.unauthorized(INVALID_CREDENTIALS);

  if (user.status === 'suspended') {
    throw AppError.forbidden('Your account has been suspended. Please contact an administrator.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  if (user.role === 'admin') {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      adminId: user._id,
      adminEmail: user.email,
      action: 'ADMIN_LOGIN',
      details: { message: 'Administrator logged in' },
      ipAddress: reqMeta.ip || '',
      userAgent: reqMeta.userAgent || '',
    }).catch(() => {});
  }

  return { user, token: signToken(user._id) };
}

async function changePassword(userId, { currentPassword, newPassword }, reqMeta = {}) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw AppError.notFound('User not found');
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.badRequest('Current password is incorrect', {
      fields: { currentPassword: 'Current password is incorrect' },
    });
  }

  const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (samePassword) {
    throw AppError.badRequest('New password cannot be the same as your current password', {
      fields: { newPassword: 'New password cannot be the same as your current password' },
    });
  }

  user.passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
  await user.save();

  if (user.role === 'admin') {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      adminId: user._id,
      adminEmail: user.email,
      action: 'ADMIN_PASSWORD_CHANGE',
      details: { message: 'Administrator changed account password' },
      ipAddress: reqMeta.ip || '',
      userAgent: reqMeta.userAgent || '',
    }).catch(() => {});
  }

  return { user, token: signToken(user._id) };
}

async function updateProfile(userId, { name }) {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  user.name = name.trim();
  await user.save();
  return user;
}

module.exports = {
  register,
  login,
  changePassword,
  updateProfile,
  signToken,
  verifyToken,
  expiresInValue,
};

