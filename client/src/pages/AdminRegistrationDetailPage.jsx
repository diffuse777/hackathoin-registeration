import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { RegistrationDetails } from '../components/admin/RegistrationDetails';
import { HACKATHON } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { usePageTitle } from '../hooks/usePageTitle';
import { deleteRegistration, getRegistrationById } from '../services/adminRegistrationService';
import { getErrorMessage } from '../utils/apiError';

export function AdminRegistrationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  usePageTitle(`${HACKATHON.eventName} · Team`);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getRegistrationById(id);
      setTeam(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleConfirmDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteRegistration(id);
      navigate(ROUTES.ADMIN_REGISTRATIONS, { replace: true });
    } catch (err) {
      setDeleteError(getErrorMessage(err) || 'Unable to delete this registration.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <p>
        <Link to={ROUTES.ADMIN_REGISTRATIONS}>Back to registrations</Link>
      </p>
      {loading ? <LoadingState label="Loading registrations…" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {team ? (
        <>
          <RegistrationDetails team={team} />
          <div className="register-form__bar">
            <button type="button" className="btn btn--secondary" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          </div>
        </>
      ) : null}
      {confirmDelete ? (
        <Modal
          title="Delete registration"
          onClose={
            deleting
              ? undefined
              : () => {
                  setConfirmDelete(false);
                  setDeleteError('');
                }
          }
        >
          <p>
            Delete team <strong>{team?.teamName}</strong>? This removes the entire registration and all
            participants.
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
              disabled={deleting}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn" disabled={deleting} onClick={handleConfirmDelete}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
