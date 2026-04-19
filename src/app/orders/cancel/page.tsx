'use client';

import { useState, useEffect } from 'react';

interface OrderOption {
  order_id: number;
  patient_id: number;
  first_name: string;
  last_name: string;
  order_date: string;
  status: string;
  priority: string;
}

interface CancelResult {
  order_id: number;
  before: { status: string };
  after:  { status: string; cancellation_reason: string };
}

export default function OrderCancelPage() {
  const [orders, setOrders]     = useState<OrderOption[]>([]);
  const [loadingDD, setLoadingDD] = useState(true);
  const [ddError, setDdError]   = useState<string | null>(null);

  const [orderId, setOrderId]   = useState('');
  const [reason, setReason]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState<CancelResult | null>(null);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        if (data.error) setDdError(data.error);
        else setOrders(data);
      })
      .catch(() => setDdError('Failed to load orders'))
      .finally(() => setLoadingDD(false));
  }, []);

  const selectedOrder = orders.find(o => String(o.order_id) === orderId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) { setError('Please select an order'); return; }
    if (!reason.trim()) { setError('Cancellation reason is required'); return; }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Unknown error');
      } else {
        setSuccess(data);
        setOrders(prev => prev.filter(o => String(o.order_id) !== orderId));
        setOrderId('');
        setReason('');
      }
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<string, string> = {
    ORDERED: 'var(--accent-cyan)', IN_PROGRESS: 'var(--accent-amber)',
    COMPLETED: 'var(--accent-green)', CANCELLED: 'var(--text-muted)',
  };
  const priorityColor: Record<string, string> = {
    ROUTINE: 'var(--accent-cyan)', URGENT: 'var(--accent-amber)', STAT: 'var(--accent-red)',
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="field-label mb-1">Form 3 — UPDATE</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Cancel Test Order
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Sets{' '}
          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>TEST_ORDER.status = &apos;CANCELLED&apos;</span>
          {' '}and records the reason
        </p>
      </div>

      {success && (
        <div className="alert-warning p-4 mb-6">
          <p className="field-label mb-2">Order #{success.order_id} Cancelled</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3">
              <p className="field-label mb-1" style={{ color: 'var(--text-muted)' }}>Before</p>
              <p className="mono text-sm font-bold" style={{ color: statusColor[success.before.status] ?? 'var(--text-primary)' }}>
                {success.before.status}
              </p>
            </div>
            <div className="card p-3">
              <p className="field-label mb-1" style={{ color: 'var(--text-muted)' }}>After</p>
              <p className="mono text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                CANCELLED
              </p>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--accent-amber)', opacity: 0.8 }}>
            Reason: {success.after.cancellation_reason}
          </p>
        </div>
      )}

      {error && <div className="alert-error p-4 mb-6 text-sm">{error}</div>}
      {ddError && <div className="alert-warning p-3 mb-4 text-xs">{ddError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card p-5 flex flex-col gap-4">
          <div>
            <label className="field-label block mb-1">Test Order *</label>
            {loadingDD ? (
              <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="spinner" /><span className="text-sm">Loading orders…</span>
              </div>
            ) : (
              <select
                className="form-input w-full px-3 py-2 text-sm"
                value={orderId}
                onChange={e => { setOrderId(e.target.value); setError(null); setSuccess(null); }}
              >
                <option value="">Select non-cancelled order…</option>
                {orders.map(o => (
                  <option key={o.order_id} value={o.order_id}>
                    [{o.order_id}] {o.first_name} {o.last_name} — {o.status} — {o.order_date}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedOrder && (
            <div
              className="card p-3 grid grid-cols-3 gap-2 text-xs"
              style={{ background: 'var(--bg-surface-2)' }}
            >
              <div>
                <p className="field-label mb-1">Current Status</p>
                <p className="mono font-bold" style={{ color: statusColor[selectedOrder.status] ?? 'inherit' }}>
                  {selectedOrder.status}
                </p>
              </div>
              <div>
                <p className="field-label mb-1">Priority</p>
                <p className="mono font-bold" style={{ color: priorityColor[selectedOrder.priority] ?? 'inherit' }}>
                  {selectedOrder.priority}
                </p>
              </div>
              <div>
                <p className="field-label mb-1">Order Date</p>
                <p className="mono">{selectedOrder.order_date}</p>
              </div>
            </div>
          )}

          <div>
            <label className="field-label block mb-1">Cancellation Reason *</label>
            <textarea
              className="form-input w-full px-3 py-2 text-sm"
              rows={3}
              value={reason}
              onChange={e => { setReason(e.target.value); setError(null); }}
              placeholder="Document the clinical reason for cancellation…"
            />
          </div>

          <div
            className="pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {orders.length} cancellable order{orders.length !== 1 ? 's' : ''}
            </p>
            <button
              type="submit"
              disabled={loading || loadingDD || !orderId}
              className="btn-primary px-6 py-2 flex items-center gap-2"
              style={!loading && orderId ? { background: 'var(--accent-amber)', color: '#060a12' } : {}}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Updating…' : 'Cancel Order'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 card p-3 mono text-xs" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent-cyan)' }}>SQL</span>{' '}
        {"UPDATE TEST_ORDER SET status = 'CANCELLED', cancellation_reason = ? WHERE order_id = ? AND status != 'CANCELLED'"}
      </div>
    </div>
  );
}
