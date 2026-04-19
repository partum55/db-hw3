import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT specimen_id, barcode, specimen_type, status FROM SPECIMEN ORDER BY specimen_id'
    );
    return Response.json(rows);
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
