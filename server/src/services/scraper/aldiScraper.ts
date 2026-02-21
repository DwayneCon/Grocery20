import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedProduct } from './baseScraper.js';
import { logger } from '../../utils/logger.js';

const ALDI_PAGES = [
  { name: 'Weekly Specials', url: 'https://www.aldi.us/weekly-specials/this-weeks-aldi-finds/' },
  { name: 'Fresh Produce', url: 'https://www.aldi.us/products/fresh-produce/' },
  { name: 'Fresh Meat & Seafood', url: 'https://www.aldi.us/products/fresh-meat-seafood/' },
  { name: 'Dairy & Eggs', url: 'https://www.aldi.us/products/dairy-eggs/' },
  { name: 'Frozen Foods', url: 'https://www.aldi.us/products/frozen-foods/' },
  { name: 'Snacks', url: 'https://www.aldi.us/products/snacks/' },
  { name: 'Pantry Essentials', url: 'https://www.aldi.us/products/pantry-essentials/' },
  { name: 'Beverages', url: 'https://www.aldi.us/products/beverages/' },
];

export class AldiScraper extends BaseScraper {
  constructor() {
    super('Aldi', 2500);
  }

  async scrape(): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];
    let browser;

    try {
      browser = await this.createBrowser();

      for (const page of ALDI_PAGES) {
        try {
          logger.info(`Scraping: ${page.name}`, { storeName: 'Aldi' });
          const products = await this.scrapePage(browser, page);
          allProducts.push(...products);
          logger.info(`Found ${products.length} products in ${page.name}`, { storeName: 'Aldi' });
          await this.delay();
        } catch (err) {
          logger.error(`Failed to scrape ${page.name}`, err, { storeName: 'Aldi' });
        }
      }
    } finally {
      if (browser) await browser.close();
    }

    logger.info(`Total products scraped: ${allProducts.length}`, { storeName: 'Aldi' });
    return allProducts;
  }

  private async scrapePage(
    browser: any,
    pageInfo: { name: string; url: string }
  ): Promise<ScrapedProduct[]> {
    const page = await this.setupPage(browser);
    const products: ScrapedProduct[] = [];
    const isWeeklySpecials = pageInfo.name === 'Weekly Specials';

    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for product content to load
      await page.waitForSelector('.product-tile, .category-page__product, [data-qa="product-tile"]', { timeout: 10000 }).catch(() => {
        return page.waitForSelector('.box--product, .product', { timeout: 5000 });
      });

      // Scroll to load lazy content
      await this.autoScroll(page);

      const html = await page.content();
      const $ = cheerio.load(html);

      // Parse product tiles - Aldi uses various selectors across page types
      $('.product-tile, .category-page__product, [data-qa="product-tile"], .box--product').each((_: number, el: any) => {
        try {
          const $el = $(el);

          // Product name
          const name = $el.find('.product-tile__name, .product__title, [data-qa="product-title"], h4, h3').first().text().trim();
          if (!name) return;

          // Price
          const priceText = $el.find('.product-tile__price, .product__price, [data-qa="product-price"], .price').first().text().trim();
          const price = this.parsePrice(priceText);
          if (!price) return;

          const product: ScrapedProduct = {
            storeName: 'Aldi',
            productName: name.substring(0, 255),
            price,
            onSale: isWeeklySpecials, // ALDI Finds are limited-time items
            salePrice: isWeeklySpecials ? price : undefined,
            category: pageInfo.name,
            url: pageInfo.url,
          };

          products.push(product);
        } catch {
          // Skip individual product parse errors
        }
      });
    } catch (err) {
      logger.error(`Error loading ${pageInfo.name}`, err, { storeName: 'Aldi' });
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
        const distance = 400;
        const maxScrolls = 8;
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
}
