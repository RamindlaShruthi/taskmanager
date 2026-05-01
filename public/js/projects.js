setupLayout();

const projectList = document.getElementById('projectList');
const projectForm = document.getElementById('projectForm');
const message = document.getElementById('message');

async function loadProjects() {
  const projects = await API.request('/api/projects');
  projectList.innerHTML = '';

  if (projects.length === 0) {
    projectList.innerHTML = '<p>No projects found.</p>';
    return;
  }

  projects.forEach((project) => {
    const card = document.createElement('article');
    card.className = 'item-card';
    card.innerHTML = `
      <h3>${escapeHtml(project.name)}</h3>
      <p>${escapeHtml(project.description || 'No description')}</p>
      <p class="meta">Created by ${escapeHtml(project.created_by_name)}</p>
      <div class="item-actions">
        <button data-view="${project.id}">View details</button>
      </div>
      <div class="project-details" id="details-${project.id}"></div>
    `;
    projectList.appendChild(card);
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => loadProjectDetails(button.dataset.view));
  });
}

async function loadProjectDetails(projectId) {
  const details = await API.request(`/api/projects/${projectId}`);
  const target = document.getElementById(`details-${projectId}`);
  const user = API.user();

  const memberOptions = user.role === 'Admin'
    ? await API.request('/api/users/members')
    : [];

  target.innerHTML = `
    <h4>Members</h4>
    <p>${details.members.map((member) => escapeHtml(member.name)).join(', ') || 'No members yet'}</p>
    ${user.role === 'Admin' ? `
      <div class="form-row">
        <select id="member-select-${projectId}">
          ${memberOptions.map((member) => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join('')}
        </select>
        <button data-add-member="${projectId}">Add member</button>
      </div>
    ` : ''}
    <h4>Tasks</h4>
    <p>${details.tasks.map((task) => `${escapeHtml(task.title)} (${escapeHtml(task.status)})`).join(', ') || 'No tasks yet'}</p>
  `;

  const addButton = target.querySelector('[data-add-member]');
  if (addButton) {
    addButton.addEventListener('click', async () => {
      const select = document.getElementById(`member-select-${projectId}`);
      await API.request(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: select.value })
      });
      await loadProjectDetails(projectId);
    });
  }
}

if (projectForm) {
  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    try {
      await API.request('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('projectName').value,
          description: document.getElementById('projectDescription').value
        })
      });
      projectForm.reset();
      await loadProjects();
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

loadProjects().catch((error) => {
  message.textContent = error.message;
});
