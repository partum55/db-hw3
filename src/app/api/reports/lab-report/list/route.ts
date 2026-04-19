import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT  lr.report_id,
              lr.report_date,
              lr.overall_status,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM    LAB_REPORT  lr
      JOIN    SPECIMEN    s ON s.specimen_id = lr.specimen_id
      JOIN    TEST_ORDER  o ON o.order_id    = s.order_id
      JOIN    PATIENT     p ON p.patient_id  = o.patient_id
      ORDER BY lr.report_date DESC
    `);
    return Response.json(rows);
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
