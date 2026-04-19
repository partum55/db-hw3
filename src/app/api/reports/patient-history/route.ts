import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientIdStr = searchParams.get('patient_id');

  if (!patientIdStr) return Response.json({ error: 'patient_id is required' }, { status: 400 });
  const patientId = parseInt(patientIdStr, 10);
  if (isNaN(patientId)) return Response.json({ error: 'patient_id must be an integer' }, { status: 400 });

  try {
    const [patientRows] = await pool.execute<RowDataPacket[]>(
      'SELECT patient_id, first_name, last_name, date_of_birth, gender FROM PATIENT WHERE patient_id = ?',
      [patientId]
    );

    if (patientRows.length === 0) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    const [orderRows] = await pool.execute<RowDataPacket[]>(`
      SELECT  o.order_id,
              o.order_date,
              td.test_name,
              td.test_code,
              o.priority,
              o.status                 AS order_status,
              o.cancellation_reason,
              lr.report_date,
              lr.overall_status        AS report_status
      FROM    TEST_ORDER       o
      JOIN    TEST_DEFINITION  td ON td.test_def_id = o.test_def_id
      LEFT JOIN SPECIMEN       s  ON s.order_id     = o.order_id
      LEFT JOIN LAB_REPORT     lr ON lr.specimen_id = s.specimen_id
      WHERE   o.patient_id = ?
      ORDER BY o.order_date DESC
    `, [patientId]);

    return Response.json({ patient: patientRows[0], orders: orderRows });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
