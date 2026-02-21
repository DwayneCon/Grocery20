import cron from 'node-cron';
import { predictiveEngine } from './predictiveEngine.js';
import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

/**
 * Start the cron-based scheduler for background tasks.
 *
 * Scheduled jobs:
 * - Weekly meal plan generation: Every Sunday at 6:00 AM
 * - Daily inventory check: Every day at 8:00 AM
 *
 * Each job iterates over all households and runs the corresponding
 * predictive engine function. Errors in one household do not block others.
 */
export function startScheduler(): void {
  // Every Sunday at 6 AM: auto-generate suggested weekly meal plans
  cron.schedule('0 6 * * 0', async () => {
    logger.info('Cron: Running weekly meal plan generation');
    try {
      const households = await query<any[]>('SELECT id FROM households');
      if (!households || households.length === 0) {
        logger.info('Cron: No households found, skipping weekly plan generation');
        return;
      }

      let successCount = 0;
      for (const h of households) {
        try {
          await predictiveEngine.generateWeeklyPlan(h.id);
          successCount++;
        } catch (err) {
          logger.error(`Cron: Weekly plan generation failed for household ${h.id}`, err);
        }
      }
      logger.info(`Cron: Weekly plans generated for ${successCount}/${households.length} households`);
    } catch (err) {
      logger.error('Cron: Weekly plan generation query failed', err);
    }
  });

  // Daily at 8 AM: check inventory for expiring and low-stock items
  cron.schedule('0 8 * * *', async () => {
    logger.info('Cron: Running daily inventory check');
    try {
      const households = await query<any[]>('SELECT id FROM households');
      if (!households || households.length === 0) {
        logger.info('Cron: No households found, skipping inventory check');
        return;
      }

      let successCount = 0;
      for (const h of households) {
        try {
          await predictiveEngine.checkInventory(h.id);
          successCount++;
        } catch (err) {
          logger.error(`Cron: Inventory check failed for household ${h.id}`, err);
        }
      }
      logger.info(`Cron: Inventory checks completed for ${successCount}/${households.length} households`);
    } catch (err) {
      logger.error('Cron: Inventory check query failed', err);
    }
  });

  // Weekly at Sunday 2 AM: scrape store deals (Walmart, Aldi)
  cron.schedule('0 2 * * 0', async () => {
    logger.info('Cron: Starting weekly store deal scrape');
    const scrapers = [
      { name: 'walmart', load: async () => { const m = await import('../scraper/walmartScraper.js'); return new m.WalmartScraper(); } },
      { name: 'aldi', load: async () => { const m = await import('../scraper/aldiScraper.js'); return new m.AldiScraper(); } },
    ];
    for (const { name, load } of scrapers) {
      try {
        const scraper = await load();
        const products = await scraper.scrape();
        const saved = await scraper.saveProducts(products);
        logger.info(`Cron: ${name} scrape complete - scraped ${products.length}, saved ${saved}`);
      } catch (err) {
        logger.error(`Cron: ${name} scrape failed`, err);
      }
    }
  });

  logger.info('Scheduler started: weekly plans (Sun 6AM), inventory checks (daily 8AM), store scrape (Sun 2AM)');
}
