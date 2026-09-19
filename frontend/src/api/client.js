const TOKEN_KEY = 'bovipulse_token'
const USER_KEY = 'bovipulse_user'

// Remember-me: persistent localStorage when true, per-tab sessionStorage when false.
function stores() {
  return [localStorage, sessionStorage]
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function getSessionUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(token, user, remember = true) {
  const primary = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  primary.setItem(TOKEN_KEY, token)
  primary.setItem(USER_KEY, JSON.stringify(user))
  other.removeItem(TOKEN_KEY)
  other.removeItem(USER_KEY)
}

export function clearSession() {
  for (const s of stores()) {
    s.removeItem(TOKEN_KEY)
    s.removeItem(USER_KEY)
  }
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function request(path, { method = 'GET', body, isForm = false, signal } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (isForm) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload, signal })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
  }

  const text = await res.text()
  const data = parseJson(text)
  if (!res.ok) {
    if (res.status === 401 && token) clearSession()
    throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`, data?.details)
  }
  return data
}

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

export const api = {
  get: (path, signal) => request(path, { signal }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
}

export const authApi = {
  register: ({ name, email, password, role, phone }) =>
    api.post('/auth/register', { name, email, password, role, phone }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
}

export const farmApi = {
  create: (data) => api.post('/farms', data),
  mine: () => api.get('/farms/me'),
  updateMine: (data) => api.patch('/farms/me', data),
}

export const cattleApi = {
  list: (params = {}) => api.get(`/cattle?${new URLSearchParams(params)}`),
  get: (id) => api.get(`/cattle/${id}`),
  create: (data) => api.post('/cattle', data),
  update: (id, data) => api.patch(`/cattle/${id}`, data),
  remove: (id) => api.del(`/cattle/${id}`),
}

export const vaccinationApi = {
  list: (params = {}) => api.get(`/vaccinations?${new URLSearchParams(params)}`),
  create: (data) => api.post('/vaccinations', data),
  update: (id, data) => api.patch(`/vaccinations/${id}`, data),
  remove: (id) => api.del(`/vaccinations/${id}`),
}

export const inventoryApi = {
  list: (params = {}) => api.get(`/inventory?${new URLSearchParams(params)}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.patch(`/inventory/${id}`, data),
  remove: (id) => api.del(`/inventory/${id}`),
}

export const alertApi = {
  list: (params = {}) => api.get(`/alerts?${new URLSearchParams(params)}`),
  markRead: (id) => api.patch(`/alerts/${id}/read`),
  markAllRead: () => api.patch('/alerts/read-all'),
  remove: (id) => api.del(`/alerts/${id}`),
}

export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
}

export const thermalApi = {
  readings: (params = {}) => api.get(`/thermaguard/readings?${new URLSearchParams(params)}`),
  logReading: (data) => api.post('/thermaguard/readings', data),
  summary: (params = {}) => api.get(`/thermaguard/summary?${new URLSearchParams(params)}`),
  // ML inference lives outside the backend (trained/served externally).
  // Use these to submit + list abnormal-pattern predictions.
  submitPrediction: (data) => api.post('/thermaguard/predictions', data),
  predictions: (params = {}) => api.get(`/thermaguard/predictions?${new URLSearchParams(params)}`),
}

export const observationApi = {
  list: (params = {}) => api.get(`/observations?${new URLSearchParams(params)}`),
  create: (data) => api.post('/observations', data),
}

// ---------------------------------------------------------------------------
// FUTURE ENHANCEMENTS (parked, not part of revised core):
// vaccinationApi, inventoryApi, gestaApi, muzzleApi below are kept so old
// imports don't break, but their pages/routes are hidden from navigation.
// Do not build new features on them until the health core is evaluated.
// ---------------------------------------------------------------------------

export const gestaApi = {
  exams: (params = {}) => api.get(`/gestacheck/exams?${new URLSearchParams(params)}`),
  createExam: (data) => api.post('/gestacheck/exams', data),
  predict: (data) => api.post('/gestacheck/predict', data),
}

export const muzzleApi = {
  identify: (file) => {
    const form = new FormData()
    form.append('image', file)
    return api.upload('/muzzleid/identify', form)
  },
  registerProfile: (file, cattleId) => {
    const form = new FormData()
    form.append('image', file)
    form.append('cattleId', cattleId)
    return api.upload('/muzzleid/register', form)
  },
  profiles: (params = {}) => api.get(`/muzzleid/profiles?${new URLSearchParams(params)}`),
}
