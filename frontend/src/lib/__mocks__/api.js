// Auto-discovered mock for @/lib/api (resolved to src/lib/api via moduleNameMapper)
const visibilityData = {
  overall_score: 68,
  informed_fraction: 0.5,
  breakdown: {
    google: { score: 70, has_data: true },
    instagram: { score: null, has_data: false },
    tiktok: { score: null, has_data: false },
    youtube: { score: null, has_data: false },
    ai_assistants: { score: null, has_data: false },
    gbp: { score: null, has_data: false },
  },
};

const summaryData = {
  projects_count: 0,
  audits_count: 0,
  average_score: null,
  recent_audits: [],
};

const mockApi = {
  get: jest.fn(function(url) {
    if (url === '/dashboard/visibility') return Promise.resolve({ data: visibilityData });
    if (url === '/dashboard/summary') return Promise.resolve({ data: summaryData });
    if (url === '/projects') return Promise.resolve({ data: [] });
    return Promise.resolve({ data: {} });
  }),
  post: jest.fn().mockResolvedValue({ data: {} }),
};
mockApi.formatApiError = jest.fn(function(e) { return 'API error'; });
module.exports = mockApi;
