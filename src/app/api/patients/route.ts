import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { first_name, last_name, date_of_birth, gender, phone, email, address } = body;

  if (!first_name?.trim()) return Response.json({ error: 'first_name is required' }, { status: 400 });
  if (!last_name?.trim())  return Response.json({ error: 'last_name is required' }, { status: 400 });
  if (!date_of_birth)      return Response.json({ error: 'date_of_birth is required' }, { status: 400 });
  if (!gender)             return Response.json({ error: 'gender is required' }, { status: 400 });

  const validGenders = ['M', 'F', 'Other'];
  if (!validGenders.includes(gender)) {
    return Response.json({ error: `gender must be one of: ${validGenders.join(', ')}` }, { status: 400 });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO PATIENT (first_name, last_name, date_of_birth, gender, phone, email, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name.trim(),
        last_name.trim(),
        date_of_birth,
        gender,
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
      ]
    );
    const patientId = result.insertId;
    const [[newPatient]] = await pool.execute<RowDataPacket[]>(
      'SELECT patient_id, first_name, last_name, date_of_birth, gender, phone, email, address FROM PATIENT WHERE patient_id = ?',
      [patientId]
    );
    return Response.json({ patient_id: patientId, patient: newPatient }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
