import { useEffect, useState } from 'react';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { ExportButtons } from '../components/admin/ExportButtons';
import { RegistrationFilters } from '../components/admin/RegistrationFilters';
import { RegistrationTable } from '../components/admin/RegistrationTable';
import { HACKATHON } from '../constants/hackathon';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  deleteRegistration,
  exportRegistrationsCsv,
  exportRegistrationsPdf,
  listRegistrations,
} from '../services/adminRegistrationService';
import { getErrorMessage } from '../utils/apiError';

export function AdminRegistrationsPage() {
  const [search, setSearch] = useState('');
  const [studentType, setStudentType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportState, setExportState] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  usePageTitle(`${HACKATHON.eventName} · Registrations`);

  const query = {
    page,
    limit: 20,
    search: debouncedSearch,
    studentType,
  };

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await listRegistrations(query);
      if (result.data.teams.length === 0 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }
      setPayload(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [debouncedSearch, studentType, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, studentType]);

  async function handleExport(kind) {
    setExportState(kind);
    setExportMessage('');
    try {
      const params = { search: debouncedSearch, studentType };
      if (kind === 'csv') {
        await exportRegistrationsCsv(params);
      } else {
        await exportRegistrationsPdf(params);
      }
      setExportMessage('Export completed.');
    } catch (err) {
      setExportMessage(getErrorMessage(err) || 'Export failed. Please try again.');
    } finally {
      setExportState('');
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeletingId(pendingDelete.id);
    setDeleteError('');
    try {
      await deleteRegistration(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setDeleteError(getErrorMessage(err) || 'Unable to delete this registration.');
    } finally {
      setDeletingId('');
    }
  }

  const teams = payload?.teams || [];
  const pagination = payload?.pagination;

  return (
    <>
      <p className="lede">
        Hostel and day-scholar filters include teams that contain at least one matching participant.
        CSV and PDF exports apply the same filters at participant level.
      </p>
      <RegistrationFilters
        search={search}
        studentType={studentType}
        onSearchChange={setSearch}
        onStudentTypeChange={setStudentType}
        onClear={() => {
          setSearch('');
          setStudentType('ALL');
          setPage(1);
        }}
      />
      <ExportButtons
        busy={exportState}
        onCsv={() => handleExport('csv')}
        onPdf={() => handleExport('pdf')}
      />
      {exportMessage ? <p className="status-line">{exportMessage}</p> : null}
      {loading ? <LoadingState label="Loading registrations…" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && teams.length === 0 ? (
        <div className="empty-state">
          <h2>No registrations found</h2>
          <p>Try another search or clear the residence filter.</p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setSearch('');
              setStudentType('ALL');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : null}
      {teams.length > 0 ? (
        <RegistrationTable teams={teams} deletingId={deletingId} onDelete={setPendingDelete} />
      ) : null}
      {pagination && pagination.totalPages > 1 ? (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      {pendingDelete ? (
        <Modal
          title="Delete registration"
          onClose={
            deletingId
              ? undefined
              : () => {
                  setPendingDelete(null);
                  setDeleteError('');
                }
          }
        >
          <p>
            Delete team <strong>{pendingDelete.teamName}</strong>? This removes the entire registration
            and all participants.
          </p>
          {deleteError ? (
            <p className="form-error" role="alert">
              {deleteError}
            </p>
          ) : null}
          <div className="register-form__bar">
            <button
              type="button"
              className="btn btn--secondary"
              disabled={Boolean(deletingId)}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </button>
            <button type="button" className="btn" disabled={Boolean(deletingId)} onClick={handleConfirmDelete}>
              {deletingId ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
