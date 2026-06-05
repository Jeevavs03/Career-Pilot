import { chromium, Browser, Page } from 'playwright';
import { IJob, IUserProfile } from '../types';
import { logger } from '../utils/logger';

export class JobSearchScraper {
  private browser: Browser | null = null;

  private async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    }
  }

  async close() {
    if (this.browser) { await this.browser.close(); this.browser = null; }
  }

  async searchLinkedIn(profile: IUserProfile): Promise<Partial<IJob>[]> {
    const jobs: Partial<IJob>[] = [];
    try {
      await this.init();
      const page = await this.browser!.newPage();
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

      const locations = profile.locations?.length ? profile.locations : [profile.location || 'India'];

      for (const role of profile.targetRoles.slice(0, 3)) {
        for (const loc of locations) {
          const query = encodeURIComponent(role);
          const location = encodeURIComponent(loc);
          const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}&f_E=2%2C3&f_TPR=r604800&sortBy=R`;

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(3000);

          const jobCards = await page.$$('.base-card, .job-search-card, .jobs-search__results-list li');
          
          for (const card of jobCards.slice(0, 10)) {
            try {
              const title = await card.$eval('h3, .base-search-card__title', el => el.textContent?.trim() || '').catch(() => '');
              const company = await card.$eval('h4, .base-search-card__subtitle', el => el.textContent?.trim() || '').catch(() => '');
              const location = await card.$eval('.job-search-card__location, .base-search-card__metadata span', el => el.textContent?.trim() || '').catch(() => '');
              const link = await card.$eval('a', el => el.getAttribute('href') || '').catch(() => '');

              if (title && company && link) {
                jobs.push({
                  title, company, location, url: link.split('?')[0],
                  source: 'linkedin', datePosted: new Date(), dateCollected: new Date(),
                  status: 'new', isActive: true, skills: [],
                  description: `${role} position at ${company}`,
                });
              }
            } catch { /* skip card */ }
          }
        } catch (e) { logger.warn(`LinkedIn search failed for "${role}" in ${loc}:`, e); }
        }
      }

      await page.close();
    } catch (e) { logger.error('LinkedIn search error:', e); }
    return jobs;
  }

  async searchNaukri(profile: IUserProfile): Promise<Partial<IJob>[]> {
    const jobs: Partial<IJob>[] = [];
    try {
      await this.init();
      const page = await this.browser!.newPage();

      for (const role of profile.targetRoles.slice(0, 3)) {
        const query = role.replace(/\s+/g, '-').toLowerCase();
        const exp = profile.experience || 1;
        const url = `https://www.naukri.com/${query}-jobs?experience=${exp}`;

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(3000);

          const jobCards = await page.$$('.srp-jobtuple-wrapper, .jobTuple, article.jobTuple');

          for (const card of jobCards.slice(0, 10)) {
            try {
              const title = await card.$eval('.title, a.title', el => el.textContent?.trim() || '').catch(() => '');
              const company = await card.$eval('.comp-name, .companyInfo a', el => el.textContent?.trim() || '').catch(() => '');
              const salary = await card.$eval('.sal-wrap span, .salary', el => el.textContent?.trim() || '').catch(() => '');
              const location = await card.$eval('.locWrap span, .loc-wrap span', el => el.textContent?.trim() || '').catch(() => '');
              const experience = await card.$eval('.exp-wrap span, .experience', el => el.textContent?.trim() || '').catch(() => '');
              const link = await card.$eval('a.title, a[class*="title"]', el => el.getAttribute('href') || '').catch(() => '');
              const skillTags = await card.$$eval('.tag-li, .skill-tag, .tags-gt span', els => els.map(el => el.textContent?.trim() || '')).catch(() => []);

              if (title && company) {
                const salaryParsed = this.parseSalary(salary);
                jobs.push({
                  title, company, salary, location, experience, url: link || url,
                  skills: skillTags.filter(Boolean),
                  salaryMin: salaryParsed.min, salaryMax: salaryParsed.max,
                  source: 'naukri', datePosted: new Date(), dateCollected: new Date(),
                  status: 'new', isActive: true, description: `${title} at ${company}. Skills: ${skillTags.join(', ')}`,
                });
              }
            } catch { /* skip card */ }
          }
        } catch (e) { logger.warn(`Naukri search failed for "${role}":`, e); }
      }

      await page.close();
    } catch (e) { logger.error('Naukri search error:', e); }
    return jobs;
  }

  async searchIndeed(profile: IUserProfile): Promise<Partial<IJob>[]> {
    const jobs: Partial<IJob>[] = [];
    try {
      await this.init();
      const page = await this.browser!.newPage();

      const locations = profile.locations?.length ? profile.locations : [profile.location || 'India'];

      for (const role of profile.targetRoles.slice(0, 3)) {
        for (const loc of locations) {
          const query = encodeURIComponent(role);
          const location = encodeURIComponent(loc);
          // Use country-specific Indeed domains for international
          const domain = loc.toLowerCase().includes('usa') || loc.toLowerCase().includes('united states') ? 'www.indeed.com'
            : loc.toLowerCase().includes('uk') || loc.toLowerCase().includes('united kingdom') ? 'uk.indeed.com'
            : loc.toLowerCase().includes('canada') ? 'ca.indeed.com'
            : 'in.indeed.com';
          const url = `https://${domain}/jobs?q=${query}&l=${location}&fromage=7`;

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(3000);

          const jobCards = await page.$$('.job_seen_beacon, .jobsearch-ResultsList > li, .result');

          for (const card of jobCards.slice(0, 10)) {
            try {
              const title = await card.$eval('h2 a span, .jobTitle span', el => el.textContent?.trim() || '').catch(() => '');
              const company = await card.$eval('.companyName, [data-testid="company-name"]', el => el.textContent?.trim() || '').catch(() => '');
              const location = await card.$eval('.companyLocation, [data-testid="text-location"]', el => el.textContent?.trim() || '').catch(() => '');
              const salary = await card.$eval('.salary-snippet-container, .metadata .attribute_snippet', el => el.textContent?.trim() || '').catch(() => '');
              const link = await card.$eval('h2 a, a.jcs-JobTitle', el => el.getAttribute('href') || '').catch(() => '');

              if (title && company) {
                jobs.push({
                  title, company, location, salary, url: link.startsWith('http') ? link : `https://in.indeed.com${link}`,
                  source: 'other', datePosted: new Date(), dateCollected: new Date(),
                  status: 'new', isActive: true, skills: [], description: `${title} at ${company}`,
                });
              }
            } catch { /* skip */ }
          }
        } catch (e) { logger.warn(`Indeed search failed for "${role}" in ${loc}:`, e); }
        }
      }

      await page.close();
    } catch (e) { logger.error('Indeed search error:', e); }
    return jobs;
  }

  async searchGlassdoor(profile: IUserProfile): Promise<Partial<IJob>[]> {
    const jobs: Partial<IJob>[] = [];
    try {
      await this.init();
      const page = await this.browser!.newPage();

      const locations = profile.locations?.length ? profile.locations : [profile.location || 'India'];

      for (const role of profile.targetRoles.slice(0, 2)) {
        for (const loc of locations) {
          const query = encodeURIComponent(role);
          const locSlug = loc.toLowerCase().replace(/\s+/g, '-');
          const url = `https://www.glassdoor.co.in/Job/${locSlug}-${query.replace(/%20/g, '-')}-jobs-SRCH_KO0,${role.length}.htm?fromAge=7`;

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(3000);

          const jobCards = await page.$$('[data-test="jobListing"], .react-job-listing, li.jl');

          for (const card of jobCards.slice(0, 10)) {
            try {
              const title = await card.$eval('[data-test="job-title"], .jobTitle', el => el.textContent?.trim() || '').catch(() => '');
              const company = await card.$eval('.employerName, [data-test="emp-name"]', el => el.textContent?.trim() || '').catch(() => '');
              const location = await card.$eval('[data-test="emp-location"], .loc', el => el.textContent?.trim() || '').catch(() => '');
              const salary = await card.$eval('[data-test="detailSalary"], .salary-estimate', el => el.textContent?.trim() || '').catch(() => '');
              const link = await card.$eval('a[data-test="job-title"], a.jobTitle', el => el.getAttribute('href') || '').catch(() => '');

              if (title && company) {
                jobs.push({
                  title, company, location, salary, url: link.startsWith('http') ? link : `https://www.glassdoor.co.in${link}`,
                  source: 'other', datePosted: new Date(), dateCollected: new Date(),
                  status: 'new', isActive: true, skills: [], description: `${title} at ${company}`,
                });
              }
            } catch { /* skip */ }
          }
        } catch (e) { logger.warn(`Glassdoor search failed for "${role}" in ${loc}:`, e); }
        }
      }

      await page.close();
    } catch (e) { logger.error('Glassdoor search error:', e); }
    return jobs;
  }

  async searchInstahyre(profile: IUserProfile): Promise<Partial<IJob>[]> {
    const jobs: Partial<IJob>[] = [];
    try {
      await this.init();
      const page = await this.browser!.newPage();

      const skills = [...profile.skills.frontend, ...profile.skills.backend].slice(0, 3).join(',');
      const url = `https://www.instahyre.com/search-jobs/?skills=${encodeURIComponent(skills)}&exp=${profile.experience || 1}`;

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        const jobCards = await page.$$('.opportunity-card, .job-card, [class*="jobCard"]');

        for (const card of jobCards.slice(0, 15)) {
          try {
            const title = await card.$eval('h3, .job-title, [class*="title"]', el => el.textContent?.trim() || '').catch(() => '');
            const company = await card.$eval('.company-name, [class*="company"]', el => el.textContent?.trim() || '').catch(() => '');
            const salary = await card.$eval('.salary, [class*="salary"]', el => el.textContent?.trim() || '').catch(() => '');
            const location = await card.$eval('.location, [class*="location"]', el => el.textContent?.trim() || '').catch(() => '');
            const link = await card.$eval('a', el => el.getAttribute('href') || '').catch(() => '');

            if (title && company) {
              jobs.push({
                title, company, location, salary, url: link.startsWith('http') ? link : `https://www.instahyre.com${link}`,
                source: 'other', datePosted: new Date(), dateCollected: new Date(),
                status: 'new', isActive: true, skills: [], description: `${title} at ${company}`,
              });
            }
          } catch { /* skip */ }
        }
      } catch (e) { logger.warn('Instahyre search failed:', e); }

      await page.close();
    } catch (e) { logger.error('Instahyre search error:', e); }
    return jobs;
  }

  async searchFoundit(profile: IUserProfile): Promise<Partial<IJob>[]> {
    const jobs: Partial<IJob>[] = [];
    try {
      await this.init();
      const page = await this.browser!.newPage();

      const locations = profile.locations?.length ? profile.locations : [profile.location || 'India'];

      for (const role of profile.targetRoles.slice(0, 2)) {
        for (const loc of locations) {
          const query = encodeURIComponent(role);
          const url = `https://www.foundit.in/srp/results?query=${query}&locations=${encodeURIComponent(loc)}&experience=${profile.experience || 1}`;

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(3000);

          const jobCards = await page.$$('.card-apply-content, .jobTuple, [class*="cardContainer"]');

          for (const card of jobCards.slice(0, 10)) {
            try {
              const title = await card.$eval('.card-title, h3, [class*="title"]', el => el.textContent?.trim() || '').catch(() => '');
              const company = await card.$eval('.company-name, [class*="company"]', el => el.textContent?.trim() || '').catch(() => '');
              const salary = await card.$eval('.salary, [class*="salary"]', el => el.textContent?.trim() || '').catch(() => '');
              const location = await card.$eval('.loc, [class*="location"]', el => el.textContent?.trim() || '').catch(() => '');
              const link = await card.$eval('a', el => el.getAttribute('href') || '').catch(() => '');

              if (title && company) {
                jobs.push({
                  title, company, location, salary, url: link.startsWith('http') ? link : `https://www.foundit.in${link}`,
                  source: 'other', datePosted: new Date(), dateCollected: new Date(),
                  status: 'new', isActive: true, skills: [], description: `${title} at ${company}`,
                });
              }
            } catch { /* skip */ }
          }
        } catch (e) { logger.warn(`Foundit search failed for "${role}" in ${loc}:`, e); }
        }
      }

      await page.close();
    } catch (e) { logger.error('Foundit search error:', e); }
    return jobs;
  }

  async searchWellfound(profile: IUserProfile): Promise<Partial<IJob>[]> {
    const jobs: Partial<IJob>[] = [];
    try {
      await this.init();
      const page = await this.browser!.newPage();

      const role = profile.targetRoles[0] || 'Software Engineer';
      const url = `https://wellfound.com/role/l/software-engineer/india`;

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        const jobCards = await page.$$('[class*="styles_jobListing"], [data-test="StartupResult"]');

        for (const card of jobCards.slice(0, 10)) {
          try {
            const title = await card.$eval('[class*="jobTitle"], h4', el => el.textContent?.trim() || '').catch(() => '');
            const company = await card.$eval('[class*="startupName"], h3', el => el.textContent?.trim() || '').catch(() => '');
            const salary = await card.$eval('[class*="compensation"], [class*="salary"]', el => el.textContent?.trim() || '').catch(() => '');
            const location = await card.$eval('[class*="location"]', el => el.textContent?.trim() || '').catch(() => '');
            const link = await card.$eval('a', el => el.getAttribute('href') || '').catch(() => '');

            if (title && company) {
              jobs.push({
                title, company, location, salary, url: link.startsWith('http') ? link : `https://wellfound.com${link}`,
                source: 'other', datePosted: new Date(), dateCollected: new Date(),
                status: 'new', isActive: true, skills: [], description: `${title} at ${company}`,
              });
            }
          } catch { /* skip */ }
        }
      } catch (e) { logger.warn('Wellfound search failed:', e); }

      await page.close();
    } catch (e) { logger.error('Wellfound search error:', e); }
    return jobs;
  }

  async searchAll(profile: IUserProfile): Promise<Partial<IJob>[]> {
    const results = await Promise.allSettled([
      this.searchLinkedIn(profile),
      this.searchNaukri(profile),
      this.searchIndeed(profile),
      this.searchGlassdoor(profile),
      this.searchInstahyre(profile),
      this.searchFoundit(profile),
      this.searchWellfound(profile),
    ]);

    const allJobs = results
      .filter((r): r is PromiseFulfilledResult<Partial<IJob>[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    await this.close();
    logger.info(`Found ${allJobs.length} jobs across all platforms`);
    return allJobs;
  }

  private parseSalary(salary: string): { min: number; max: number } {
    const match = salary.match(/([\d.]+)\s*[-–to]+\s*([\d.]+)\s*(?:L|Lacs|LPA)/i);
    if (match) return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
    const single = salary.match(/([\d.]+)\s*(?:L|Lacs|LPA)/i);
    if (single) return { min: parseFloat(single[1]), max: parseFloat(single[1]) };
    return { min: 0, max: 0 };
  }
}

export const jobSearchScraper = new JobSearchScraper();
