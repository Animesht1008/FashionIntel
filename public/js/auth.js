// ── Auth session helpers ──────────────────────────────────────
export function saveSession(token, user) {
  localStorage.setItem('fna_token', token)
  localStorage.setItem('fna_user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('fna_token')
  localStorage.removeItem('fna_user')
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('fna_user'))
  } catch {
    return null
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('fna_token')
}

// Redirect to login if not authenticated
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login'
    return false
  }
  return true
}

// Redirect to dashboard if already authenticated
export function redirectIfAuth() {
  if (isLoggedIn()) {
    window.location.href = '/dashboard'
    return true
  }
  return false
}
