const registrationRepository = require('../repositories/registrationRepository');
const {
  parseAdminRegistrationQuery,
  validateRegistrationId,
} = require('../validators/adminRegistrationValidator');
const { buildAdminFilter, buildParticipantMatch, filterParticipants, describeAppliedFilters } = require('./adminRegistrationFilters');
const { csvHeaderRow, toCsvRow } = require('../utils/csv');
const { createRegistrationPdfReport } = require('../utils/registrationPdfReport');
const { ERROR_CODES } = require('../utils/constants');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

function toTeamListItem(registration) {
  return {
    id: String(registration._id),
    teamName: registration.teamName,
    memberCount: registration.memberCount,
    totalAmount: registration.totalAmount,
    paymentStatus: registration.paymentStatus,
    createdAt: registration.createdAt,
  };
}

function toTeamDetail(registration) {
  return {
    id: String(registration._id),
    teamName: registration.teamName,
    memberCount: registration.memberCount,
    totalAmount: registration.totalAmount,
    paymentStatus: registration.paymentStatus,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
    members: (registration.members || []).map((member) => ({
      id: member._id ? String(member._id) : undefined,
      name: member.name,
      registerNumber: member.registerNumber,
      department: member.department,
      section: member.section,
      phone: member.phone,
      email: member.email,
      studentType: member.studentType,
      hostelName: member.hostelName || null,
      roomNumber: member.roomNumber || null,
    })),
    payment: {
      paymentOrderId: registration.payment?.paymentOrderId || null,
      paymentTransactionId: registration.payment?.paymentTransactionId || null,
      paymentStatus: registration.payment?.paymentStatus || registration.paymentStatus,
      paidAt: registration.payment?.paidAt || null,
    },
  };
}

async function listRegistrations(query) {
  const parsed = parseAdminRegistrationQuery(query);
  const filter = buildAdminFilter(parsed);

  const [records, totalRecords, totalParticipants] = await Promise.all([
    registrationRepository.findAdminPage({
      filter,
      skip: parsed.skip,
      limit: parsed.limit,
    }),
    registrationRepository.countByFilter(filter),
    registrationRepository.sumParticipantsByFilter(filter),
  ]);

  const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / parsed.limit);

  return {
    teams: records.map(toTeamListItem),
    pagination: {
      page: parsed.page,
      limit: parsed.limit,
      totalRecords,
      totalPages,
    },
    counts: {
      totalTeams: totalRecords,
      totalParticipants,
    },
  };
}

async function getRegistrationSummary(query) {
  const parsed = parseAdminRegistrationQuery(query);
  const filter = buildAdminFilter(parsed);

  const [totalTeams, totalParticipants] = await Promise.all([
    registrationRepository.countByFilter(filter),
    registrationRepository.sumParticipantsByFilter(filter),
  ]);

  return {
    totalTeams,
    totalParticipants,
    paymentStatus: parsed.paymentStatus,
    studentType: parsed.studentType,
  };
}

async function getRegistrationById(id) {
  const registrationId = validateRegistrationId(id);
  const registration = await registrationRepository.findByIdLean(registrationId);

  if (!registration) {
    throw new AppError('Registration not found', 404, ERROR_CODES.NOT_FOUND);
  }

  return toTeamDetail(registration);
}

async function deleteRegistration(id) {
  const registrationId = validateRegistrationId(id);
  const deleted = await registrationRepository.deleteById(registrationId);

  if (!deleted) {
    throw new AppError('Registration not found', 404, ERROR_CODES.NOT_FOUND);
  }

  return {
    id: String(deleted._id),
    teamName: deleted.teamName,
    memberCount: deleted.memberCount,
  };
}

function formatCreatedDate(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
}

function toExportCsvRow(row) {
  return toCsvRow([
    row.teamName,
    row.memberCount,
    row.participantName,
    row.registerNumber,
    row.department,
    row.section,
    row.phone,
    row.email,
    row.studentType,
    row.hostelName || '',
    row.roomNumber || '',
    row.totalAmount,
    row.paymentStatus,
    formatCreatedDate(row.createdAt),
  ]);
}

function buildExportFilename() {
  const stamp = new Date().toISOString().slice(0, 10);
  return `hackathon-registrations-${stamp}.csv`;
}

function setCsvHeaders(res) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${buildExportFilename()}"`);
  res.setHeader('Cache-Control', 'no-store');
}

async function streamRegistrationsCsv(query, res) {
  const parsed = parseAdminRegistrationQuery(query);
  const teamFilter = buildAdminFilter(parsed);
  const participantMatch = buildParticipantMatch(parsed);
  const cursor = registrationRepository.createExportCursor({ teamFilter, participantMatch });

  setCsvHeaders(res);

  const onClose = () => {
    cursor.close().catch(() => {});
  };
  res.once('close', onClose);

  try {
    res.write(csvHeaderRow());

    for await (const row of cursor) {
      if (res.destroyed || res.writableEnded) {
        break;
      }
      res.write(toExportCsvRow(row));
    }

    if (!res.writableEnded) {
      res.end();
    }
  } catch (error) {
    if (!res.headersSent) {
      throw error;
    }
    res.destroy(error);
  } finally {
    res.off('close', onClose);
    await cursor.close().catch(() => {});
  }
}

function setPdfHeaders(res) {
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="hackathon-registrations-${stamp}.pdf"`);
  res.setHeader('Cache-Control', 'no-store');
}

async function streamRegistrationsPdf(query, res) {
  const parsed = parseAdminRegistrationQuery(query);
  const teamFilter = buildAdminFilter(parsed);
  const cursor = registrationRepository.createTeamExportCursor(teamFilter);

  setPdfHeaders(res);
  const report = createRegistrationPdfReport(res, {
    generatedAt: new Date(),
    filterLines: describeAppliedFilters(parsed),
  });

  let completed = false;
  const onAbort = () => {
    if (completed || res.writableFinished) {
      return;
    }
    cursor.close().catch(() => {});
    report.destroy();
  };
  res.req.once('aborted', onAbort);

  try {
    let exportedTeams = 0;

    for await (const team of cursor) {
      if (res.destroyed || res.writableEnded) {
        break;
      }

      const members = filterParticipants(team.members, parsed);
      if (members.length === 0) {
        continue;
      }

      exportedTeams += 1;
      report.writeTeam({
        teamName: team.teamName,
        memberCount: team.memberCount,
        paymentStatus: team.paymentStatus,
        totalAmount: team.totalAmount,
        members,
      });
    }

    if (exportedTeams === 0) {
      report.writeEmpty();
    }

    completed = true;
    await report.end();
  } catch (error) {
    logger.error('PDF export failed', { errMessage: error.message, stack: error.stack });
    if (!completed) {
      report.destroy();
    }
    if (!res.headersSent) {
      throw error;
    }
  } finally {
    res.req.removeListener('aborted', onAbort);
    await cursor.close().catch(() => {});
  }
}

module.exports = {
  listRegistrations,
  getRegistrationSummary,
  getRegistrationById,
  deleteRegistration,
  streamRegistrationsCsv,
  streamRegistrationsPdf,
};
