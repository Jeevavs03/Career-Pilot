import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { IJob } from '../types';
import { logger } from '../utils/logger';

export class JobScraper {
  private browser: Browser | null = null;

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeLinkedInJob(url: string): Promise<Partial<IJob> | null> {
    try {
      await this.init();
      const page = await this.browser!.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      const title = await page.$eval('h1', el => el.textContent?.trim() || '').catch(() => '');
      const company = await page.$eval('.topcard__org-name-link, .top-card-layout__second-subline a', el => el.textContent?.trim() || '').catch(() => '');
      const location = await page.$eval('.topcard__flavor--bullet, .top-card-layout__second-subline span:first-child', el => el.textContent?.trim() || '').catch(() => '');
      const description = await page.$eval('.description__text, .show-more-less-html__markup', el => el.textContent?.trim() || '').catch(() => '');

      await page.close();

      if (!title) return null;

      const skills = this.extractSkills(description);
      const { min, max } = this.extractExperience(description);

      return {
        title, company, location, description, url, skills,
        experienceMin: min, experienceMax: max,
        source: 'linkedin', datePosted: new Date(), dateCollected: new Date(),
        status: 'new', isActive: true,
      };
    } catch (e) {
      logger.error('LinkedIn scrape failed:', e);
      return null;
    }
  }

  async scrapeNaukriJob(url: string): Promise<Partial<IJob> | null> {
    try {
      await this.init();
      const page = await this.browser!.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      const title = await page.$eval('.jd-header-title, h1.jd-title', el => el.textContent?.trim() || '').catch(() => '');
      const company = await page.$eval('.jd-header-comp-name a, .company-name', el => el.textContent?.trim() || '').catch(() => '');
      const experience = await page.$eval('.exp .val, .experience .val', el => el.textContent?.trim() || '').catch(() => '');
      const salary = await page.$eval('.sal .val, .salary .val', el => el.textContent?.trim() || '').catch(() => '');
      const location = await page.$eval('.loc .val, .location .val', el => el.textContent?.trim() || '').catch(() => '');
      const description = await page.$eval('.job-desc, .dang-inner-html', el => el.textContent?.trim() || '').catch(() => '');
      const skillElements = await page.$$eval('.key-skill .chip, .chip-container .chip', els => els.map(el => el.textContent?.trim() || '')).catch(() => []);

      await page.close();

      if (!title) return null;

      const { min, max } = this.extractExperience(experience);
      const salaryParsed = this.parseSalary(salary);

      return {
        title, company, salary, location, description, url,
        skills: skillElements.length > 0 ? skillElements : this.extractSkills(description),
        experience, experienceMin: min, experienceMax: max,
        salaryMin: salaryParsed.min, salaryMax: salaryParsed.max,
        source: 'naukri', datePosted: new Date(), dateCollected: new Date(),
        status: 'new', isActive: true,
      };
    } catch (e) {
      logger.error('Naukri scrape failed:', e);
      return null;
    }
  }

  async scrapeCareerPage(url: string): Promise<Partial<IJob>[]> {
    try {
      const response = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(response.data);
      const jobs: Partial<IJob>[] = [];

      // Generic career page parsing
      $('a[href*="job"], a[href*="career"], a[href*="position"]').each((_, el) => {
        const title = $(el).text().trim();
        const jobUrl = $(el).attr('href') || '';
        if (title && title.length > 5 && title.length < 100) {
          jobs.push({
            title, url: jobUrl.startsWith('http') ? jobUrl : new URL(jobUrl, url).toString(),
            company: new URL(url).hostname.replace('www.', '').split('.')[0],
            source: 'company', dateCollected: new Date(), status: 'new', isActive: true,
            skills: [], location: 'India', description: '',
          });
        }
      });

      return jobs.slice(0, 50);
    } catch (e) {
      logger.error('Career page scrape failed:', e);
      return [];
    }
  }

  async scrapeFromUrl(url: string): Promise<Partial<IJob> | null> {
    if (url.includes('linkedin.com')) return this.scrapeLinkedInJob(url);
    if (url.includes('naukri.com')) return this.scrapeNaukriJob(url);
    return this.scrapeGenericJob(url);
  }

  private async scrapeGenericJob(url: string): Promise<Partial<IJob> | null> {
    try {
      const response = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(response.data);

      const title = $('h1').first().text().trim() || $('title').text().trim();
      const description = $('body').text().substring(0, 5000);
      const skills = this.extractSkills(description);

      return {
        title, url, description: description.substring(0, 2000), skills,
        company: new URL(url).hostname.replace('www.', ''),
        source: 'other', dateCollected: new Date(), status: 'new', isActive: true,
        location: 'India',
      };
    } catch {
      return null;
    }
  }

  private extractSkills(text: string): string[] {
    const knownSkills = [
      'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
      'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Git', 'REST', 'GraphQL',
      'Python', 'Java', 'Next.js', 'Nest.js', 'Redux', 'RxJS', 'SASS',
      'Jest', 'Webpack', 'Vite', 'CI/CD', 'Agile', 'Scrum',
    ];
    const textLower = text.toLowerCase();
    return knownSkills.filter(s => textLower.includes(s.toLowerCase()));
  }

  private extractExperience(text: string): { min: number; max: number } {
    const match = text.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)/i);
    if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
    const single = text.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) + 2 };
    return { min: 0, max: 5 };
  }

  private parseSalary(salary: string): { min: number; max: number } {
    const match = salary.match(/([\d.]+)\s*[-–to]+\s*([\d.]+)\s*(?:L|Lacs|LPA)/i);
    if (match) return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
    const single = salary.match(/([\d.]+)\s*(?:L|Lacs|LPA)/i);
    if (single) return { min: parseFloat(single[1]), max: parseFloat(single[1]) };
    return { min: 0, max: 0 };
  }
}

export const jobScraper = new JobScraper();
