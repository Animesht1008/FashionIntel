// ── Toast notifications ───────────────────────────────────────
let container

function getContainer() {
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-wrap'
    document.body.appendChild(container)
  }
  return container
}

function show(message, type = 'info', duration = 3500) {
  const wrap = getContainer()
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.textContent = message
  wrap.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.3s'
    setTimeout(() => el.remove(), 300)
  }, duration)
}

export const toast = {
  success: (msg) => show(msg, 'success'),
  error:   (msg) => show(msg, 'error'),
  info:    (msg) => show(msg, 'info'),
}
