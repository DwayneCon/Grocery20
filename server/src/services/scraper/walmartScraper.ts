import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedProduct } from './baseScraper.js';
import { logger } from '../../utils/logger.js';

const WALMART_CATEGORIES = [
  { name: 'Produce', url: 'https://www.walmart.com/browse/food/fresh-produce/976759_976793_8910423' },
  { name: 'Meat & Seafood', url: 'https://www.walmart.com/browse/food/meat-seafood/976759_976793_1086446' },
  { name: 'Dairy & Eggs', url: 'https://www.walmart.com/browse/food/dairy-eggs/976759_976793_1001339' },
  { name: 'Pantry', url: 'https://www.walmart.com/browse/food/pantry/976759_976793_1001320' },
  { name: 'Frozen', url: 'https://www.walmart.com/browse/food/frozen/976759_976793_1001507' },
  { name: 'Snacks', url: 'https://www.walmart.com/browse/food/snacks/976759_976793_1001514' },
  { name: 'Beverages', url: 'https://www.walmart.com/browse/food/beverages/976759_976793_1001285' },
];

export class WalmartScraper extends BaseScraper {
  constructor() {
    super('Walmart', 3000);
  }

  async scrape(): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];
    let browser;

    try {
      browser = await this.createBrowser();

      for (const category of WALMART_CATEGORIES) {
        try {
          logger.info(`Scraping category: ${category.name}`, { storeName: 'Walmart' });
          const products = await this.scrapeCategory(browser, category);
          allProducts.push(...products);
          logger.info(`Found ${products.length} products in ${category.name}`, { storeName: 'Walmart' });
          await this.delay();
        } catch (err) {
          logger.error(`Failed to scrape ${category.name}`, err, { storeName: 'Walmart' });
        }
      }
    } finally {
      if (browser) await browser.close();
    }

    logger.info(`Total products scraped: ${allProducts.length}`, { storeName: 'Walmart' });
    return allProducts;
  }

  private async scrapeCategory(
    browser: any,
    category: { name: string; url: string }
  ): Promise<ScrapedProduct[]> {
    const page = await this.setupPage(browser);
    const products: ScrapedProduct[] = [];

    try {
      await page.goto(category.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for product grid to load
      await page.waitForSelector('[data-testid="list-view"]', { timeout: 10000 }).catch(() => {
        return page.waitForSelector('.search-result-gridview-items, [data-item-id]', { timeout: 5000 });
      });

      // Scroll to load more products
      await this.autoScroll(page);

      const html = await page.content();
      const $ = cheerio.load(html);

      $('[data-item-id], [data-testid="list-view"] > div').each((_: number, el: any) => {
        try {
          const $el = $(el);

          const name = $el.find('[data-automation-id="product-title"], .lh-title, span.f6').first().text().trim();
          if (!name) return;

          const priceText = $el.find('[data-automation-id="product-price"] .f2, .price-main .visuallyhidden, [itemprop="price"]').first().text().trim();
          const currentPrice = this.parsePrice(priceText);
          if (!currentPrice) return;

          const wasPriceText = $el.find('.was-price, .strike-through, [data-automation-id="strikethrough-price"]').first().text().trim();
          const wasPrice = this.parsePrice(wasPriceText);

          const brand = this.extractBrand(name);

          const product: ScrapedProduct = {
            storeName: 'Walmart',
            productName: name.substring(0, 255),
            brand: brand || undefined,
            price: wasPrice || currentPrice,
            salePrice: wasPrice ? currentPrice : undefined,
            onSale: !!wasPrice,
            category: category.name,
            url: category.url,
          };

          products.push(product);
        } catch {
          // Skip individual product parse errors
        }
      });
    } catch (err) {
      logger.error(`Error loading ${category.name}`, err, { storeName: 'Walmart' });
    } finally {
      await page.close();
    }

    return products;
  }

  private async autoScroll(page: any): Promise<void> {
    /* eslint-disable no-undef -- runs in browser context via page.evaluate */
    await page.evaluate(`(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const maxScrolls = 10;
        let scrollCount = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrollCount++;
          if (totalHeight >= document.body.scrollHeight || scrollCount >= maxScrolls) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    })()`);
  }

  private parsePrice(text: string): number | null {
    if (!text) return null;
    const match = text.match(/\$?([\d,]+\.?\d*)/);
    if (!match) return null;
    const price = parseFloat(match[1].replace(',', ''));
    return isNaN(price) ? null : price;
  }

  private extractBrand(productName: string): string | null {
    const words = productName.split(' ');
    if (words.length >= 2) {
      const potentialBrand = words.slice(0, 2).join(' ');
      if (potentialBrand.length <= 30) return potentialBrand;
    }
    return null;
  }
}
