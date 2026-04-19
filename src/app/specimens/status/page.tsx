'use client';

import { useState, useEffect } from 'react';

interface SpecimenOption {
  specimen_id: number;
  barcode: string;
  specimen_type: string;
  status: string;
}

interface UpdateResult {
  specimen_id: number;
  before: { status: string };
  after:  { status: string; rejection_reason: string | null };
}

const STATUS_OPTIONS = ['PENDING', 'IN_PROCESS', 'COMPLETED', 'REJECTED'];

const statusColor: Record<string, string> = {
  PENDING:    'var(--text-secondary)',
  IN_PROCESS: 'var(--accent-cyan)',
  COMPLETED:  'var(--accent-green)',
  REJECTED:   'var(--accent-red)',
};

export default function SpecimenStatusPage() {
  const [specimens, setSpecimens]   = useState<SpecimenOption[]>([]);
  const [loadingDD, setLoadingDD]   = useState(true);
  const [ddError, setDdError]       = useState<string | null>(null);

  const [specimenId, setSpecimenId] = useState('');
  const [newStatus, setNewStatus]   = useState('');
  const [rejReason, setRejReason]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState<UpdateResult | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/specimens/dropdown')
      .then(r => r.json())
      .then(data => {
        if (data.error) setDdError(data.error);
        else setSpecimens(data);
      })
      .catch(() => setDdError('Failed to load specimens'))
      .finally(() => setLoadingDD(false));
  }, []);

  const selectedSpecimen = specimens.find(s => String(s.specimen_id) === specimenId);

  function resetForm() {
    setSpecimenId(''); setNewStatus(''); setRejReason('');
    setError(null); setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!specimenId) { setError('Please select a specimen'); return; }
    if (!newStatus)  { setError('Please select a new status'); return; }
    if (newStatus === 'REJECTED' && !rejReason.trim()) {
      setError('Rejection reason is required when status is REJECTED');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/specimens/${specimenId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, rejection_reason: rejReason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Unknown error');
      } else {
        setSuccess(data);
        setSpecimens(prev =>
          prev.map(s => String(s.specimen_id) === specimenId ? { ...s, status: newStatus } : s)
        );
        setNewStatus(''); setRejReason('');
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
        <p className="field-label mb-1">Form 4 — UPDATE</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Update Specimen Status
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Updates{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>SPECIMEN.status</span>
          {' '}and optionally sets rejection reason
        </p>
      </div>

      {success && (
        <div className="alert-success p-4 mb-6">
          <p className="field-label mb-2">Specimen #{success.specimen_id} Updated</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3">
              <p className="field-label mb-1" style={{ color: 'var(--text-muted)' }}>Before</p>
              <p className="mono text-sm font-bold" style={{ color: statusColor[success.before.status] ?? 'inherit' }}>
                {success.before.status}
              </p>
            </div>
            <div className="card p-3">
              <p className="field-label mb-1" style={{ color: 'var(--text-muted)' }}>After</p>
              <p className="mono text-sm font-bold" style={{ color: statusColor[success.after.status] ?? 'inherit' }}>
                {success.after.status}
              </p>
            </div>
          </div>
          {success.after.rejection_reason && (
            <p className="text-xs mt-3" style={{ color: 'var(--accent-red)', opacity: 0.8 }}>
              Rejection reason: {success.after.rejection_reason}
            </p>
          )}
        </div>
      )}

      {error && <div className="alert-error p-4 mb-6 text-sm">{error}</div>}
      {ddError && <div className="alert-warning p-3 mb-4 text-xs">{ddError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card p-5 flex flex-col gap-4">
          <div>
            <label className="field-label block mb-1">Specimen *</label>
            {loadingDD ? (
              <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="spinner" /><span className="text-sm">Loading specimens…</span>
              </div>
            ) : (
              <select
                className="form-input w-full px-3 py-2 text-sm mono"
                value={specimenId}
                onChange={e => { setSpecimenId(e.target.value); setError(null); setSuccess(null); }}
              >
                <option value="">Select specimen…</option>
                {specimens.map(s => (
                  <option key={s.specimen_id} value={s.specimen_id}>
                    [{s.specimen_id}] {s.barcode} — {s.specimen_type} — {s.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedSpecimen && (
            <div
              className="card p-3 grid grid-cols-3 gap-2 text-xs"
              style={{ background: 'var(--bg-surface-2)' }}
            >
              <div>
                <p className="field-label mb-1">Barcode</p>
                <p className="mono" style={{ color: 'var(--text-primary)' }}>{selectedSpecimen.barcode}</p>
              </div>
              <div>
                <p className="field-label mb-1">Type</p>
                <p className="mono" style={{ color: 'var(--text-primary)' }}>{selectedSpecimen.specimen_type}</p>
              </div>
              <div>
                <p className="field-label mb-1">Current Status</p>
                <p className="mono font-bold" style={{ color: statusColor[selectedSpecimen.status] ?? 'inherit' }}>
                  {selectedSpecimen.status}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="field-label block mb-1">New Status *</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setNewStatus(s); setError(null); if (s !== 'REJECTED') setRejReason(''); }}
                  className="px-3 py-2 text-xs mono font-bold tracking-wider transition-all"
                  style={{
                    border: `1px solid ${newStatus === s ? statusColor[s] : 'var(--border)'}`,
                    background: newStatus === s ? `${statusColor[s]}18` : 'var(--bg-surface-2)',
                    color: newStatus === s ? statusColor[s] : 'var(--text-secondary)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {newStatus === 'REJECTED' && (
            <div>
              <label className="field-label block mb-1">
                Rejection Reason *
                <span className="ml-2" style={{ color: 'var(--accent-red)' }}>required</span>
              </label>
              <textarea
                className="form-input w-full px-3 py-2 text-sm"
                rows={3}
                value={rejReason}
                onChange={e => { setRejReason(e.target.value); setError(null); }}
                placeholder="Document why this specimen was rejected (haemolysis, insufficient volume, labelling error…)"
                autoFocus
              />
            </div>
          )}

          <div
            className="pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button type="button" onClick={resetForm} className="btn-ghost px-4 py-2">
              Reset
            </button>
            <button
              type="submit"
              disabled={loading || loadingDD || !specimenId || !newStatus}
              className="btn-primary px-6 py-2 flex items-center gap-2"
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Updating…' : 'Update Status'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 card p-3 mono text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent-cyan)' }}>SQL</span>{' '}
        UPDATE SPECIMEN SET status = ?, rejection_reason = ? WHERE specimen_id = ?
      </div>
    </div>
  );
}
