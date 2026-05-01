const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const message = document.getElementById('message');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    try {
      const data = await API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      API.setSession(data);
      window.location.href = '/dashboard.html';
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    try {
      const data = await API.request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          role: document.getElementById('role').value
        })
      });
      API.setSession(data);
      window.location.href = '/dashboard.html';
    } catch (error) {
      message.textContent = error.message;
    }
  });
}
