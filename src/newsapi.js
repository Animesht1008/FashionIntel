import 'dotenv/config'
import logger from './logger.js'

const GNEWS_BASE = 'https://gnews.io/api/v4/search'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Once we detect the daily quota is exhausted, stop hitting the API
// for the rest of this process — every further call would just be
// another wasted 403.
let quotaExhausted = false

export function isQuotaExhausted() {
  return quotaExhausted
}

/**
 * Fetch articles from GNews for a given set of keywords.
 * Returns an array of raw article objects.
 */
export async function fetchArticlesForKeywords(keywords = [], maxResults = 10) {
  if (!process.env.GNEWS_API_KEY) {
    logger.warn('GNEWS_API_KEY not set — skipping news fetch')
    return []
  }

  // Clean special characters that break GNews query strings (e.g. H&M)
  const cleaned = keywords
    .slice(0, 3)
    .map(k => k
      .replace(/&/g, 'and')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    )
    .filter(Boolean)

  if (!cleaned.length) return []

  const query = cleaned.join(' OR ')

  const url = new URL(GNEWS_BASE)
  url.searchParams.set('q', query)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('max', String(maxResults))
  url.searchParams.set('sortby', 'publishedAt')
  url.searchParams.set('apikey', process.env.GNEWS_API_KEY)

  // Delay to avoid hitting GNews rate limits (429) on rapid sequential calls
  await sleep(1500)

  try {
    const res = await fetch(url.toString())

    if (res.status === 429) {
      logger.warn('GNews rate limit hit — skipping this batch', { query })
      return []
    }

    if (!res.ok) {
      logger.error('GNews API error', { status: res.status, query })
      return []
    }

    const data = await res.json()
    logger.debug('GNews fetch', { query, count: data.articles?.length ?? 0 })
    return data.articles || []
  } catch (err) {
    logger.error('GNews fetch failed', { error: err.message, query })
    return []
  }
}
