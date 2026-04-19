'use client';

import { useState, useEffect } from 'react';

interface PatientOption {
  patient_id: number;
  first_name: string;
  last_name: string;
}

interface PatientDetail {
  patient_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
}

interface OrderRow {
  order_id: number;
  order_date: string;
  test_name: string;
  test_code: string;
  priority: string;
  order_status: string;
  cancellation_reason: string | null;
  report_date: string | null;
  report_status: string | null;
}

const PRIORITY_BADGE: Record<string, string> = {
  ROUTINE: 'badge-routine',
  URGENT:  'badge-urgent',
  STAT:    'badge-stat',
};

const ORDER_STATUS_BADGE: Record<string, string> = {
  ORDERED:    'badge-routine',
  COMPLETED:  'badge-normal',
  CANCELLED:  'badge-critical',
  IN_PROCESS: 'badge-pending',
};

const REPORT_STATUS_BADGE: Record<string, string> = {
  NORMAL:   'badge-normal',
  ABNORMAL: 'badge-abnormal',
  CRITICAL: 'badge-critical',
};

export default function PatientHistoryPage() {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loadingDD, setLoadingDD] = useState(true);
  const [ddError, setDdError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState('');
  const [history, setHistory] = useState<{ patient: PatientDetail; orders: OrderRow[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSelect(patientId: string) {
    setSelectedId(patientId);
    setHistory(null);
    setError(null);
    if (!patientId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reports/patient-history?patient_id=${patientId}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Unknown error');
      else setHistory(data);
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="field-label mb-1">Report 2 — SELECT</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Patient Test History
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Full order history from{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>TEST_ORDER ⋈ LAB_REPORT</span>
        </p>
      </div>

      {ddError && <div className="alert-warning p-3 mb-4 text-xs">{ddError}</div>}

      <div className="card p-5 mb-6">
        <label className="field-label block mb-1">Select Patient</label>
        {loadingDD ? (
          <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="spinner" /><span className="text-sm">Loading patients…</span>
          </div>
        ) : (
          <select
            className="form-input w-full px-3 py-2 text-sm"
            value={selectedId}
            onChange={e => handleSelect(e.target.value)}
          >
            <option value="">Select a patient…</option>
            {patients.map(p => (
              <option key={p.patient_id} value={p.patient_id}>
                [{p.patient_id}] {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4" style={{ color: 'var(--text-secondary)' }}>
          <span className="spinner" /><span className="text-sm">Loading history…</span>
        </div>
      )}

      {error && <div className="alert-error p-4 mb-6 text-sm">{error}</div>}

      {history && (
        <>
          <div className="card p-5 mb-6 grid grid-cols-3 gap-4">
            <div>
              <p className="field-label mb-1">Patient</p>
              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {history.patient.first_name} {history.patient.last_name}
              </p>
            </div>
            <div>
              <p className="field-label mb-1">Date of Birth</p>
              <p className="mono text-sm" style={{ color: 'var(--text-primary)' }}>
                {history.patient.date_of_birth?.slice(0, 10)}
              </p>
            </div>
            <div>
              <p className="field-label mb-1">Gender</p>
              <p className="mono text-sm" style={{ color: 'var(--text-primary)' }}>
                {history.patient.gender}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="section-header field-label">Orders ({history.orders.length})</p>
            </div>
            {history.orders.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
                No orders found for this patient.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Order Date</th>
                      <th className="text-left">Test</th>
                      <th className="text-left">Priority</th>
                      <th className="text-left">Order Status</th>
                      <th className="text-left">Cancellation Reason</th>
                      <th className="text-left">Report Date</th>
                      <th className="text-left">Report Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.orders.map(o => (
                      <tr key={o.order_id}>
                        <td className="mono text-xs" style={{ color: 'var(--text-primary)' }}>
                          {o.order_date?.slice(0, 10)}
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-primary)' }}>{o.test_name}</span>
                          <span className="mono text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                            ({o.test_code})
                          </span>
                        </td>
                        <td>
                          <span className={`${PRIORITY_BADGE[o.priority] ?? 'badge-pending'} px-2 py-0.5 text-xs mono`}>
                            {o.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`${ORDER_STATUS_BADGE[o.order_status] ?? 'badge-pending'} px-2 py-0.5 text-xs mono`}>
                            {o.order_status}
                          </span>
                        </td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {o.cancellation_reason ?? '—'}
                        </td>
                        <td className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {o.report_date?.slice(0, 10) ?? '—'}
                        </td>
                        <td>
                          {o.report_status ? (
                            <span className={`${REPORT_STATUS_BADGE[o.report_status] ?? 'badge-pending'} px-2 py-0.5 text-xs mono`}>
                              {o.report_status}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
