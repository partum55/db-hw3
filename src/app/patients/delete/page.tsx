'use client';

import { useState, useEffect } from 'react';

interface PatientOption {
  patient_id: number;
  first_name: string;
  last_name: string;
}

interface PreviewData {
  patient: PatientOption;
  order_count: number;
}

interface DeleteResult {
  deleted_patient_id: number;
  patient: PatientOption;
  cascaded_orders: number;
}

export default function PatientDeletePage() {
  const [patients, setPatients]   = useState<PatientOption[]>([]);
  const [loadingDD, setLoadingDD] = useState(true);
  const [ddError, setDdError]     = useState<string | null>(null);

  const [patientId, setPatientId] = useState('');
  const [preview, setPreview]     = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState<DeleteResult | null>(null);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/patients/dropdown')
      .then(r => r.json())
      .then(data => {
        if (data.error) setDdError(data.error);
        else setPatients(data);
      })
      .catch(() => setDdError('Failed to load patients'))
      .finally(() => setLoadingDD(false));
  }, []);

  async function handlePatientSelect(id: string) {
    setPatientId(id);
    setConfirmed(false);
    setError(null);
    setSuccess(null);
    setPreview(null);

    if (!id) return;

    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Could not load preview');
      else setPreview(data);
    } catch {
      setError('Network error loading preview');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) { setError('Please select a patient'); return; }
    if (!confirmed) { setError('Please confirm the deletion checkbox'); return; }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Unknown error');
      } else {
        setSuccess(data);
        setPatients(prev => prev.filter(p => String(p.patient_id) !== patientId));
        setPatientId(''); setPreview(null); setConfirmed(false);
      }
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="field-label mb-1">Form 5 — DELETE</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--accent-red)' }}>
          Delete Patient
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Permanently removes a{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>PATIENT</span>
          {' '}row — cascades to all related records
        </p>
      </div>

      {success && (
        <div className="alert-error p-4 mb-6">
          <p className="field-label mb-2" style={{ color: 'var(--accent-red)' }}>Patient Deleted</p>
          <p className="mono text-lg font-bold">
            [{success.deleted_patient_id}] {success.patient.first_name} {success.patient.last_name}
          </p>
          <div className="mt-3 text-xs mono" style={{ color: 'var(--text-secondary)' }}>
            <p>Cascaded deletions:</p>
            <p>· TEST_ORDER rows: {success.cascaded_orders} (+ cascades to SPECIMEN → LAB_REPORT → RESULT_ITEM)</p>
          </div>
        </div>
      )}

      {error && <div className="alert-error p-4 mb-6 text-sm">{error}</div>}
      {ddError && <div className="alert-warning p-3 mb-4 text-xs">{ddError}</div>}

      <form onSubmit={handleDelete} noValidate>
        <div className="card p-5 flex flex-col gap-4">
          <div>
            <label className="field-label block mb-1">Patient *</label>
            {loadingDD ? (
              <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="spinner" /><span className="text-sm">Loading patients…</span>
              </div>
            ) : (
              <select
                className="form-input w-full px-3 py-2 text-sm"
                value={patientId}
                onChange={e => handlePatientSelect(e.target.value)}
              >
                <option value="">Select patient to delete…</option>
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>
                    [{p.patient_id}] {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loadingPreview && (
            <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="spinner" /><span className="text-sm">Loading preview…</span>
            </div>
          )}

          {preview && (
            <div
              className="p-4 flex flex-col gap-2"
              style={{
                background: 'rgba(255,69,96,0.06)',
                border: '1px solid rgba(255,69,96,0.3)',
              }}
            >
              <p className="field-label" style={{ color: 'var(--accent-red)' }}>
                Deletion Preview
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs mt-1">
                <div>
                  <p className="field-label mb-1">Patient</p>
                  <p className="mono">
                    [{preview.patient.patient_id}] {preview.patient.first_name} {preview.patient.last_name}
                  </p>
                </div>
                <div>
                  <p className="field-label mb-1">Test Orders</p>
                  <p
                    className="mono font-bold text-base"
                    style={{ color: preview.order_count > 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}
                  >
                    {preview.order_count}
                  </p>
                </div>
              </div>
              <div
                className="mt-2 p-2 text-xs mono"
                style={{ background: 'rgba(255,69,96,0.08)', color: 'var(--accent-red)' }}
              >
                ⚠ This will also delete all associated test orders, specimens, lab reports, and result items via ON DELETE CASCADE
              </div>
            </div>
          )}

          {preview && (
            <label
              className="flex items-start gap-3 cursor-pointer p-3"
              style={{
                border: `1px solid ${confirmed ? 'rgba(255,69,96,0.5)' : 'var(--border)'}`,
                background: confirmed ? 'rgba(255,69,96,0.06)' : 'var(--bg-surface-2)',
              }}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => { setConfirmed(e.target.checked); setError(null); }}
                className="mt-0.5"
                style={{ accentColor: 'var(--accent-red)' }}
              />
              <span className="text-xs" style={{ color: confirmed ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                I confirm deletion of this patient and all associated records
              </span>
            </label>
          )}

          <div
            className="pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {patients.length} patient{patients.length !== 1 ? 's' : ''} in database
            </p>
            <button
              type="submit"
              disabled={loading || loadingDD || !patientId || !confirmed}
              className="btn-danger px-6 py-2 flex items-center gap-2"
            >
              {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : null}
              {loading ? 'Deleting…' : 'Delete Patient'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 card p-3 mono text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent-red)' }}>SQL</span>{' '}
        DELETE FROM PATIENT WHERE patient_id = ?{' '}
        <span style={{ color: 'var(--accent-amber)' }}>-- ON DELETE CASCADE propagates</span>
      </div>
    </div>
  );
}
