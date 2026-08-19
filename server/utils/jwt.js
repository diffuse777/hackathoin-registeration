const jwt = require('jsonwebtoken');

function signToken(payload, { secret, expiresIn, jwtid }) {
  const options = { expiresIn, algorithm: 'HS256' };

  if (jwtid) {
    options.jwtid = jwtid;
  }

  return jwt.sign(payload, secret, options);
}

function verifyToken(token, { secret }) {
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
