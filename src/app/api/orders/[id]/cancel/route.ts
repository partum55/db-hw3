import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    return Response.json({ error: 'Invalid order_id' }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { cancellation_reason } = body;
  if (!cancellation_reason?.trim()) {
    return Response.json({ error: 'cancellation_reason is required' }, { status: 400 });
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT order_id, status, patient_id, order_date FROM TEST_ORDER WHERE order_id = ?',
      [orderId]
    );

    if (rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = rows[0];
    if (order.status === 'CANCELLED') {
      return Response.json({ error: 'Order is already cancelled' }, { status: 409 });
    }

    const previousStatus = order.status;

    await pool.execute<ResultSetHeader>(
      `UPDATE TEST_ORDER SET status = 'CANCELLED', cancellation_reason = ? WHERE order_id = ? AND status != 'CANCELLED'`,
      [cancellation_reason.trim(), orderId]
    );

    return Response.json({
      order_id: orderId,
      before: { status: previousStatus },
      after:  { status: 'CANCELLED', cancellation_reason: cancellation_reason.trim() },
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
