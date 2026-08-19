const Registration = require('../models/Registration');
const { PAYMENT_STATUSES } = require('../utils/constants');

const ACTIVE_PAYMENT_STATUSES = [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID];

async function create(registrationData) {
  return Registration.create(registrationData);
}

async function findById(id) {
  return Registration.findById(id);
}

async function findByPaymentOrderId(paymentOrderId) {
  if (!paymentOrderId) {
    return null;
  }

  return Registration.findOne({ 'payment.paymentOrderId': paymentOrderId });
}

async function setPaymentOrder({ registrationId, paymentOrderId, paymentStatus = PAYMENT_STATUSES.PENDING }) {
  return Registration.findByIdAndUpdate(
    registrationId,
    {
      $set: {
        paymentStatus,
        'payment.paymentOrderId': paymentOrderId,
        'payment.paymentStatus': paymentStatus,
        'payment.paymentTransactionId': null,
        'payment.paidAt': null,
      },
    },
    { new: true }
  );
}

async function markPaidAtomic({ paymentOrderId, paymentTransactionId, paidAt }) {
  return Registration.findOneAndUpdate(
    {
      'payment.paymentOrderId': paymentOrderId,
      paymentStatus: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.FAILED] },
    },
    {
      $set: {
        paymentStatus: PAYMENT_STATUSES.PAID,
        'payment.paymentStatus': PAYMENT_STATUSES.PAID,
        'payment.paymentTransactionId': paymentTransactionId,
        'payment.paidAt': paidAt,
      },
    },
    { new: true }
  );
}

async function markFailedAtomic({ paymentOrderId, paymentTransactionId }) {
  return Registration.findOneAndUpdate(
    {
      'payment.paymentOrderId': paymentOrderId,
      paymentStatus: PAYMENT_STATUSES.PENDING,
    },
    {
      $set: {
        paymentStatus: PAYMENT_STATUSES.FAILED,
        'payment.paymentStatus': PAYMENT_STATUSES.FAILED,
        'payment.paymentTransactionId': paymentTransactionId || null,
      },
    },
    { new: true }
  );
}

async function findActiveByParticipantKeys({ registerNumbers, emails }) {
  if ((!registerNumbers || registerNumbers.length === 0) && (!emails || emails.length === 0)) {
    return [];
  }

  const orConditions = [];

  if (registerNumbers?.length) {
    orConditions.push({ 'members.registerNumber': { $in: registerNumbers } });
  }

  if (emails?.length) {
    orConditions.push({ 'members.email': { $in: emails } });
  }

  return Registration.find({
    paymentStatus: { $in: ACTIVE_PAYMENT_STATUSES },
    $or: orConditions,
  })
    .select('teamName paymentStatus members.registerNumber members.email')
    .lean();
}

async function deleteById(id) {
  return Registration.findByIdAndDelete(id);
}

async function deleteByIds(ids) {
  if (!ids?.length) {
    return;
  }

  await Registration.deleteMany({ _id: { $in: ids } });
}

const ADMIN_LIST_FIELDS = 'teamName memberCount totalAmount paymentStatus createdAt';

async function findAdminPage({ filter, skip, limit }) {
  return Registration.find(filter)
    .select(ADMIN_LIST_FIELDS)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

async function countByFilter(filter) {
  return Registration.countDocuments(filter);
}

async function sumParticipantsByFilter(filter) {
  const [result] = await Registration.aggregate([
    { $match: filter },
    { $group: { _id: null, totalParticipants: { $sum: '$memberCount' } } },
  ]);

  return result?.totalParticipants || 0;
}

async function findByIdLean(id) {
  return Registration.findById(id).lean();
}

const EXPORT_BATCH_SIZE = 200;

function createExportCursor({ teamFilter, participantMatch }) {
  const pipeline = [{ $match: teamFilter }, { $unwind: '$members' }];

  if (participantMatch && Object.keys(participantMatch).length > 0) {
    pipeline.push({ $match: participantMatch });
  }

  pipeline.push(
    { $sort: { createdAt: -1, teamName: 1, 'members.registerNumber': 1 } },
    {
      $project: {
        _id: 0,
        teamName: 1,
        memberCount: 1,
        participantName: '$members.name',
        registerNumber: '$members.registerNumber',
        department: '$members.department',
        section: '$members.section',
        phone: '$members.phone',
        email: '$members.email',
        studentType: '$members.studentType',
        hostelName: { $ifNull: ['$members.hostelName', ''] },
        roomNumber: { $ifNull: ['$members.roomNumber', ''] },
        totalAmount: 1,
        paymentStatus: 1,
        createdAt: 1,
      },
    }
  );

  return Registration.aggregate(pipeline).allowDiskUse(true).cursor({ batchSize: EXPORT_BATCH_SIZE });
}

const TEAM_EXPORT_BATCH_SIZE = 50;

function createTeamExportCursor(teamFilter) {
  return Registration.find(teamFilter)
    .select('teamName memberCount totalAmount paymentStatus createdAt members.name members.registerNumber members.department members.section members.phone members.email members.studentType members.hostelName members.roomNumber')
    .sort({ createdAt: -1, teamName: 1 })
    .lean()
    .cursor({ batchSize: TEAM_EXPORT_BATCH_SIZE });
}

async function findByPaymentTransactionId(paymentTransactionId) {
  if (!paymentTransactionId) {
    return null;
  }

  return Registration.findOne({ 'payment.paymentTransactionId': paymentTransactionId });
}

async function setPaymentReference({ registrationId, paymentTransactionId }) {
  return Registration.findOneAndUpdate(
    {
      _id: registrationId,
      paymentStatus: PAYMENT_STATUSES.PAID,
    },
    {
      $set: {
        'payment.paymentTransactionId': paymentTransactionId,
      },
    },
    { new: true }
  );
}

module.exports = {
  create,
  findById,
  findByIdLean,
  findByPaymentOrderId,
  findByPaymentTransactionId,
  setPaymentOrder,
  setPaymentReference,
  markPaidAtomic,
  markFailedAtomic,
  findActiveByParticipantKeys,
  deleteById,
  deleteByIds,
  findAdminPage,
  countByFilter,
  sumParticipantsByFilter,
  createExportCursor,
  createTeamExportCursor,
};
