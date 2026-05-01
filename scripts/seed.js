const bcrypt = require('bcryptjs');
const { initDb, run, get } = require('../src/config/db');

async function createUser(name, email, password, role) {
  const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return existing.id;

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return result.id;
}

async function seed() {
  await initDb();

  const adminId = await createUser('Admin User', 'admin@example.com', 'admin123', 'Admin');
  const memberOneId = await createUser('Asha Member', 'asha@example.com', 'member123', 'Member');
  const memberTwoId = await createUser('Rahul Member', 'rahul@example.com', 'member123', 'Member');

  let project = await get('SELECT id FROM projects WHERE name = ?', ['Website Launch']);
  if (!project) {
    const result = await run(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)',
      ['Website Launch', 'Launch the company marketing website.', adminId]
    );
    project = { id: result.id };
  }

  await run('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [
    project.id,
    memberOneId
  ]);
  await run('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [
    project.id,
    memberTwoId
  ]);

  const task = await get('SELECT id FROM tasks WHERE title = ?', ['Create homepage content']);
  if (!task) {
    await run(
      `INSERT INTO tasks (title, description, status, due_date, project_id, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Create homepage content',
        'Write concise copy for the homepage sections.',
        'In Progress',
        '2026-05-10',
        project.id,
        memberOneId,
        adminId
      ]
    );
    await run(
      `INSERT INTO tasks (title, description, status, due_date, project_id, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Fix mobile menu',
        'Make navigation responsive on small screens.',
        'Pending',
        '2026-04-25',
        project.id,
        memberTwoId,
        adminId
      ]
    );
  }

  console.log('Seed data ready.');
  console.log('Admin login: admin@example.com / admin123');
  console.log('Member login: asha@example.com / member123');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
