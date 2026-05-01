setupLayout();

async function loadDashboard() {
  const user = API.user();
  document.getElementById('welcomeText').textContent = `${user.name} - ${user.role}`;

  const stats = await API.request('/api/dashboard');
  document.getElementById('totalTasks').textContent = stats.totalTasks;
  document.getElementById('completedTasks').textContent = stats.completedTasks;
  document.getElementById('pendingTasks').textContent = stats.pendingTasks;
  document.getElementById('overdueTasks').textContent = stats.overdueTasks;
}

loadDashboard().catch((error) => {
  alert(error.message);
});
