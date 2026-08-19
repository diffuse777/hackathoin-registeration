const mongoose = require('mongoose');
const { ADMIN_ROLES } = require('../utils/constants');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ADMIN_ROLES),
      default: ADMIN_ROLES.ADMIN,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

adminSchema.set('toJSON', {
  transform(_doc, ret) {
    const value = { ...ret };
    delete value.passwordHash;
    return value;
  },
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
