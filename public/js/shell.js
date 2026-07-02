import { getUser, clearSession, requireAuth } from '/js/auth.js'

export function renderShell(activePage) {
  if (!requireAuth()) return
  const user = getUser()
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    : '?'

  const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

  document.body.innerHTML = `
    <div class="page-wrap">

      <!-- ── Top Nav ── -->
      <nav class="topnav">
        <!-- Brand -->
        <a class="topnav-brand" href="/dashboard">Fashion<em>Intel</em></a>

        <!-- Center Search -->
        <div class="topnav-search-center">
          <div class="topnav-search-wrap">
            <span class="search-icon-lbl">⌕</span>
            <input type="text" id="global-search"
              placeholder="Search brands, topics, news…"
              autocomplete="off"
              oninput="window.__search(this.value)"
              onkeydown="window.__searchKeydown(event)"
              onfocus="window.__searchFocus()"
              onblur="setTimeout(()=>window.__searchBlur(),200)" />
            <div class="search-results" id="search-results"></div>
          </div>
        </div>

        <!-- Right: Profile dropdown -->
        <div class="topnav-right">
          <div class="profile-wrap" id="profile-wrap">
            <button class="profile-btn" onclick="window.__toggleProfile()">
              <div class="profile-avatar">${initials}</div>
              <span class="profile-name">${user?.name?.split(' ')[0] || 'User'}</span>
              <span class="profile-chevron">▼</span>
            </button>
            <div class="profile-dropdown" id="profile-dropdown">
              <div class="profile-dropdown-header">
                <div class="profile-dropdown-name">${user?.name || 'User'}</div>
                <div class="profile-dropdown-email">${user?.email || ''}</div>
              </div>
              <a class="dropdown-link ${activePage==='dashboard'?'active':''}" href="/dashboard">
                <span class="dropdown-link-icon">◈</span> Dashboard
              </a>
              <a class="dropdown-link ${activePage==='settings'?'active':''}" href="/settings">
                <span class="dropdown-link-icon">⊞</span> Manage Searches
              </a>
              ${!isProd ? `
              <a class="dropdown-link ${activePage==='runs'?'active':''}" href="/runs">
                <span class="dropdown-link-icon">⟳</span> Agent Runs
              </a>
              <a class="dropdown-link ${activePage==='logs'?'active':''}" href="/logs">
                <span class="dropdown-link-icon">≡</span> Activity Log
              </a>` : ''}
              <div class="dropdown-divider"></div>
              <button class="dropdown-link danger" onclick="window.__logout()">
                <span class="dropdown-link-icon">⏻</span> Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Page content -->
      <div class="app-body" id="app-body"></div>

      <!-- ── Footer ── -->
      <footer class="site-footer">
        <div class="footer-top">
          <div>
            <div class="footer-brand">Fashion<em>Intel</em></div>
            <p class="footer-tagline">AI-powered fashion brand intelligence. Monitor brands, track consumer trends, and surface insights that matter.</p>
          </div>
          <div class="footer-nav-grid">
            <div class="footer-nav-section">
              <div class="footer-nav-title">Categories</div>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=executive'">Executive</a>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=fashion'">Fashion</a>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=retail'">Retail</a>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=business'">Business</a>
            </div>
            <div class="footer-nav-section">
              <div class="footer-nav-title">Explore</div>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=culture'">Culture</a>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=people'">People</a>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=fairs'">Fairs</a>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=statistics'">Statistics</a>
            </div>
            <div class="footer-nav-section">
              <div class="footer-nav-title">More</div>
              <a class="footer-nav-link" onclick="window.location.href='/category?cat=education'">Education</a>
              <a class="footer-nav-link" onclick="window.location.href='/brands'">Brand Directory</a>
              <a class="footer-nav-link" href="/dashboard">Dashboard</a>
              <a class="footer-nav-link" href="/settings">Manage Searches</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span class="footer-copy">© 2026 Animesh Tiwari</span>
        </div>
      </footer>
    </div>
    <div class="toast-wrap" id="toast-wrap"></div>
  `

  // ── Profile dropdown toggle ──────────────────────────────────
  window.__toggleProfile = function() {
    document.getElementById('profile-wrap').classList.toggle('open')
  }
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!document.getElementById('profile-wrap')?.contains(e.target)) {
      document.getElementById('profile-wrap')?.classList.remove('open')
    }
  })

  window.__logout = () => { clearSession(); window.location.href = '/login' }

  // ── Logo fallback chain ──────────────────────────────────────
  // Clearbit's free Logo API shut down Dec 8, 2025. Logo <img> tags
  // across the app set data-fallbacks="[...]" with remaining source
  // URLs to try; this walks through them on error, and finally
  // falls back to showing the brand's initial letter.
  window.__logoErr = function(img, initial) {
    try {
      const chain = JSON.parse(img.dataset.fallbacks || '[]')
      if (chain.length) {
        img.src = chain.shift()
        img.dataset.fallbacks = JSON.stringify(chain)
        return
      }
    } catch {}
    img.style.display = 'none'
    if (img.parentElement) img.parentElement.textContent = initial || '?'
  }

  // ── Search logic ─────────────────────────────────────────────
  let _articles = []
  const token = localStorage.getItem('fna_token')

  fetch('/api/articles?limit=300', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json()).then(data => { _articles = data || [] }).catch(() => {})

  window.__searchFocus = () => {
    const q = document.getElementById('global-search').value.trim()
    if (q) renderSearchResults(q)
  }
  window.__searchBlur = () => {
    document.getElementById('search-results').classList.remove('show')
  }
  window.__search = (q) => {
    if (!q.trim()) { document.getElementById('search-results').classList.remove('show'); return }
    renderSearchResults(q)
  }

  // Enter → go to brand page or category page
  window.__searchKeydown = (e) => {
    if (e.key !== 'Enter') return
    const q = document.getElementById('global-search').value.trim()
    if (!q) return
    document.getElementById('search-results').classList.remove('show')
    window.location.href = `/brand?q=${encodeURIComponent(q)}`
  }

  function renderSearchResults(q) {
    const box = document.getElementById('search-results')
    const ql = q.toLowerCase()

    // Match articles
    const articleHits = _articles
      .filter(a =>
        a.title?.toLowerCase().includes(ql) ||
        a.ai_summary?.toLowerCase().includes(ql) ||
        a.topics?.name?.toLowerCase().includes(ql) ||
        a.competitors?.name?.toLowerCase().includes(ql) ||
        a.source_name?.toLowerCase().includes(ql)
      ).slice(0, 4)

    // Match brands from articles
    const brandHits = [...new Set(
      _articles
        .filter(a => a.competitors?.name?.toLowerCase().includes(ql))
        .map(a => a.competitors?.name)
        .filter(Boolean)
    )].slice(0, 3)

    // Categories
    const cats = ['Executive','Fashion','Retail','Business','Culture','People','Fairs','Statistics','Education']
    const catHits = cats.filter(c => c.toLowerCase().includes(ql))

    let html = ''

    if (catHits.length) {
      html += `<div class="search-result-section">Categories</div>`
      html += catHits.map(c => `
        <a class="search-result-item" href="/category?cat=${c.toLowerCase()}">
          <span style="font-size:1.1rem;width:44px;text-align:center">📂</span>
          <div>
            <div class="search-result-title">${c}</div>
            <div class="search-result-meta">Browse all ${c} news</div>
          </div>
        </a>`).join('')
    }

    if (brandHits.length) {
      html += `<div class="search-result-section">Brands</div>`
      html += brandHits.map(b => `
        <a class="search-result-item" href="/brand?q=${encodeURIComponent(b)}">
          <span style="font-size:1.1rem;width:44px;text-align:center">🏷️</span>
          <div>
            <div class="search-result-title">${b}</div>
            <div class="search-result-meta">View brand profile & news</div>
          </div>
        </a>`).join('')
    }

    if (articleHits.length) {
      html += `<div class="search-result-section">Articles</div>`
      html += articleHits.map(a => `
        <a class="search-result-item" href="${a.url}" target="_blank" rel="noopener">
          <img class="search-result-thumb"
            src="${a.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&q=60'}"
            onerror="this.style.display='none'" alt="" />
          <div>
            <div class="search-result-title">${escHtml(a.title)}</div>
            <div class="search-result-meta">${a.source_name || ''} · ${a.topics?.name || a.competitors?.name || ''}</div>
          </div>
        </a>`).join('')
    }

    if (!html) {
      // No local results → show "search web for brand" option
      html = `
        <a class="search-result-item" href="/brand?q=${encodeURIComponent(q)}">
          <span style="font-size:1.1rem;width:44px;text-align:center">🔍</span>
          <div>
            <div class="search-result-title">Search for "${q}"</div>
            <div class="search-result-meta">View brand profile, founder info & latest news</div>
          </div>
        </a>`
    }

    box.innerHTML = html
    box.classList.add('show')
  }

  function escHtml(s='') {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }
}
