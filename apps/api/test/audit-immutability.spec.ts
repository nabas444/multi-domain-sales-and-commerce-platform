import { dbPool } from '@platform/database';

describe('Audit Log Immutability Suite', () => {
  let logId: string;

  beforeAll(async () => {
    // Insert a valid audit record directly
    const insertRes = await dbPool.query<{ id: string }>(
      `INSERT INTO audit.audit_logs (
        actor_email, resource, resource_id, action, state_diff
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [
        'security-test@platform.local',
        'security_test_resource',
        'sec-001',
        'security.verify_immutability',
        JSON.stringify({ verified: false }),
      ]
    );
    logId = insertRes.rows[0].id;
    expect(logId).toBeDefined();
  });

  it('MUST reject any UPDATE attempt on audit.audit_logs via trigger', async () => {
    let error: any;
    try {
      await dbPool.query(
        `UPDATE audit.audit_logs 
         SET state_diff = $1 
         WHERE id = $2`,
        [JSON.stringify({ verified: true, tampered: true }), logId]
      );
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('Audit logs are immutable. UPDATE and DELETE operations are strictly prohibited.');
  });

  it('MUST reject any DELETE attempt on audit.audit_logs via trigger', async () => {
    let error: any;
    try {
      await dbPool.query(
        `DELETE FROM audit.audit_logs WHERE id = $1`,
        [logId]
      );
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('Audit logs are immutable. UPDATE and DELETE operations are strictly prohibited.');
  });

  it('MUST verify the original audit record remains intact and unmodified', async () => {
    const res = await dbPool.query(
      `SELECT * FROM audit.audit_logs WHERE id = $1`,
      [logId]
    );
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].actor_email).toBe('security-test@platform.local');
    expect(res.rows[0].state_diff).toEqual({ verified: false });
  });
});
