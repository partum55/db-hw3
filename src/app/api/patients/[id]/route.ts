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

    const [[counts]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(DISTINCT o.order_id)                          AS order_count,
         COUNT(DISTINCT s.specimen_id)                       AS specimen_count,
         COUNT(DISTINCT lr.report_id)                        AS report_count,
         COUNT(DISTINCT ri.report_id, ri.item_seq_no)        AS result_item_count
       FROM TEST_ORDER o
       LEFT JOIN SPECIMEN     s  ON s.order_id    = o.order_id
       LEFT JOIN LAB_REPORT   lr ON lr.specimen_id = s.specimen_id
       LEFT JOIN RESULT_ITEM  ri ON ri.report_id  = lr.report_id
       WHERE o.patient_id = ?`,
      [patientId]
    );

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
      cascaded_orders:      Number(counts.order_count),
      cascaded_specimens:   Number(counts.specimen_count),
      cascaded_reports:     Number(counts.report_count),
      cascaded_result_items: Number(counts.result_item_count),
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

    const [[counts]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(DISTINCT o.order_id)                          AS order_count,
         COUNT(DISTINCT s.specimen_id)                       AS specimen_count,
         COUNT(DISTINCT lr.report_id)                        AS report_count,
         COUNT(DISTINCT ri.report_id, ri.item_seq_no)        AS result_item_count
       FROM TEST_ORDER o
       LEFT JOIN SPECIMEN     s  ON s.order_id    = o.order_id
       LEFT JOIN LAB_REPORT   lr ON lr.specimen_id = s.specimen_id
       LEFT JOIN RESULT_ITEM  ri ON ri.report_id  = lr.report_id
       WHERE o.patient_id = ?`,
      [patientId]
    );

    return Response.json({
      patient: patientRows[0],
      order_count:       Number(counts.order_count),
      specimen_count:    Number(counts.specimen_count),
      report_count:      Number(counts.report_count),
      result_item_count: Number(counts.result_item_count),
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
