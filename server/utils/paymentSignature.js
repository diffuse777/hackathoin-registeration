const crypto = require('crypto');

function toBuffer(value) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  return Buffer.from(String(value), 'utf8');
}

function hmacSha256Hex(secret, payload) {
  return crypto.createHmac('sha256', secret).update(toBuffer(payload)).digest('hex');
}

function signaturesMatch(expected, received) {
  if (!expected || !received) {
    return false;
  }

  const expectedBuffer = toBuffer(expected);
  const receivedBuffer = toBuffer(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function verifyHmacSha256Signature(secret, payload, signature) {
  const expected = hmacSha256Hex(secret, payload);
  return signaturesMatch(expected, signature);
}

module.exports = {
  hmacSha256Hex,
  signaturesMatch,
  verifyHmacSha256Signature,
};
