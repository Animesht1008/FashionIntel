// ── API Client ────────────────────────────────────────────────
const BASE = '/api'

function getToken() {
  return localStorage.getItem('fna_token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }

  return data
}

export const api = {
  // Auth
  signup: (body) => request('POST', '/auth/signup', body),
  login:  (body) => request('POST', '/auth/login',  body),

  // Agent
  runAgent: ()   => request('POST', '/agent/run'),
  getRuns:  ()   => request('GET',  '/agent/runs'),

  // Articles
  getArticles: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/articles${q ? '?' + q : ''}`)
  },
  getStats: () => request('GET', '/articles/stats'),

  // Topics
  getTopics:    ()         => request('GET',    '/topics'),
  createTopic:  (body)     => request('POST',   '/topics', body),
  updateTopic:  (id, body) => request('PATCH',  `/topics/${id}`, body),
  deleteTopic:  (id)       => request('DELETE', `/topics/${id}`),

  // Sources
  getSources:    ()         => request('GET',    '/sources'),
  createSource:  (body)     => request('POST',   '/sources', body),
  updateSource:  (id, body) => request('PATCH',  `/sources/${id}`, body),
  deleteSource:  (id)       => request('DELETE', `/sources/${id}`),

  // Competitors
  getCompetitors:   ()         => request('GET',    '/competitors'),
  getCompetitorStats: ()       => request('GET',    '/competitors/stats'),
  createCompetitor: (body)     => request('POST',   '/competitors', body),
  updateCompetitor: (id, body) => request('PATCH',  `/competitors/${id}`, body),
  deleteCompetitor: (id)       => request('DELETE', `/competitors/${id}`),

  // Logs
  getLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/logs${q ? '?' + q : ''}`)
  },
}
