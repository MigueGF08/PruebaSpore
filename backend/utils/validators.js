const allowedRoles = new Set(['user', 'admin']);

function parsePositiveInt(value, fallback = null) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

function validatePositiveInt(value) {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: 'ID is required' };
  }

  const parsed = parsePositiveInt(value);
  if (parsed === null) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { valid: false, error: 'ID must be a number' };
    } else if (!Number.isInteger(numValue)) {
      return { valid: false, error: 'ID must be an integer' };
    } else if (numValue <= 0) {
      return { valid: false, error: 'ID must be a positive number' };
    } else {
      return { valid: false, error: 'Invalid ID format' };
    }
  }

  return { valid: true, value: parsed };
}

function parsePageLimit(queryPage, queryLimit, defaults = { page: 1, limit: 10, maxLimit: 100 }) {
  const page = parsePositiveInt(queryPage, defaults.page) || defaults.page;
  let limit = parsePositiveInt(queryLimit, defaults.limit) || defaults.limit;
  if (limit > defaults.maxLimit) limit = defaults.maxLimit;
  return { page, limit, offset: (page - 1) * limit };
}

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  // Simple RFC5322-ish email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateRole(role) {
  if (typeof role !== 'string') return false;
  return allowedRoles.has(role.trim());
}

function getValidRolesFromParam(roleParam) {
  if (!roleParam) return [];
  const parts = String(roleParam)
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);
  const valid = parts.filter(p => allowedRoles.has(p));
  // If any provided role is invalid, we surface it by returning null
  if (valid.length !== parts.length) return null;
  return valid;
}

function validatePhone(phone) {
  if (phone == null || phone === '') return true; // optional
  if (typeof phone !== 'string') return false;
  // allow digits, spaces, dashes, parentheses, leading +, min 7 digits overall
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 20;
}

function sanitizeQueryString(q) {
  if (q == null) return '';
  return String(q).trim().slice(0, 200);
}

module.exports = {
  parsePositiveInt,
  validatePositiveInt,
  parsePageLimit,
  validateEmail,
  validateRole,
  getValidRolesFromParam,
  validatePhone,
  sanitizeQueryString,
  allowedRoles: Array.from(allowedRoles)
};
