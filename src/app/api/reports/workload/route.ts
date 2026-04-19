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
      SELECT  ms.staff_id,
              ms.first_name,
              ms.last_name,
              ms.role,
              ms.department,
              COUNT(DISTINCT o.order_id)    AS orders_handled,
              COUNT(DISTINCT s.specimen_id) AS specimens_collected,
              COUNT(DISTINCT lr.report_id)  AS reports_reviewed
      FROM    MEDICAL_STAFF ms
      LEFT JOIN TEST_ORDER  o  ON  o.staff_id        = ms.staff_id
                               AND o.order_date      BETWEEN ? AND ?
      LEFT JOIN SPECIMEN    s  ON  s.collected_by    = ms.staff_id
                               AND s.collection_date BETWEEN ? AND ?
      LEFT JOIN LAB_REPORT  lr ON  lr.reviewed_by    = ms.staff_id
                               AND lr.report_date    BETWEEN ? AND ?
      GROUP BY ms.staff_id, ms.first_name, ms.last_name, ms.role, ms.department
      ORDER BY ms.role, orders_handled DESC
    `, [date_from, date_to, date_from, date_to, date_from, date_to]);

    return Response.json({ rows, date_from, date_to });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
