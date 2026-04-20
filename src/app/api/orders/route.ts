import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { patient_id, staff_id, test_def_id, order_date, priority, notes } = body;

  if (!patient_id)  return Response.json({ error: 'patient_id is required' }, { status: 400 });
  if (!staff_id)    return Response.json({ error: 'staff_id is required' }, { status: 400 });
  if (!test_def_id) return Response.json({ error: 'test_def_id is required' }, { status: 400 });
  if (!order_date)  return Response.json({ error: 'order_date is required' }, { status: 400 });
  if (!priority)    return Response.json({ error: 'priority is required' }, { status: 400 });

  const validPriorities = ['ROUTINE', 'URGENT', 'STAT'];
  if (!validPriorities.includes(priority)) {
    return Response.json({ error: `priority must be one of: ${validPriorities.join(', ')}` }, { status: 400 });
  }

  try {
    const [[patientRow]] = await pool.execute<RowDataPacket[]>(
      'SELECT patient_id FROM PATIENT WHERE patient_id = ?', [patient_id]
    );
    if (!patientRow) return Response.json({ error: 'Patient not found' }, { status: 404 });

    const [[staffRow]] = await pool.execute<RowDataPacket[]>(
      "SELECT staff_id FROM MEDICAL_STAFF WHERE staff_id = ? AND role = 'Ordering Physician'", [staff_id]
    );
    if (!staffRow) return Response.json({ error: 'Ordering Physician not found' }, { status: 404 });

    const [[testRow]] = await pool.execute<RowDataPacket[]>(
      'SELECT test_def_id FROM TEST_DEFINITION WHERE test_def_id = ?', [test_def_id]
    );
    if (!testRow) return Response.json({ error: 'Test definition not found' }, { status: 404 });

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO TEST_ORDER (patient_id, staff_id, test_def_id, order_date, priority, status, notes)
       VALUES (?, ?, ?, ?, ?, 'ORDERED', ?)`,
      [patient_id, staff_id, test_def_id, order_date, priority, notes?.trim() || null]
    );

    const orderId = result.insertId;
    const [[newOrder]] = await pool.execute<RowDataPacket[]>(
      `SELECT o.order_id, o.patient_id, p.first_name, p.last_name,
              o.staff_id, CONCAT(ms.first_name,' ',ms.last_name) AS physician_name,
              td.test_name, td.test_code,
              o.order_date, o.priority, o.status, o.notes
       FROM TEST_ORDER o
       JOIN PATIENT p ON p.patient_id = o.patient_id
       JOIN MEDICAL_STAFF ms ON ms.staff_id = o.staff_id
       JOIN TEST_DEFINITION td ON td.test_def_id = o.test_def_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    return Response.json({ order_id: orderId, order: newOrder }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT o.order_id, o.patient_id, p.first_name, p.last_name, o.order_date, o.status, o.priority
       FROM TEST_ORDER o
       JOIN PATIENT p ON p.patient_id = o.patient_id
       WHERE o.status != 'CANCELLED'
       ORDER BY o.order_id DESC
       LIMIT 200`
    );
    return Response.json(rows);
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
