/**
 * AuditLog model (collection: audit_logs).
 * Records administrative and security events for governance, transparency, and accountability.
 * NEVER stores financial data, passwords, or tokens.
 */
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'adminId is required'],
      index: true,
    },
    adminEmail: {
      type: String,
      required: [true, 'adminEmail is required'],
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: [true, 'action is required'],
      trim: true,
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetUserEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

auditLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
