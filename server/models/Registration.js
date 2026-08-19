const mongoose = require('mongoose');
const {
  REGISTRATION_FEE_PER_PARTICIPANT,
  MIN_TEAM_MEMBERS,
  MAX_TEAM_MEMBERS,
  STUDENT_TYPES,
  PAYMENT_STATUSES,
} = require('../utils/constants');
const { getRegistrationFee } = require('../utils/calculateRegistrationFee');
const {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  REGISTER_NUMBER_PATTERN,
  normalizeStudentType,
  isHostelStudent,
  isDayScholar,
  isBlank,
  memberCountMatchesMembers,
  isValidTeamSize,
  membersHaveUniqueRegisterNumbers,
  membersHaveUniqueEmails,
} = require('../validators/registration.validators');

const STUDENT_TYPE_VALUES = Object.values(STUDENT_TYPES);
const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUSES);
const ACTIVE_PAYMENT_STATUSES = [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID];

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
      minlength: [2, 'Participant name is too short'],
      maxlength: [80, 'Participant name is too long'],
    },
    registerNumber: {
      type: String,
      required: [true, 'Register number is required'],
      trim: true,
      uppercase: true,
      match: [REGISTER_NUMBER_PATTERN, 'Register number format is invalid'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: [80, 'Department is too long'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'Section is too long'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [PHONE_PATTERN, 'Phone number must be a valid 10-digit Indian mobile number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [EMAIL_PATTERN, 'Email format is invalid'],
    },
    studentType: {
      type: String,
      required: [true, 'studentType is required'],
      enum: {
        values: STUDENT_TYPE_VALUES,
        message: 'studentType must be HOSTEL or DAY_SCHOLAR',
      },
      set: normalizeStudentType,
    },
    hostelName: {
      type: String,
      trim: true,
      maxlength: [80, 'Hostel name is too long'],
      required: [
        function requiredHostelName() {
          return isHostelStudent(this.studentType);
        },
        'hostelName is required when studentType is HOSTEL',
      ],
    },
    roomNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Room number is too long'],
      required: [
        function requiredRoomNumber() {
          return isHostelStudent(this.studentType);
        },
        'roomNumber is required when studentType is HOSTEL',
      ],
    },
  },
  { _id: true }
);

memberSchema.pre('validate', function unsetDayScholarHostelFields() {
  if (isDayScholar(this.studentType)) {
    this.hostelName = undefined;
    this.roomNumber = undefined;
  }

  if (isHostelStudent(this.studentType)) {
    if (isBlank(this.hostelName)) {
      this.invalidate('hostelName', 'hostelName is required when studentType is HOSTEL', this.hostelName);
    }
    if (isBlank(this.roomNumber)) {
      this.invalidate('roomNumber', 'roomNumber is required when studentType is HOSTEL', this.roomNumber);
    }
  }
});

const paymentSchema = new mongoose.Schema(
  {
    paymentOrderId: {
      type: String,
      trim: true,
      default: null,
    },
    paymentTransactionId: {
      type: String,
      trim: true,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUSES.PENDING,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [2, 'Team name is too short'],
      maxlength: [80, 'Team name is too long'],
    },
    memberCount: {
      type: Number,
      required: [true, 'memberCount is required'],
      min: [MIN_TEAM_MEMBERS, `A team must have at least ${MIN_TEAM_MEMBERS} participant`],
      max: [MAX_TEAM_MEMBERS, `A team can have at most ${MAX_TEAM_MEMBERS} participants`],
      validate: {
        validator: Number.isInteger,
        message: 'memberCount must be an integer',
      },
    },
    members: {
      type: [memberSchema],
      required: [true, 'At least one participant is required'],
      validate: [
        {
          validator(members) {
            return Array.isArray(members) && isValidTeamSize(members.length);
          },
          message: `A team must have between ${MIN_TEAM_MEMBERS} and ${MAX_TEAM_MEMBERS} participants`,
        },
        {
          validator(members) {
            return memberCountMatchesMembers(this.memberCount, members);
          },
          message: 'memberCount must match the number of members',
        },
        {
          validator: membersHaveUniqueRegisterNumbers,
          message: 'Duplicate register numbers in the same team are not allowed',
        },
        {
          validator: membersHaveUniqueEmails,
          message: 'Duplicate emails in the same team are not allowed',
        },
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [REGISTRATION_FEE_PER_PARTICIPANT, 'totalAmount is invalid'],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: PAYMENT_STATUS_VALUES,
        message: 'paymentStatus must be PENDING, PAID, or FAILED',
      },
      default: PAYMENT_STATUSES.PENDING,
    },
    payment: {
      type: paymentSchema,
      default: () => ({
        paymentOrderId: null,
        paymentTransactionId: null,
        paymentStatus: PAYMENT_STATUSES.PENDING,
        paidAt: null,
      }),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

registrationSchema.pre('validate', function deriveAmountAndSyncPayment() {
  const members = this.members || [];

  if (!memberCountMatchesMembers(this.memberCount, members)) {
    this.invalidate('memberCount', 'memberCount must match the number of members', this.memberCount);
  } else if (isValidTeamSize(this.memberCount)) {
    this.totalAmount = getRegistrationFee(this.memberCount);
  }

  if (!this.payment) {
    this.payment = {
      paymentOrderId: null,
      paymentTransactionId: null,
      paymentStatus: this.paymentStatus || PAYMENT_STATUSES.PENDING,
      paidAt: null,
    };
  }

  this.payment.paymentStatus = this.paymentStatus || PAYMENT_STATUSES.PENDING;

  if (this.paymentStatus === PAYMENT_STATUSES.PAID && !this.payment.paidAt) {
    this.payment.paidAt = new Date();
  }

  if (this.paymentStatus === PAYMENT_STATUSES.PENDING) {
    this.payment.paidAt = this.payment.paidAt || null;
  }
});

registrationSchema.index({ teamName: 1 });
registrationSchema.index(
  { 'members.registerNumber': 1 },
  {
    unique: true,
    partialFilterExpression: { paymentStatus: { $in: ACTIVE_PAYMENT_STATUSES } },
  }
);
registrationSchema.index(
  { 'members.email': 1 },
  {
    unique: true,
    partialFilterExpression: { paymentStatus: { $in: ACTIVE_PAYMENT_STATUSES } },
  }
);
registrationSchema.index({ 'members.studentType': 1 });
registrationSchema.index({ 'members.hostelName': 1 }, { sparse: true });
registrationSchema.index({ 'members.department': 1 });
registrationSchema.index({ paymentStatus: 1, createdAt: -1 });
registrationSchema.index({ createdAt: -1 });
registrationSchema.index(
  { 'payment.paymentOrderId': 1 },
  {
    unique: true,
    partialFilterExpression: { 'payment.paymentOrderId': { $type: 'string' } },
  }
);
registrationSchema.index(
  { 'payment.paymentTransactionId': 1 },
  {
    unique: true,
    partialFilterExpression: { 'payment.paymentTransactionId': { $type: 'string' } },
  }
);

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
