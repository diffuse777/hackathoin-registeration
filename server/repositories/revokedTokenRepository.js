const RevokedToken = require('../models/RevokedToken');

async function revoke({ jti, expiresAt }) {
  await RevokedToken.updateOne({ jti }, { $set: { jti, expiresAt } }, { upsert: true });
}

async function isRevoked(jti) {
  if (!jti) {
    return true;
  }

  const record = await RevokedToken.findOne({ jti }).lean();
  return Boolean(record);
}

module.exports = {
  revoke,
  isRevoked,
};
