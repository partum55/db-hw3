'use client';

import { useState, useEffect } from 'react';

interface ReportListItem {
  report_id: number;
  report_date: string;
  overall_status: string;
  patient_name: string;
}

interface ReportHeader {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  report_date: string;
  overall_status: string;
  comments: string | null;
  is_amended: number | boolean | null;
  amendment_note: string | null;
  reviewed_by: string;
}

interface ResultItem {
  test_name: string;
  test_code: string;
  normal_range: string | null;
  unit: string | null;
  measured_value: string | null;
  text_result: string | null;
  flag: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  NORMAL:   'badge-normal',
  ABNORMAL: 'badge-abnormal',
  CRITICAL: 'badge-critical',
};

const FLAG_BADGE: Record<string, string> = {
  NORMAL:   'badge-normal',
  LOW:      'badge-abnormal',
  HIGH:     'badge-abnormal',
  CRITICAL: 'badge-critical',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${STATUS_BADGE[status] ?? 'badge-pending'} px-2 py-0.5 text-xs mono font-bold`}>
      {status}
    </span>
  );
}

function FlagBadge({ flag }: { flag: string | null }) {
  if (!flag) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return (
    <span className={`${FLAG_BADGE[flag] ?? 'badge-pending'} px-2 py-0.5 text-xs mono font-bold`}>
      {flag}
    </span>
  );
}

export default function LabReportPage() {
  const [reportList, setReportList] = useState<ReportListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState<{ header: ReportHeader; items: ResultItem[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/reports/lab-report/list')
      .then(r => r.json())
      .then(data => {
        if (data.error) setListError(data.error);
        else setReportList(data);
      })
      .catch(() => setListError('Failed to load reports'))
      .finally(() => setLoadingList(false));
  }, []);

  async function handleSelect(reportId: string) {
    setSelectedId(reportId);
    setReport(null);
    setError(null);
    if (!reportId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reports/lab-report?report_id=${reportId}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Unknown error');
      else setReport(data);
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="field-label mb-1">Report 1 — SELECT</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Lab Report Viewer
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Full report with result items from{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>LAB_REPORT ⋈ RESULT_ITEM</span>
        </p>
      </div>

      {listError && <div className="alert-error p-4 mb-6 text-sm">{listError}</div>}

      <div className="card p-5 mb-6">
        <label className="field-label block mb-1">Select Report</label>
        {loadingList ? (
          <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="spinner" /><span className="text-sm">Loading reports…</span>
          </div>
        ) : (
          <select
            className="form-input w-full px-3 py-2 text-sm"
            value={selectedId}
            onChange={e => handleSelect(e.target.value)}
          >
            <option value="">Select a report…</option>
            {reportList.map(r => (
              <option key={r.report_id} value={r.report_id}>
                [{r.report_id}] {r.report_date?.slice(0, 10)} — {r.patient_name} — {r.overall_status}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4" style={{ color: 'var(--text-secondary)' }}>
          <span className="spinner" /><span className="text-sm">Loading report…</span>
        </div>
      )}

      {error && <div className="alert-error p-4 mb-6 text-sm">{error}</div>}

      {report && (
        <>
          <div className="card p-5 mb-6">
            <p className="section-header field-label mb-4">Report Header</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="field-label mb-1">Patient</p>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {report.header.first_name} {report.header.last_name}
                </p>
              </div>
              <div>
                <p className="field-label mb-1">Date of Birth</p>
                <p className="mono text-sm" style={{ color: 'var(--text-primary)' }}>
                  {report.header.date_of_birth?.slice(0, 10)}
                </p>
              </div>
              <div>
                <p className="field-label mb-1">Report Date</p>
                <p className="mono text-sm" style={{ color: 'var(--text-primary)' }}>
                  {report.header.report_date?.slice(0, 10)}
                </p>
              </div>
              <div>
                <p className="field-label mb-1">Reviewed By</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{report.header.reviewed_by}</p>
              </div>
              <div>
                <p className="field-label mb-1">Overall Status</p>
                <StatusBadge status={report.header.overall_status} />
              </div>
              {report.header.is_amended ? (
                <div className="flex items-start">
                  <span
                    className="px-2 py-0.5 text-xs mono font-bold mt-5"
                    style={{
                      background: 'rgba(255,179,0,0.12)',
                      color: '#ffb300',
                      border: '1px solid rgba(255,179,0,0.3)',
                    }}
                  >
                    AMENDED
                  </span>
                </div>
              ) : null}
            </div>
            {report.header.comments && (
              <div className="mb-3">
                <p className="field-label mb-1">Comments</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{report.header.comments}</p>
              </div>
            )}
            {report.header.is_amended && report.header.amendment_note && (
              <div className="alert-warning p-3">
                <p className="field-label mb-1">Amendment Note</p>
                <p className="text-sm">{report.header.amendment_note}</p>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="section-header field-label">Result Items ({report.items.length})</p>
            </div>
            {report.items.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: 'var(--text-muted)' }}>No result items found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Test Name</th>
                      <th className="text-left">Code</th>
                      <th className="text-right">Measured Value</th>
                      <th className="text-left">Unit</th>
                      <th className="text-left">Normal Range</th>
                      <th className="text-center">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.map((item, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-primary)' }}>{item.test_name}</td>
                        <td>
                          <span className="mono text-xs" style={{ color: 'var(--accent-cyan)' }}>
                            {item.test_code}
                          </span>
                        </td>
                        <td className="text-right mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {item.measured_value ?? item.text_result ?? '—'}
                        </td>
                        <td className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.unit ?? '—'}
                        </td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.normal_range ?? '—'}
                        </td>
                        <td className="text-center">
                          <FlagBadge flag={item.flag} />
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
