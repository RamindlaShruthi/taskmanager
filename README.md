# Team Task Manager (Full-Stack)

A simple production-ready web app where admins create projects, add members, assign tasks, and members update task status. The app uses Express REST APIs, JWT authentication, password hashing, SQLite, and a plain HTML/CSS/JavaScript frontend.

## 1. Complete Folder Structure

```text
team-task-manager/
  public/
    css/
      styles.css
    js/
      api.js
      auth.js
      dashboard.js
      projects.js
      tasks.js
    dashboard.html
    index.html
    login.html
    projects.html
    signup.html
    tasks.html
  scripts/
    seed.js
  src/
    config/
      db.js
    middleware/
      auth.js
    routes/
      authRoutes.js
      dashboardRoutes.js
      projectRoutes.js
      taskRoutes.js
      userRoutes.js
    utils/
      validators.js
  .env.example
  .gitignore
  package.json
  Procfile
  README.md
  server.js
```

## 2. Backend Code

Backend files are in `server.js` and the `src/` folder:

- `server.js`: Express app setup and route mounting
- `src/config/db.js`: SQLite connection and schema creation
- `src/middleware/auth.js`: JWT authentication and admin authorization
- `src/routes/authRoutes.js`: signup, login, current user
- `src/routes/userRoutes.js`: admin user/member listing
- `src/routes/projectRoutes.js`: project creation, listing, member assignment
- `src/routes/taskRoutes.js`: task creation, listing, status update, delete
- `src/routes/dashboardRoutes.js`: task statistics

## 3. Frontend Code

Frontend files are in `public/`:

- `index.html`: landing screen
- `login.html`: user login
- `signup.html`: user signup
- `dashboard.html`: task summary cards
- `projects.html`: project list, project creation, member assignment
- `tasks.html`: task list, task creation, task status updates
- `public/css/styles.css`: simple responsive styling
- `public/js/*.js`: API helper and page logic

## 4. Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Admin', 'Member')) DEFAULT 'Member',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE project_members (
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK(status IN ('Pending', 'In Progress', 'Completed')) DEFAULT 'Pending',
  due_date TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  assigned_to INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

## 5. Run Locally

1. Install Node.js 18 or newer.
2. Open a terminal in the project folder.
3. Install dependencies:

```bash
npm install
```

4. Create your environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

5. Edit `.env` and set a strong `JWT_SECRET`.
6. Create sample data:

```bash
npm run seed
```

7. Start the server:

```bash
npm start
```

8. Open:

```text
http://localhost:3000
```

## 6. Railway Deployment Guide

1. Push this project to GitHub.
2. Log in to Railway.
3. Click **New Project**.
4. Choose **Deploy from GitHub repo**.
5. Select this repository.
6. Add environment variables in Railway:

```text
JWT_SECRET=your-long-random-secret
DB_FILE=./database/team_task_manager.sqlite
```

7. Railway will run `npm install` and `npm start`.
8. Open the generated Railway URL.
9. Optional: run the seed command from Railway shell:

```bash
npm run seed
```

Note: Railway filesystems may be ephemeral depending on the plan and service settings. For long-term production data, attach a persistent volume or move to a managed database.

## 7. Sample Test Data

Run:

```bash
npm run seed
```

Accounts:

```text
Admin:
Email: admin@example.com
Password: admin123

Member:
Email: asha@example.com
Password: member123

Member:
Email: rahul@example.com
Password: member123
```

Seeded project:

```text
Website Launch
```

Seeded tasks:

```text
Create homepage content - In Progress - assigned to Asha Member
Fix mobile menu - Pending and overdue - assigned to Rahul Member
```

## 8. API Summary

```text
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users
GET    /api/users/members

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId

GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id/status
DELETE /api/tasks/:id

GET    /api/dashboard
```

## 9. Viva Questions With Answers

1. What is the purpose of this project?
   Answer: It helps teams create projects, assign tasks, and track progress with Admin and Member roles.

2. Which backend framework is used?
   Answer: Node.js with Express is used to build REST APIs.

3. Which database is used?
   Answer: SQLite is used because it is simple, file-based, and easy to set up.

4. How are passwords stored?
   Answer: Passwords are hashed with bcryptjs before saving them in the database.

5. What is JWT used for?
   Answer: JWT is used to authenticate users after login and protect API routes.

6. What can an Admin do?
   Answer: Admins can create projects, add/remove members, assign tasks, update tasks, and view all data.

7. What can a Member do?
   Answer: Members can view their assigned projects/tasks and update their own task status.

8. How are overdue tasks calculated?
   Answer: A task is overdue when its due date is before today and its status is not Completed.

9. How are relationships maintained?
   Answer: Foreign keys connect tasks to users/projects and project members to users/projects.

10. Why is validation important?
    Answer: Validation prevents missing, invalid, or unsafe data from entering the system.

## 10. Demo Explanation Script

Start by opening the Team Task Manager homepage and logging in as the admin user. On the dashboard, show the total, completed, pending, and overdue task counts. Then open the Projects page and create a new project with a short description.

Next, view the project details and add a member to the project. Go to the Tasks page, create a task, select the project, assign it to a member, and choose a due date. Show that the task appears in the task list.

Now log out and log in as a member. Open the dashboard to show that the member sees only their assigned task statistics. Go to the Tasks page and update the task status from Pending to In Progress or Completed. Finally, return to the dashboard and explain how the counts change based on task status and due date.

## Environment Variables

```text
PORT=3000
JWT_SECRET=replace-this-with-a-long-random-secret
DB_FILE=./database/team_task_manager.sqlite
```

## Notes

- Keep `JWT_SECRET` private.
- Do not commit `.env`.
- Use `npm run seed` only for demo/sample data.
- The API performs role checks, so hidden frontend buttons are only for user experience, not security.
