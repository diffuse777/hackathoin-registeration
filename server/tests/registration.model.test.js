require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { loadEnv } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const Registration = require('../models/Registration');
const {
  REGISTRATION_FEE_PER_PARTICIPANT,
  STUDENT_TYPES,
  PAYMENT_STATUSES,
} = require('../utils/constants');

function hostelMember(overrides = {}) {
  return {
    name: 'Asha Kumar',
    registerNumber: '21CS1001',
    department: 'CSE',
    section: 'A',
    phone: '9876543210',
    email: 'asha.kumar@college.edu',
    studentType: STUDENT_TYPES.HOSTEL,
    hostelName: 'Kaveri',
    roomNumber: '102',
    ...overrides,
  };
}

function dayScholarMember(overrides = {}) {
  return {
    name: 'Rahul Menon',
    registerNumber: '21CS1002',
    department: 'CSE',
    section: 'B',
    phone: '9876543211',
    email: 'rahul.menon@college.edu',
    studentType: STUDENT_TYPES.DAY_SCHOLAR,
    ...overrides,
  };
}

function buildRegistration(overrides = {}) {
  const members = overrides.members || [hostelMember(), dayScholarMember()];

  return {
    teamName: 'Byte Forge',
    memberCount: members.length,
    members,
    totalAmount: 1,
    paymentStatus: PAYMENT_STATUSES.PENDING,
    ...overrides,
    members,
    memberCount: overrides.memberCount ?? members.length,
  };
}

async function validate(payload) {
  const doc = new Registration(payload);
  await doc.validate();
  return doc;
}

async function getValidationError(payload) {
  try {
    await validate(payload);
    return null;
  } catch (error) {
    return error;
  }
}

function errorPaths(error) {
  return Object.keys(error?.errors || {});
}

describe('Registration model', () => {
  before(async () => {
    const config = loadEnv();
    await connectDB(config.mongoUri);
    await Registration.syncIndexes();
  });

  after(async () => {
    await disconnectDB();
  });

  it('accepts a valid mixed hostel and day-scholar team', async () => {
    const doc = await validate(buildRegistration());

    assert.equal(doc.members.length, 2);
    assert.equal(doc.memberCount, 2);
    assert.equal(doc.paymentStatus, PAYMENT_STATUSES.PENDING);
    assert.equal(doc.payment.paymentStatus, PAYMENT_STATUSES.PENDING);
  });

  it('rejects an invalid studentType', async () => {
    const error = await getValidationError(
      buildRegistration({
        members: [hostelMember({ studentType: 'PG' })],
        memberCount: 1,
      })
    );

    assert.ok(error);
    assert.ok(errorPaths(error).includes('members.0.studentType'));
  });

  it('rejects a hostel student without hostelName', async () => {
    const error = await getValidationError(
      buildRegistration({
        members: [hostelMember({ hostelName: '' })],
        memberCount: 1,
      })
    );

    assert.ok(error);
    assert.ok(errorPaths(error).some((path) => path.endsWith('hostelName')));
  });

  it('rejects a hostel student without roomNumber', async () => {
    const error = await getValidationError(
      buildRegistration({
        members: [hostelMember({ roomNumber: '' })],
        memberCount: 1,
      })
    );

    assert.ok(error);
    assert.ok(errorPaths(error).some((path) => path.endsWith('roomNumber')));
  });

  it('does not require hostel details for a day scholar', async () => {
    const doc = await validate(
      buildRegistration({
        members: [dayScholarMember({ hostelName: undefined, roomNumber: undefined })],
        memberCount: 1,
      })
    );

    assert.equal(doc.members[0].studentType, STUDENT_TYPES.DAY_SCHOLAR);
    assert.equal(doc.members[0].hostelName, undefined);
    assert.equal(doc.members[0].roomNumber, undefined);
  });

  it('clears hostel details when studentType is DAY_SCHOLAR', async () => {
    const doc = await validate(
      buildRegistration({
        members: [
          dayScholarMember({
            hostelName: 'Should Not Persist',
            roomNumber: '999',
          }),
        ],
        memberCount: 1,
      })
    );

    assert.equal(doc.members[0].hostelName, undefined);
    assert.equal(doc.members[0].roomNumber, undefined);
  });

  it('rejects zero participants', async () => {
    const error = await getValidationError(
      buildRegistration({
        members: [],
        memberCount: 0,
      })
    );

    assert.ok(error);
    assert.ok(errorPaths(error).includes('memberCount') || errorPaths(error).includes('members'));
  });

  it('rejects a memberCount mismatch', async () => {
    const error = await getValidationError(
      buildRegistration({
        members: [hostelMember()],
        memberCount: 2,
      })
    );

    assert.ok(error);
    assert.ok(errorPaths(error).includes('memberCount') || errorPaths(error).includes('members'));
  });

  it('derives totalAmount from memberCount and ignores client amount', async () => {
    const doc = await validate(
      buildRegistration({
        members: [hostelMember(), dayScholarMember()],
        memberCount: 2,
        totalAmount: 1,
      })
    );

    assert.equal(doc.totalAmount, 2 * REGISTRATION_FEE_PER_PARTICIPANT);
    assert.equal(doc.totalAmount, 700);
  });

  it('persists a valid registration to MongoDB and then removes it', async () => {
    const suffix = Date.now().toString(36).toUpperCase();
    const payload = buildRegistration({
      teamName: `Model Test ${suffix}`,
      members: [
        hostelMember({
          registerNumber: `MT${suffix}A`,
          email: `mt-${suffix}-a@college.edu`,
        }),
        dayScholarMember({
          registerNumber: `MT${suffix}B`,
          email: `mt-${suffix}-b@college.edu`,
        }),
      ],
    });

    const created = await Registration.create(payload);

    try {
      assert.equal(created.totalAmount, 2 * REGISTRATION_FEE_PER_PARTICIPANT);
      assert.ok(created.createdAt instanceof Date);
      assert.equal(created.paymentStatus, PAYMENT_STATUSES.PENDING);
    } finally {
      await Registration.deleteOne({ _id: created._id });
    }
  });
});
