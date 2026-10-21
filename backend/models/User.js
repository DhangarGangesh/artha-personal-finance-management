/**
 * User model. A user is identified by its own _id (it has no userId field; the other
 * collections - transactions, budgets, goals, alerts - reference this _id as userId).
 *
 * Only the bcrypt HASH of the password is stored, and it is excluded from every query
 * by default (select: false) and from every JSON serialization (toJSON below), so a
 * password hash cannot be returned to the frontend by accident.
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email must be at most 254 characters'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be user or admin',
      },
      default: 'user',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended'],
        message: 'Status must be active or suspended',
      },
      default: 'active',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique index = the database-level guarantee against duplicate accounts
// (also protects against two simultaneous registrations racing past the app-level check).
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

function sanitize(doc, ret) {
  delete ret.passwordHash;
  delete ret.__v;
  return ret;
}
userSchema.set('toJSON', { transform: sanitize });
userSchema.set('toObject', { transform: sanitize });

module.exports = mongoose.model('User', userSchema);
