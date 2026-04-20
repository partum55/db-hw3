'use client';

import { useState, useEffect } from 'react';

interface Patient { patient_id: number; first_name: string; last_name: string; }
interface Staff   { staff_id: number; first_name: string; last_name: string; role: string; }
interface TestDef { test_def_id: number; test_name: string; test_code: string; category: string; }

interface FormData {
  patient_id: string;
  staff_id: string;
  test_def_id: string;
  order_date: string;
  priority: string;
  notes: string;
}

const today = new Date().toISOString().slice(0, 10);
const INITIAL: FormData = { patient_id: '', staff_id: '', test_def_id: '', order_date: today, priority: '', notes: '' };

export default function OrderNewPage() {
  const [patients, setPatients]   = useState<Patient[]>([]);
  const [staff, setStaff]         = useState<Staff[]>([]);
  const [tests, setTests]         = useState<TestDef[]>([]);
  const [loadingDD, setLoadingDD] = useState(true);
  const [ddError, setDdError]     = useState<string | null>(null);

  const [form, setForm]       = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  interface OrderRow {
    order_id: number; patient_id: number; first_name: string; last_name: string;
    staff_id: number; physician_name: string; test_name: string; test_code: string;
    order_date: string; priority: string; status: string; notes: string | null;
  }
  const [success, setSuccess] = useState<{ order_id: number; order?: OrderRow } | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/patients/dropdown').then(r => r.json()),
      fetch('/api/staff/dropdown').then(r => r.json()),
      fetch('/api/tests/dropdown').then(r => r.json()),
    ])
      .then(([p, s, t]) => {
        setPatients(p.error ? [] : p);
        setStaff(s.error ? [] : s);
        setTests(t.error ? [] : t);
      })
      .catch(() => setDdError('Failed to load dropdown data'))
      .finally(() => setLoadingDD(false));
  }, []);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setError(null);
      setSuccess(null);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          patient_id:  form.patient_id  ? Number(form.patient_id)  : undefined,
          staff_id:    form.staff_id    ? Number(form.staff_id)    : undefined,
          test_def_id: form.test_def_id ? Number(form.test_def_id) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Unknown error');
      } else {
        setSuccess(data);
        setForm({ ...INITIAL, order_date: today });
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
        <p className="field-label mb-1">Form 2 — INSERT</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Create Test Order
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Inserts a new row into{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>TEST_ORDER</span>
        </p>
      </div>

      {success && (
        <div className="alert-success p-4 mb-6">
          <p className="field-label mb-1">Order Created — Inserted Row</p>
          <p className="mono text-lg font-bold mb-2">ORDER_ID = {success.order_id}</p>
          {success.order && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mono" style={{ color: 'var(--accent-green)' }}>
              <span>patient: [{success.order.patient_id}] {success.order.first_name} {success.order.last_name}</span>
              <span>physician: {success.order.physician_name}</span>
              <span>test: [{success.order.test_code}] {success.order.test_name}</span>
              <span>order_date: {success.order.order_date?.slice(0,10)}</span>
              <span>priority: {success.order.priority}</span>
              <span>status: {success.order.status}</span>
              {success.order.notes && <span className="col-span-2">notes: {success.order.notes}</span>}
            </div>
          )}
        </div>
      )}

      {error && <div className="alert-error p-4 mb-6 text-sm">{error}</div>}
      {ddError && <div className="alert-warning p-3 mb-4 text-xs">{ddError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card p-5 flex flex-col gap-4">
          {loadingDD ? (
            <div className="flex items-center gap-2 py-4" style={{ color: 'var(--text-secondary)' }}>
              <span className="spinner" />
              <span className="text-sm">Loading dropdown data…</span>
            </div>
          ) : (
            <>
              <div>
                <label className="field-label block mb-1">Patient *</label>
                <select className="form-input w-full px-3 py-2 text-sm" value={form.patient_id} onChange={set('patient_id')}>
                  <option value="">Select patient…</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      [{p.patient_id}] {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label block mb-1">Ordering Physician *</label>
                <select className="form-input w-full px-3 py-2 text-sm" value={form.staff_id} onChange={set('staff_id')}>
                  <option value="">Select doctor…</option>
                  {staff.map(s => (
                    <option key={s.staff_id} value={s.staff_id}>
                      [{s.staff_id}] Dr. {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label block mb-1">Test *</label>
                <select className="form-input w-full px-3 py-2 text-sm" value={form.test_def_id} onChange={set('test_def_id')}>
                  <option value="">Select test…</option>
                  {tests.map(t => (
                    <option key={t.test_def_id} value={t.test_def_id}>
                      [{t.test_code}] {t.test_name} — {t.category}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label block mb-1">Order Date *</label>
              <input
                type="date"
                className="form-input w-full px-3 py-2 text-sm"
                value={form.order_date}
                onChange={set('order_date')}
              />
            </div>
            <div>
              <label className="field-label block mb-1">Priority *</label>
              <select className="form-input w-full px-3 py-2 text-sm" value={form.priority} onChange={set('priority')}>
                <option value="">Select…</option>
                <option value="ROUTINE">ROUTINE</option>
                <option value="URGENT">URGENT</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="field-label block mb-1">Notes</label>
            <textarea
              className="form-input w-full px-3 py-2 text-sm"
              rows={2}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Optional clinical notes…"
            />
          </div>

          <div
            className="pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>* Required · status = ORDERED</p>
            <button
              type="submit"
              disabled={loading || loadingDD}
              className="btn-primary px-6 py-2 flex items-center gap-2"
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Inserting…' : 'Create Order'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 card p-3 mono text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent-cyan)' }}>SQL</span>{' '}
        {"INSERT INTO TEST_ORDER (patient_id, staff_id, test_def_id, order_date, priority, status, notes) VALUES (?, ?, ?, ?, ?, 'ORDERED', ?)"}
      </div>
    </div>
  );
}
