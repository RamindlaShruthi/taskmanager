setupLayout();

const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const message = document.getElementById('message');

async function loadAdminSelects() {
  const user = API.user();
  if (user.role !== 'Admin') return;

  const projects = await API.request('/api/projects');
  const members = await API.request('/api/users/members');
  document.getElementById('projectId').innerHTML = projects
    .map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`)
    .join('');
  document.getElementById('assignedTo').innerHTML = members
    .map((member) => `<option value="${member.id}">${escapeHtml(member.name)}</option>`)
    .join('');
}

async function loadTasks() {
  const tasks = await API.request('/api/tasks');
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = '<p>No tasks found.</p>';
    return;
  }

  tasks.forEach((task) => {
    const card = document.createElement('article');
    card.className = 'item-card';
    const overdueClass = task.is_overdue ? 'overdue' : '';
    card.innerHTML = `
      <h3>${escapeHtml(task.title)}</h3>
      <p>${escapeHtml(task.description || 'No description')}</p>
      <p class="meta">Project: ${escapeHtml(task.project_name)} | Assigned to: ${escapeHtml(task.assigned_to_name)} | Due: <span class="${overdueClass}">${escapeHtml(task.due_date)}</span></p>
      <p><span class="badge ${task.status === 'Completed' ? 'done' : ''}">${escapeHtml(task.status)}</span></p>
      <div class="item-actions">
        <select data-status="${task.id}">
          <option ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
        <button data-save="${task.id}">Update status</button>
      </div>
    `;
    taskList.appendChild(card);
  });

  document.querySelectorAll('[data-save]').forEach((button) => {
    button.addEventListener('click', async () => {
      const taskId = button.dataset.save;
      const status = document.querySelector(`[data-status="${taskId}"]`).value;
      await API.request(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadTasks();
    });
  });
}

if (taskForm) {
  taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    try {
      await API.request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: document.getElementById('title').value,
          description: document.getElementById('description').value,
          dueDate: document.getElementById('dueDate').value,
          projectId: document.getElementById('projectId').value,
          assignedTo: document.getElementById('assignedTo').value
        })
      });
      taskForm.reset();
      await loadTasks();
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

loadAdminSelects()
  .then(loadTasks)
  .catch((error) => {
    message.textContent = error.message;
  });
