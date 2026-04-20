import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date_from = searchParams.get('date_from');
  const date_to   = searchParams.get('date_to');

  if (!date_from) return Response.json({ error: 'date_from is required' }, { status: 400 });
  if (!date_to)   return Response.json({ error: 'date_to is required' },   { status: 400 });

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      WITH ranked AS (
        SELECT
          p.patient_id,
          p.first_name,
          p.last_name,
          lr.overall_status,
          lr.report_date,
          lr.report_id,
          CONCAT(ms.first_name, ' ', ms.last_name) AS reviewed_by,
          COUNT(lr.report_id) OVER (PARTITION BY p.patient_id) AS abnormal_count,
          MAX(lr.report_date)  OVER (PARTITION BY p.patient_id) AS latest_report_date,
          ROW_NUMBER()         OVER (PARTITION BY p.patient_id ORDER BY lr.report_date DESC, lr.report_id DESC) AS rn
        FROM    LAB_REPORT    lr
        JOIN    SPECIMEN      s   ON s.specimen_id = lr.specimen_id
        JOIN    TEST_ORDER    o   ON o.order_id    = s.order_id
        JOIN    PATIENT       p   ON p.patient_id  = o.patient_id
        JOIN    MEDICAL_STAFF ms  ON ms.staff_id   = lr.reviewed_by
        WHERE   lr.overall_status IN ('ABNORMAL', 'CRITICAL')
          AND   lr.report_date BETWEEN ? AND ?
      )
      SELECT
        patient_id,
        first_name,
        last_name,
        abnormal_count,
        latest_report_date,
        overall_status AS statuses,
        reviewed_by
      FROM ranked
      WHERE rn = 1
      ORDER BY abnormal_count DESC, latest_report_date DESC
    `, [date_from, date_to]);

    return Response.json({ rows, date_from, date_to });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
