const AppError = require('./AppError');
const {
  REGISTRATION_FEE_PER_PARTICIPANT,
  MIN_TEAM_MEMBERS,
  MAX_TEAM_MEMBERS,
  ERROR_CODES,
} = require('./constants');

function getRegistrationFee(memberCount) {
  return memberCount * REGISTRATION_FEE_PER_PARTICIPANT;
}

function calculateRegistrationFee(numberOfParticipants) {
  if (!Number.isInteger(numberOfParticipants) || numberOfParticipants < MIN_TEAM_MEMBERS) {
    throw new AppError(
      'Number of participants must be a positive integer',
      400,
      ERROR_CODES.INVALID_PARTICIPANT_COUNT
    );
  }

  if (numberOfParticipants > MAX_TEAM_MEMBERS) {
    throw new AppError(
      `A team can have at most ${MAX_TEAM_MEMBERS} participants`,
      400,
      ERROR_CODES.INVALID_PARTICIPANT_COUNT
    );
  }

  return getRegistrationFee(numberOfParticipants);
}

module.exports = { getRegistrationFee, calculateRegistrationFee };
