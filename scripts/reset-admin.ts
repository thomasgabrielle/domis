import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcrypt";

const dbUrl = process.env.DATABASE_URL!;
const isLocalhost = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
const pool = new Pool({
  connectionString: dbUrl,
  ...(isLocalhost ? {} : { ssl: { rejectUnauthorized: false } }),
});

async function resetAdmin() {
  const client = await pool.connect();
  try {
    const password = await bcrypt.hash("admin123", 10);

    // Ensure roles + permissions exist
    await client.query(`
      INSERT INTO roles (id, name, display_name, is_system_role)
      VALUES (gen_random_uuid(), 'system_admin', 'System Administrator', true)
      ON CONFLICT (name) DO NOTHING
    `);

    const roleResult = await client.query(`SELECT id FROM roles WHERE name = 'system_admin'`);
    const roleId = roleResult.rows[0]?.id;
    if (!roleId) throw new Error("Could not find or create system_admin role");

    // Upsert admin user
    const existing = await client.query(`SELECT id FROM users WHERE username = 'admin'`);
    if (existing.rows.length > 0) {
      await client.query(`UPDATE users SET password = $1, role_id = $2, role = 'system_admin', status = 'active' WHERE username = 'admin'`, [password, roleId]);
      console.log("Admin password reset to admin123");
    } else {
      await client.query(
        `INSERT INTO users (id, username, password, full_name, email, role_id, role, department, status)
         VALUES (gen_random_uuid(), 'admin', $1, 'System Administrator', 'admin@domis.gov', $2, 'system_admin', 'IT', 'active')`,
        [password, roleId]
      );
      console.log("Admin user created with password admin123");
    }

    // Ensure system_admin role has all permissions
    const perms = await client.query(`SELECT id FROM permissions`);
    if (perms.rows.length === 0) {
      console.log("Warning: No permissions found — you may need to seed roles first.");
    } else {
      for (const perm of perms.rows) {
        await client.query(
          `INSERT INTO role_permissions (id, role_id, permission_id) VALUES (gen_random_uuid(), $1, $2) ON CONFLICT DO NOTHING`,
          [roleId, perm.id]
        );
      }
      console.log(`Assigned ${perms.rows.length} permissions to system_admin role`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

resetAdmin().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
