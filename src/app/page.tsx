import pool from '@/lib/db';
import Link from 'next/link';

interface TableCount {
  tbl: string;
  cnt: number;
}

const TABLE_META: Record<string, { label: string; desc: string }> = {
  PATIENT:         { label: 'Patients',         desc: 'Registered patients' },
  MEDICAL_STAFF:   { label: 'Medical Staff',    desc: 'Doctors, technicians, nurses' },
  TEST_DEFINITION: { label: 'Test Definitions', desc: 'Available laboratory tests' },
  TEST_ORDER:      { label: 'Test Orders',      desc: 'Ordered lab tests' },
  SPECIMEN:        { label: 'Specimens',        desc: 'Collected biological specimens' },
  LAB_REPORT:      { label: 'Lab Reports',      desc: 'Completed lab reports' },
  RESULT_ITEM:     { label: 'Result Items',     desc: 'Individual test result values' },
};

export default async function DashboardPage() {
  let counts: TableCount[] = [];
  let dbError: string | null = null;

  try {
    const [rows] = await pool.query<any[]>(`
      SELECT 'PATIENT' AS tbl, COUNT(*) AS cnt FROM PATIENT
      UNION ALL SELECT 'MEDICAL_STAFF',   COUNT(*) FROM MEDICAL_STAFF
      UNION ALL SELECT 'TEST_DEFINITION', COUNT(*) FROM TEST_DEFINITION
      UNION ALL SELECT 'TEST_ORDER',      COUNT(*) FROM TEST_ORDER
      UNION ALL SELECT 'SPECIMEN',        COUNT(*) FROM SPECIMEN
      UNION ALL SELECT 'LAB_REPORT',      COUNT(*) FROM LAB_REPORT
      UNION ALL SELECT 'RESULT_ITEM',     COUNT(*) FROM RESULT_ITEM
    `);
    counts = rows.map((r: any) => ({ tbl: r.tbl, cnt: Number(r.cnt) }));
  } catch (err: any) {
    dbError = err.message ?? 'Unknown database error';
  }

  return (
    <div>
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="field-label mb-1">System Overview</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Database Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Live row counts for all 7 tables in{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>medical_test_v07</span>
        </p>
      </div>

      {dbError && (
        <div className="alert-error p-4 mb-6 text-sm mono">
          <strong>DB CONNECTION ERROR</strong><br />
          {dbError}
        </div>
      )}

      <div className="card mb-8 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="text-left">Table</th>
              <th className="text-left">Description</th>
              <th className="text-right">Row Count</th>
            </tr>
          </thead>
          <tbody>
            {counts.map(({ tbl, cnt }) => {
              const meta = TABLE_META[tbl] ?? { label: tbl, desc: '' };
              return (
                <tr key={tbl}>
                  <td>
                    <span className="mono text-xs" style={{ color: 'var(--accent-cyan)' }}>{tbl}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-primary)' }}>{meta.label}</span>
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{meta.desc}</td>
                  <td className="text-right">
                    <span className="mono font-bold text-lg" style={{ color: 'var(--accent-cyan)' }}>
                      {cnt.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <p className="section-header field-label mb-4">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { href: '/patients/new',     label: 'Register Patient',  icon: '+', color: 'var(--accent-cyan)',  badge: 'INSERT' },
            { href: '/orders/new',       label: 'Create Test Order', icon: '+', color: 'var(--accent-cyan)',  badge: 'INSERT' },
            { href: '/orders/cancel',    label: 'Cancel Test Order', icon: '×', color: 'var(--accent-amber)', badge: 'UPDATE' },
            { href: '/specimens/status', label: 'Update Specimen',   icon: '↻', color: 'var(--accent-green)', badge: 'UPDATE' },
            { href: '/patients/delete',  label: 'Delete Patient',    icon: '⌫', color: 'var(--accent-red)',   badge: 'DELETE' },
          ].map(({ href, label, icon, color, badge }) => (
            <Link
              key={href}
              href={href}
              className="card p-4 flex items-center gap-3 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <span
                className="text-xl font-mono w-8 h-8 flex items-center justify-center shrink-0"
                style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
              >
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>{badge} · {href}</p>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="section-header field-label mb-4">Schema Reference</p>
        <div className="card p-4 mono text-xs overflow-x-auto" style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
          <pre>{`PATIENT         (patient_id PK, first_name, last_name, date_of_birth, gender, phone, email, address)
MEDICAL_STAFF   (staff_id PK, first_name, last_name, role, department, phone, email)
TEST_DEFINITION (test_def_id PK, test_name, test_code, category, normal_range, unit, description)
TEST_ORDER      (order_id PK, patient_id FK, staff_id FK, test_def_id FK, order_date, priority, status, notes, cancellation_reason)
SPECIMEN        (specimen_id PK, order_id FK, specimen_type, collection_date, collected_by FK, storage_temp, barcode, rejection_reason, status)
LAB_REPORT      (report_id PK, specimen_id FK, reviewed_by FK, report_date, overall_status, comments, is_amended, amendment_note)
RESULT_ITEM     (report_id FK + item_seq_no composite PK, test_def_id FK, measured_value, text_result, flag)`}</pre>
        </div>
      </div>
    </div>
  );
}
