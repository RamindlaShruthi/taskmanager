function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function isValidStatus(status) {
  return ['Pending', 'In Progress', 'Completed'].includes(status);
}

function isValidRole(role) {
  return ['Admin', 'Member'].includes(role);
}

function isDateString(value) {
  return required(value) && !Number.isNaN(Date.parse(value));
}

module.exports = { required, isEmail, isValidStatus, isValidRole, isDateString };
