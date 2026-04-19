import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patientId = parseInt(id, 10);

  if (isNaN(patientId)) {
    return Response.json({ error: 'Invalid patient_id' }, { status: 400 });
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT patient_id, first_name, last_name FROM PATIENT WHERE patient_id = ?',
      [patientId]
    );
    if (rows.length === 0) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    const [countRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM TEST_ORDER WHERE patient_id = ?',
      [patientId]
    );
    const orderCount = Number((countRows as any)[0].cnt);

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM PATIENT WHERE patient_id = ?',
      [patientId]
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    return Response.json({
      deleted_patient_id: patientId,
      patient: rows[0],
      cascaded_orders: orderCount,
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patientId = parseInt(id, 10);

  if (isNaN(patientId)) {
    return Response.json({ error: 'Invalid patient_id' }, { status: 400 });
  }

  try {
    const [patientRows] = await pool.execute<RowDataPacket[]>(
      'SELECT patient_id, first_name, last_name FROM PATIENT WHERE patient_id = ?',
      [patientId]
    );
    if (patientRows.length === 0) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    const [countRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM TEST_ORDER WHERE patient_id = ?',
      [patientId]
    );
    const orderCount = Number((countRows as any)[0].cnt);

    return Response.json({
      patient: patientRows[0],
      order_count: orderCount,
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
