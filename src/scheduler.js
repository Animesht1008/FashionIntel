import cron from 'node-cron'
import { runAgent } from './agent.js'
import logger from './logger.js'

const SCHEDULE = process.env.CRON_SCHEDULE || '0 */6 * * *' // every 6 hours

export function startScheduler() {
  if (!cron.validate(SCHEDULE)) {
    logger.error('Invalid CRON_SCHEDULE expression', { schedule: SCHEDULE })
    return
  }

  cron.schedule(SCHEDULE, async () => {
    logger.info('Scheduled agent run triggered', { schedule: SCHEDULE })
    try {
      await runAgent('scheduler')
    } catch (err) {
      logger.error('Scheduled run failed', { error: err.message })
    }
  })

  logger.info('Scheduler started', { schedule: SCHEDULE })
}
