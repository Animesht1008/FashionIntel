import Groq from 'groq-sdk'
import { z } from 'zod'
import logger from './logger.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── Known news types shown to the UI ───────────────────────────
const VALID_NEWS_TYPES = [
  'product_launch', 'campaign', 'discount', 'earnings',
  'acquisition', 'trend', 'controversy', 'partnership', 'other',
]

// ── Zod schema for AI response validation ─────────────────────
// news_type is coerced to 'other' if the AI invents a type we don't
// recognize (e.g. "regulation", "sustainability") instead of failing
// validation and discarding the article.
const AnalysisSchema = z.object({
  is_noise: z.boolean(),
  relevance_score: z.number().int().min(1).max(10),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  news_type: z.string().transform(val =>
    VALID_NEWS_TYPES.includes(val) ? val : 'other'
  ),
  summary: z.string().min(10),
  key_insights: z.array(z.string()).length(2),
})

/**
 * Analyzes a raw article using Groq + Llama 3.3 70B.
 * Returns a validated analysis object, or null if noise / parse fails.
 */
export async function analyzeArticle(article) {
  const prompt = `You are a senior fashion industry intelligence analyst.
Analyze the following news article and classify it.

Title: ${article.title}
Description: ${article.description || 'N/A'}
Source: ${article.source?.name || 'Unknown'}
Published: ${article.publishedAt || 'Unknown'}

Respond ONLY with a valid JSON object. No markdown, no explanation, no extra text.

{
  "is_noise": false,
  "relevance_score": 8,
  "sentiment": "positive",
  "news_type": "product_launch",
  "summary": "One sentence explaining the key development for a fashion brand analyst.",
  "key_insights": ["Insight one", "Insight two"]
}

Field rules:
- is_noise: true ONLY if the article has zero connection to fashion brands, retail, apparel, consumer trends, or fashion industry economics
- relevance_score: 1–10 (10 = must-read for a fashion brand strategist)
- sentiment: be STRICT and REALISTIC — most news is neutral. Use these rules:
  * positive: only if the article clearly reports growth, success, award, record sales, or a praised launch
  * negative: if it reports declining sales, controversy, lawsuit, stock drop, criticism, or recall
  * neutral: everything else — previews, analysis, general updates, partnerships without a clear outcome
  * When in doubt, use neutral. Do NOT default to positive.
- news_type: pick the single best fit from [product_launch, campaign, discount, earnings, acquisition, trend, controversy, partnership, other]
- summary: one clear sentence a brand analyst would find useful
- key_insights: exactly 2 concise, actionable takeaways`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' }, // forces syntactically valid JSON output
    })

    const raw = response.choices[0].message.content?.trim() || '{}'
    // Strip accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Validate with Zod (news_type auto-coerces unknown values to 'other')
    const result = AnalysisSchema.safeParse(parsed)
    if (!result.success) {
      logger.warn('AI response failed Zod validation', { errors: result.error.issues })
      return null
    }

    return result.data
  } catch (err) {
    logger.error('AI analysis failed', { error: err.message, title: article.title })
    return null
  }
}
