// Generates supabase/migrations/002_seed_top_brands.sql from
// public/js/brandData.js — keeps the DB seed and the About-page
// data in perfect sync. Run with: node scripts/generate_brand_seed.mjs
import { BRAND_INFO } from '../public/js/brandData.js'
import { writeFileSync } from 'fs'

function esc(s = '') {
  return String(s).replace(/'/g, "''")
}

const lines = []
lines.push('-- Auto-generated from public/js/brandData.js')
lines.push('-- Run scripts/generate_brand_seed.mjs to regenerate after editing brandData.js')
lines.push('--')
lines.push('-- Seeds the full curated brand directory (~100 brands) as competitors.')
lines.push('-- All are inserted PAUSED (is_active = false) by default: GNews\'s free')
lines.push('-- tier only allows 100 requests/day, so monitoring all of these at once')
lines.push('-- would exhaust the quota in a single run. Activate the ones you care')
lines.push('-- about most in Manage Searches — the rest still show full About pages')
lines.push('-- (bio, logo, social links) even while paused.')
lines.push('')
lines.push('-- Required so ON CONFLICT (name) below can detect existing rows')
lines.push('CREATE UNIQUE INDEX IF NOT EXISTS competitors_name_unique_idx ON competitors (name);')
lines.push('')

// Proper-case each dictionary key back into a display name
function toDisplayName(key) {
  const overrides = {
    'h&m': 'H&M',
    'us polo assn': 'US Polo Assn',
    "levi's": "Levi's",
    'jack and jones': 'Jack & Jones',
    'charles and keith': 'Charles & Keith',
    'dolce and gabbana': 'Dolce & Gabbana',
    'and': 'AND',
    'hermès': 'Hermès',
  }
  if (overrides[key]) return overrides[key]
  return key.replace(/\b\w/g, c => c.toUpperCase())
}

// Skip brands commonly already added manually under slightly
// different naming (e.g. user's "BoAt Lifestyle" vs our "Boat") —
// About-page lookups still work via fuzzy matching in getBrandInfo()
// regardless of the exact name stored in the competitors table.
const SKIP_KEYS = new Set(['boat', 'one8'])

for (const [key, info] of Object.entries(BRAND_INFO)) {
  if (SKIP_KEYS.has(key)) continue
  const name = toDisplayName(key)
  const keywords = `ARRAY['${esc(name)}']`
  lines.push(
    `INSERT INTO competitors (name, keywords, category, is_active) VALUES ('${esc(name)}', ${keywords}, '${esc(info.category)}', false) ON CONFLICT (name) DO NOTHING;`
  )
}

writeFileSync(new URL('../supabase/migrations/002_seed_top_brands.sql', import.meta.url), lines.join('\n') + '\n')
console.log(`Generated migration with ${Object.keys(BRAND_INFO).length} brands`)
