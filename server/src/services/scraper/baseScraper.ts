import puppeteer, { Browser, Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export interface ScrapedProduct {
  storeName: string;
  productName: string;
  brand?: string;
  price: number;
  salePrice?: number;
  onSale: boolean;
  unit?: string;
  quantity?: number;
  category?: string;
  saleEndDate?: string;
  url?: string;
}

export abstract class BaseScraper {
  protected storeName: string;
  protected delayMs: number;

  constructor(storeName: string, delayMs = 2000) {
    this.storeName = storeName;
    this.delayMs = delayMs;
  }

  protected async createBrowser(): Promise<Browser> {
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }

  protected getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  protected async delay(ms?: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms || this.delayMs));
  }

  protected async setupPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    await page.setUserAgent(this.getRandomUserAgent());
    await page.setViewport({ width: 1280, height: 800 });
    return page;
  }

  abstract scrape(): Promise<ScrapedProduct[]>;

  async saveProducts(products: ScrapedProduct[]): Promise<number> {
    let saved = 0;
    for (const product of products) {
      try {
        const existing: any[] = await query(
          'SELECT id FROM store_products WHERE store_name = ? AND product_name = ? AND (brand = ? OR (brand IS NULL AND ? IS NULL))',
          [product.storeName, product.productName, product.brand || null, product.brand || null]
        );

        if (existing.length > 0) {
          await query(
            `UPDATE store_products SET price = ?, sale_price = ?, on_sale = ?, unit = ?,
             quantity = ?, category = ?, sale_end_date = ?, url = ?, last_scraped = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [product.price, product.salePrice || null, product.onSale, product.unit || null,
             product.quantity || null, product.category || null, product.saleEndDate || null,
             product.url || null, existing[0].id]
          );
        } else {
          await query(
            `INSERT INTO store_products (id, store_name, product_name, brand, price, sale_price,
             on_sale, unit, quantity, category, sale_end_date, url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), product.storeName, product.productName, product.brand || null,
             product.price, product.salePrice || null, product.onSale, product.unit || null,
             product.quantity || null, product.category || null, product.saleEndDate || null,
             product.url || null]
          );
        }
        saved++;
      } catch (err) {
        logger.error(`Failed to save product ${product.productName}`, err);
      }
    }
    return saved;
  }
}
