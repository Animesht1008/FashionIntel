// Ambient background — drifting golden threads, fashion-editorial feel
export function initBackground() {
  const canvas = document.getElementById('bg-canvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  let W, H, threads

  function resize() {
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
    initThreads()
  }

  function initThreads() {
    threads = Array.from({ length: 22 }, () => makeThread())
  }

  function makeThread() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      len: 80 + Math.random() * 160,
      angle: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.3,
      rotSpeed: (Math.random() - 0.5) * 0.004,
      opacity: 0.03 + Math.random() * 0.07,
      width: 0.5 + Math.random() * 1.2,
      gold: Math.random() > 0.6,
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)

    for (const t of threads) {
      // Drift
      t.x += Math.cos(t.angle) * t.speed
      t.y += Math.sin(t.angle) * t.speed
      t.angle += t.rotSpeed

      // Wrap
      if (t.x < -200) t.x = W + 100
      if (t.x > W + 200) t.x = -100
      if (t.y < -200) t.y = H + 100
      if (t.y > H + 200) t.y = -100

      const x2 = t.x + Math.cos(t.angle) * t.len
      const y2 = t.y + Math.sin(t.angle) * t.len

      const grad = ctx.createLinearGradient(t.x, t.y, x2, y2)
      const color = t.gold ? `201,168,76` : `240,236,228`
      grad.addColorStop(0,   `rgba(${color},0)`)
      grad.addColorStop(0.4, `rgba(${color},${t.opacity})`)
      grad.addColorStop(0.6, `rgba(${color},${t.opacity})`)
      grad.addColorStop(1,   `rgba(${color},0)`)

      ctx.beginPath()
      ctx.moveTo(t.x, t.y)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = grad
      ctx.lineWidth   = t.width
      ctx.stroke()
    }

    requestAnimationFrame(draw)
  }

  window.addEventListener('resize', resize)
  resize()
  draw()
}
