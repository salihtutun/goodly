// CJS-compatible mock for @/lib/api (avoids import.meta ESM issue in Jest)
const axios = require('axios');

const API_BASE = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(' ');
  }
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
}

module.exports = api;
module.exports.formatApiError = formatApiError;
module.exports.API_BASE = API_BASE;
