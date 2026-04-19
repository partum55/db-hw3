import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportIdStr = searchParams.get('report_id');

  if (!reportIdStr) return Response.json({ error: 'report_id is required' }, { status: 400 });
  const reportId = parseInt(reportIdStr, 10);
  if (isNaN(reportId)) return Response.json({ error: 'report_id must be an integer' }, { status: 400 });

  try {
    const [headerRows] = await pool.execute<RowDataPacket[]>(`
      SELECT  p.first_name,
              p.last_name,
              p.date_of_birth,
              lr.report_date,
              lr.overall_status,
              lr.comments,
              lr.is_amended,
              lr.amendment_note,
              CONCAT(ms.first_name, ' ', ms.last_name) AS reviewed_by
      FROM    LAB_REPORT    lr
      JOIN    SPECIMEN      s   ON s.specimen_id  = lr.specimen_id
      JOIN    TEST_ORDER    o   ON o.order_id     = s.order_id
      JOIN    PATIENT       p   ON p.patient_id   = o.patient_id
      JOIN    MEDICAL_STAFF ms  ON ms.staff_id    = lr.reviewed_by
      WHERE   lr.report_id = ?
    `, [reportId]);

    if (headerRows.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const [itemRows] = await pool.execute<RowDataPacket[]>(`
      SELECT  td.test_name,
              td.test_code,
              td.normal_range,
              td.unit,
              ri.measured_value,
              ri.text_result,
              ri.flag
      FROM    RESULT_ITEM     ri
      JOIN    TEST_DEFINITION td ON td.test_def_id = ri.test_def_id
      WHERE   ri.report_id = ?
      ORDER BY ri.item_seq_no
    `, [reportId]);

    return Response.json({ header: headerRows[0], items: itemRows });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
