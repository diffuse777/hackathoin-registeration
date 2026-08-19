const Admin = require('../models/Admin');

async function findByEmail(email, { includePasswordHash = false } = {}) {
  const query = Admin.findOne({ email: String(email).toLowerCase().trim() });

  if (includePasswordHash) {
    query.select('+passwordHash');
  }

  return query;
}

async function findById(id, { includePasswordHash = false } = {}) {
  const query = Admin.findById(id);

  if (includePasswordHash) {
    query.select('+passwordHash');
  }

  return query;
}

async function create(adminData) {
  return Admin.create(adminData);
}

module.exports = {
  findByEmail,
  findById,
  create,
};
