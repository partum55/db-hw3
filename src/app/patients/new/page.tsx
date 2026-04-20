'use client';

import { useState } from 'react';

interface FormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
}

const INITIAL: FormData = {
  first_name: '', last_name: '', date_of_birth: '',
  gender: '', phone: '', email: '', address: '',
};

export default function PatientNewPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  interface PatientRow {
    patient_id: number; first_name: string; last_name: string;
    date_of_birth: string; gender: string;
    phone: string | null; email: string | null; address: string | null;
  }
  const [success, setSuccess] = useState<{ patient_id: number; patient: PatientRow } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Unknown error');
      } else {
        setSuccess(data);
        setForm(INITIAL);
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
        <p className="field-label mb-1">Form 1 — INSERT</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Patient Registration
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Inserts a new row into{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>PATIENT</span>
        </p>
      </div>

      {success && (
        <div className="alert-success p-4 mb-6">
          <p className="field-label mb-1">Registration Successful — Inserted Row</p>
          <p className="mono text-lg font-bold mb-2">PATIENT_ID = {success.patient_id}</p>
          {success.patient && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mono" style={{ color: 'var(--accent-green)' }}>
              <span>first_name: {success.patient.first_name}</span>
              <span>last_name: {success.patient.last_name}</span>
              <span>date_of_birth: {success.patient.date_of_birth?.slice(0,10)}</span>
              <span>gender: {success.patient.gender}</span>
              <span>phone: {success.patient.phone ?? 'NULL'}</span>
              <span>email: {success.patient.email ?? 'NULL'}</span>
              {success.patient.address && <span className="col-span-2">address: {success.patient.address}</span>}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="alert-error p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label block mb-1">First Name *</label>
              <input
                className="form-input w-full px-3 py-2 text-sm"
                value={form.first_name}
                onChange={set('first_name')}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="field-label block mb-1">Last Name *</label>
              <input
                className="form-input w-full px-3 py-2 text-sm"
                value={form.last_name}
                onChange={set('last_name')}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label block mb-1">Date of Birth *</label>
              <input
                type="date"
                className="form-input w-full px-3 py-2 text-sm"
                value={form.date_of_birth}
                onChange={set('date_of_birth')}
              />
            </div>
            <div>
              <label className="field-label block mb-1">Gender *</label>
              <select
                className="form-input w-full px-3 py-2 text-sm"
                value={form.gender}
                onChange={set('gender')}
              >
                <option value="">Select gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label block mb-1">Phone</label>
              <input
                className="form-input w-full px-3 py-2 text-sm mono"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div>
              <label className="field-label block mb-1">Email</label>
              <input
                type="email"
                className="form-input w-full px-3 py-2 text-sm"
                value={form.email}
                onChange={set('email')}
                placeholder="patient@example.com"
              />
            </div>
          </div>

          <div>
            <label className="field-label block mb-1">Address</label>
            <textarea
              className="form-input w-full px-3 py-2 text-sm"
              rows={2}
              value={form.address}
              onChange={set('address')}
              placeholder="Street, city, state, ZIP"
            />
          </div>

          <div
            className="pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              * Required fields
            </p>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2 flex items-center gap-2"
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Inserting…' : 'Register Patient'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 card p-3 mono text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent-cyan)' }}>SQL</span>{' '}
        INSERT INTO PATIENT (first_name, last_name, date_of_birth, gender, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)
      </div>
    </div>
  );
}
