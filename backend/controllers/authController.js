/** HTTP layer for authentication. Business logic lives in services/authService.js. */
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

// Only these three fields are taken from the body (whitelist), nothing else.
const pick = (body, keys) => Object.fromEntries(keys.map((k) => [k, body[k]]));

/** POST /api/auth/register -> 201 { user, token } */
exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(pick(req.body, ['name', 'email', 'password']));
  res.status(201).json({ success: true, data: { user, token } });
});

/** POST /api/auth/login -> 200 { user, token } */
exports.login = asyncHandler(async (req, res) => {
  const reqMeta = { ip: req.ip || req.connection.remoteAddress || '', userAgent: req.get('user-agent') || '' };
  const { user, token } = await authService.login(pick(req.body, ['email', 'password']), reqMeta);
  res.status(200).json({ success: true, data: { user, token } });
});

/**
 * POST /api/auth/logout
 * Tokens are stateless, so logging out means the CLIENT discards its token (approved design).
 * This endpoint needs no valid token on purpose: a client with an expired token must still be
 * able to log out cleanly. It exists for API completeness and so the client has one call to make.
 */
exports.logout = asyncHandler(async (req, res) => {
  if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = authService.verifyToken(token);
      if (decoded && decoded.id) {
        const User = require('../models/User');
        const user = await User.findById(decoded.id).select('email role');
        if (user && user.role === 'admin') {
          const AuditLog = require('../models/AuditLog');
          await AuditLog.create({
            adminId: user._id,
            adminEmail: user.email,
            action: 'ADMIN_LOGOUT',
            details: { message: 'Administrator logged out' },
            ipAddress: req.ip || req.connection.remoteAddress || '',
            userAgent: req.get('user-agent') || '',
          }).catch(() => {});
        }
      }
    } catch (_) {}
  }
  res.status(200).json({ success: true, message: 'Logged out. The client should discard its token.' });
});

/** GET /api/auth/me (protected) -> the authenticated user's own profile */
exports.me = (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

/** PUT /api/auth/password (protected) -> update password */
exports.changePassword = asyncHandler(async (req, res) => {
  const reqMeta = {
    ip: req.ip || req.connection.remoteAddress || '',
    userAgent: req.get('user-agent') || '',
  };
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(
    req.user._id,
    { currentPassword, newPassword },
    reqMeta
  );
  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    data: result,
  });
});

/** PUT /api/auth/profile (protected) -> update profile name */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await authService.updateProfile(req.user._id, { name });
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

