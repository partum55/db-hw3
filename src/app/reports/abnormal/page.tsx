'use client';

import { useState } from 'react';

interface AbnormalRow {
  patient_id: number;
  first_name: string;
  last_name: string;
  abnormal_count: number;
  latest_report_date: string;
  statuses: string;
  reviewed_by: string;
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

export default function AbnormalReportPage() {
  const [dateFrom, setDateFrom] = useState(def.from);
  const [dateTo, setDateTo]     = useState(def.to);
  const [rows, setRows]         = useState<AbnormalRow[] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setRows(null);

    try {
      const res = await fetch(`/api/reports/abnormal?date_from=${dateFrom}&date_to=${dateTo}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Unknown error');
      else setRows(data.rows);
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="field-label mb-1">Report 3 — SELECT</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Abnormal Results Report
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Patients with{' '}
          <span className="mono" style={{ color: 'var(--accent-amber)' }}>ABNORMAL</span>
          {' '}or{' '}
          <span className="mono" style={{ color: 'var(--accent-red)' }}>CRITICAL</span>
          {' '}lab reports in a date range
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
            <p className="section-header field-label">Results</p>
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {dateFrom} → {dateTo}
            </span>
          </div>
          {rows.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No abnormal results found in this date range.
              </p>
            </div>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Patient Name</th>
                  <th className="text-right">Abnormal Count</th>
                  <th className="text-left">Latest Report</th>
                  <th className="text-left">Statuses</th>
                  <th className="text-left">Reviewed By</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.patient_id}>
                    <td>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {r.first_name} {r.last_name}
                      </span>
                      <span className="mono text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                        #{r.patient_id}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="mono font-bold text-lg" style={{ color: 'var(--accent-red)' }}>
                        {Number(r.abnormal_count)}
                      </span>
                    </td>
                    <td className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {r.latest_report_date?.slice(0, 10)}
                    </td>
                    <td>
                      {r.statuses.split(', ').map(s => (
                        <span
                          key={s}
                          className={`mr-1 px-2 py-0.5 text-xs mono font-bold ${
                            s === 'CRITICAL' ? 'badge-critical' : 'badge-abnormal'
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {r.reviewed_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
