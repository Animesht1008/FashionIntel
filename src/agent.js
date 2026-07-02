import { db } from './db.js'
import { fetchArticlesForKeywords } from './newsapi.js'
import { analyzeArticle } from './ai.js'
import logger from './logger.js'

/**
 * Main agent runner.
 * Fetches news for all active topics + competitors, runs AI analysis, filters noise, and saves to DB.
 */
export async function runAgent(triggeredBy = 'manual') {
  logger.info('Agent run started', { triggeredBy })

  // ── Create run log entry ───────────────────────────────────
  const { data: run, error: runError } = await db
    .from('agent_runs')
    .insert({ status: 'running', triggered_by: triggeredBy })
    .select()
    .single()

  if (runError) {
    logger.error('Failed to create agent run log', { error: runError.message })
    throw runError
  }

  let totalFetched = 0
  let totalSaved = 0
  let totalFiltered = 0
  let totalLinked = 0

  try {
    // ── Load active topics and competitors ─────────────────
    const [{ data: topics }, { data: competitors }] = await Promise.all([
      db.from('topics').select('*').eq('is_active', true),
      db.from('competitors').select('*').eq('is_active', true),
    ])

    logger.info('Loaded config', {
      topics: topics?.length ?? 0,
      competitors: competitors?.length ?? 0,
    })

    // ── Process topics ─────────────────────────────────────
    for (const topic of topics ?? []) {
      logger.debug(`Fetching news for topic: ${topic.name}`)
      const articles = await fetchArticlesForKeywords(topic.keywords)
      totalFetched += articles.length

      for (const article of articles) {
        const result = await processArticle(article, topic.id, null)
        if (result === 'saved') totalSaved++
        else if (result === 'filtered') totalFiltered++
        else if (result === 'linked') totalLinked++
      }
    }

    // ── Process competitors ────────────────────────────────
    // Runs AFTER topics on purpose: if a brand's article was already picked up by a broader topic query above, this pass will LINK the competitor_id onto that existing row (see processArticle) rather than treating it as a throwaway duplicate.
    for (const brand of competitors ?? []) {
      logger.debug(`Fetching news for brand: ${brand.name}`)
      const articles = await fetchArticlesForKeywords(brand.keywords)
      totalFetched += articles.length

      for (const article of articles) {
        const result = await processArticle(article, null, brand.id)
        if (result === 'saved') totalSaved++
        else if (result === 'filtered') totalFiltered++
        else if (result === 'linked') totalLinked++
      }
    }

    // ── Mark run completed ─────────────────────────────────
    await db.from('agent_runs').update({
      status: 'completed',
      articles_fetched: totalFetched,
      articles_saved: totalSaved,
      articles_filtered: totalFiltered,
      completed_at: new Date().toISOString(),
    }).eq('id', run.id)

    logger.info('Agent run completed', { totalFetched, totalSaved, totalFiltered, totalLinked })
    return { success: true, fetched: totalFetched, saved: totalSaved, filtered: totalFiltered, linked: totalLinked }

  } catch (err) {
    logger.error('Agent run failed', { error: err.message })

    await db.from('agent_runs').update({
      status: 'failed',
      error_message: err.message,
      completed_at: new Date().toISOString(),
    }).eq('id', run.id)

    throw err
  }
}

/**
 * Processes a single article: dedup check → AI analysis → DB insert.
 * Returns 'saved' | 'linked' | 'filtered' | 'duplicate'
 */
async function processArticle(article, topicId, competitorId) {
  // ── Dedup check ────────────────────────────────────────────
  // Select existing associations too — if this article was already
  // saved (e.g. found via a topic query) and now shows up again via
  // a brand-specific query, we ATTACH the missing association
  // instead of discarding it. Without this, articles never get
  // tagged with competitor_id if a topic pass reached them first,
  // which was making brands look like they had zero coverage.
  const { data: existing } = await db
    .from('articles')
    .select('id, topic_id, competitor_id')
    .eq('url', article.url)
    .maybeSingle()

  if (existing) {
    const updates = {}
    if (topicId && !existing.topic_id) updates.topic_id = topicId
    if (competitorId && !existing.competitor_id) updates.competitor_id = competitorId

    if (Object.keys(updates).length) {
      await db.from('articles').update(updates).eq('id', existing.id)
      return 'linked'
    }
    return 'duplicate'
  }

  // ── AI analysis ────────────────────────────────────────────
  const analysis = await analyzeArticle(article)

  if (!analysis || analysis.is_noise || analysis.relevance_score < 4) {
    return 'filtered'
  }

  // ── Save to DB ─────────────────────────────────────────────
  const { error } = await db.from('articles').insert({
    title: article.title,
    description: article.description,
    url: article.url,
    image_url: article.image,
    source_name: article.source?.name,
    published_at: article.publishedAt,
    topic_id: topicId,
    competitor_id: competitorId,
    ai_summary: analysis.summary,
    relevance_score: analysis.relevance_score,
    sentiment: analysis.sentiment,
    news_type: analysis.news_type,
    key_insights: analysis.key_insights,
    is_noise: false,
  })

  if (error) {
    logger.error('DB insert failed', { error: error.message, url: article.url })
    return 'filtered'
  }

  return 'saved'
}
