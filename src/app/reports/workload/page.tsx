'use client';

import { useState } from 'react';

interface WorkloadRow {
  staff_id: number;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  orders_handled: number;
  specimens_collected: number;
  reports_reviewed: number;
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 6);
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  };
}

const def = defaultDateRange();

export default function WorkloadReportPage() {
  const [dateFrom, setDateFrom] = useState(def.from);
  const [dateTo, setDateTo]     = useState(def.to);
  const [rows, setRows]         = useState<WorkloadRow[] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setRows(null);

    try {
      const res = await fetch(`/api/reports/workload?date_from=${dateFrom}&date_to=${dateTo}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Unknown error');
      else setRows(data.rows);
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  const totals = rows
    ? {
        orders_handled:      rows.reduce((s, r) => s + Number(r.orders_handled), 0),
        specimens_collected: rows.reduce((s, r) => s + Number(r.specimens_collected), 0),
        reports_reviewed:    rows.reduce((s, r) => s + Number(r.reports_reviewed), 0),
      }
    : null;

  return (
    <div>
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="field-label mb-1">Report 4 — SELECT</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Staff Workload Report
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Orders, specimens, and reports per staff member from{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>MEDICAL_STAFF</span>
        </p>
      </div>

      <div className="card p-5 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="field-label block mb-1">Date From</label>
          <input
            type="date"
            className="form-input px-3 py-2 text-sm"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label block mb-1">Date To</label>
          <input
            type="date"
            className="form-input px-3 py-2 text-sm"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        <button
          onClick={generate}
          disabled={loading || !dateFrom || !dateTo}
          className="btn-primary px-6 py-2 flex items-center gap-2"
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="alert-error p-4 mb-6 text-sm">{error}</div>}

      {rows !== null && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="section-header field-label">Results ({rows.length} staff members)</p>
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {dateFrom} → {dateTo}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Staff Name</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Department</th>
                  <th className="text-right">Orders Handled</th>
                  <th className="text-right">Specimens Collected</th>
                  <th className="text-right">Reports Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.staff_id}>
                    <td style={{ color: 'var(--text-primary)' }}>
                      {r.first_name} {r.last_name}
                    </td>
                    <td>
                      <span className="badge-routine px-2 py-0.5 text-xs mono">
                        {r.role}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.department}</td>
                    <td className="text-right mono font-bold" style={{ color: 'var(--accent-cyan)' }}>
                      {Number(r.orders_handled).toLocaleString()}
                    </td>
                    <td className="text-right mono font-bold" style={{ color: 'var(--accent-green)' }}>
                      {Number(r.specimens_collected).toLocaleString()}
                    </td>
                    <td className="text-right mono font-bold" style={{ color: 'var(--accent-amber)' }}>
                      {Number(r.reports_reviewed).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {totals && (
                  <tr style={{ background: 'var(--bg-surface-2)', borderTop: '2px solid var(--border)' }}>
                    <td colSpan={3} className="field-label">TOTALS</td>
                    <td className="text-right mono font-bold text-base" style={{ color: 'var(--accent-cyan)' }}>
                      {totals.orders_handled.toLocaleString()}
                    </td>
                    <td className="text-right mono font-bold text-base" style={{ color: 'var(--accent-green)' }}>
                      {totals.specimens_collected.toLocaleString()}
                    </td>
                    <td className="text-right mono font-bold text-base" style={{ color: 'var(--accent-amber)' }}>
                      {totals.reports_reviewed.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
