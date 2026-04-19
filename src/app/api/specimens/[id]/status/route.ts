import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const specimenId = parseInt(id, 10);

  if (isNaN(specimenId)) {
    return Response.json({ error: 'Invalid specimen_id' }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { status, rejection_reason } = body;

  const validStatuses = ['PENDING', 'IN_PROCESS', 'COMPLETED', 'REJECTED'];
  if (!status || !validStatuses.includes(status)) {
    return Response.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  if (status === 'REJECTED' && !rejection_reason?.trim()) {
    return Response.json({ error: 'rejection_reason is required when status is REJECTED' }, { status: 400 });
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT specimen_id, status, barcode, specimen_type FROM SPECIMEN WHERE specimen_id = ?',
      [specimenId]
    );

    if (rows.length === 0) {
      return Response.json({ error: 'Specimen not found' }, { status: 404 });
    }

    const previousStatus = rows[0].status;

    await pool.execute<ResultSetHeader>(
      'UPDATE SPECIMEN SET status = ?, rejection_reason = ? WHERE specimen_id = ?',
      [status, status === 'REJECTED' ? rejection_reason.trim() : null, specimenId]
    );

    return Response.json({
      specimen_id: specimenId,
      before: { status: previousStatus },
      after:  { status, rejection_reason: status === 'REJECTED' ? rejection_reason.trim() : null },
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Database error' }, { status: 500 });
  }
}
