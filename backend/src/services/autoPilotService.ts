import { chromium, Browser } from 'playwright';
import nodemailer from 'nodemailer';
import { User, Job, Application, Settings, Resume } from '../models/mongoose';
import { jobSearchScraper } from '../scrapers/jobSearchScraper';
import { jobService } from './jobService';
import { matchingEngine } from '../ai/matching';
import { coverLetterGenerator } from '../ai/coverLetter';
import { IUserProfile, IJob } from '../types';
import config from '../config';
import { logger } from '../utils/logger';

interface AppliedJobInfo {
  title: string;
  company: string;
  salary: string;
  location: string;
  skills: string[];
  matchScore: number;
  url: string;
}

interface PipelineResult {
  searched: number;
  matched: number;
  applied: number;
  warnings: string[];
  skippedSteps: string[];
}

export class AutoPilotService {
  private browser: Browser | null = null;

  // Pre-flight: check what's available and what's missing
  private async preflight(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found. Please register first.');

    const profile = user.profile as unknown as IUserProfile;
    const settings = await Settings.findOne({ userId });
    const platforms = (settings as any)?.platforms || {};
    const resume = await Resume.findOne({ userId, type: 'master' });

    const warnings: string[] = [];
    const allSkills = [
      ...(profile?.skills?.frontend || []),
      ...(profile?.skills?.backend || []),
      ...(profile?.skills?.database || []),
      ...(profile?.skills?.tools || []),
      ...(profile?.skills?.orm || []),
    ];

    const hasSkills = allSkills.length > 0;
    const hasTargetRoles = (profile?.targetRoles || []).length > 0;
    const hasResume = !!resume;
    const hasAnyCreds = Object.values(platforms).some((p: any) => p?.email && p?.password);

    if (!hasSkills && !hasTargetRoles) {
      warnings.push('⚠️ No skills or target roles set. Go to Settings → My Profile to add them. Searching with generic terms.');
    } else if (!hasSkills) {
      warnings.push('⚠️ No skills set. Job matching accuracy will be low.');
    } else if (!hasTargetRoles) {
      warnings.push('⚠️ No target roles set. Using skills to search instead.');
    }

    if (!hasResume) {
      warnings.push('⚠️ No resume uploaded. Auto-apply will skip resume attachment. Upload at Resumes page.');
    }

    if (!hasAnyCreds) {
      warnings.push('⚠️ No platform credentials saved. Auto-apply will be skipped. Add credentials in Settings → Platform Accounts.');
    }

    return { user, profile, settings, platforms, resume, warnings, hasSkills, hasTargetRoles, hasResume, hasAnyCreds };
  }

  // Full auto-pilot: search → match → apply → notify
  async runFullPipeline(userId: string): Promise<PipelineResult> {
    const check = await this.preflight(userId);
    const { user, profile, platforms, warnings } = check;
    const skippedSteps: string[] = [];

    // If no skills AND no target roles, we can't search meaningfully
    const canSearch = check.hasSkills || check.hasTargetRoles;
    if (!canSearch) {
      logger.warn('[AutoPilot] No skills or target roles — cannot search.');
      return { searched: 0, matched: 0, applied: 0, warnings, skippedSteps: ['search', 'match', 'apply'] };
    }

    // 1. Search jobs from all platforms
    logger.info(`[AutoPilot] Searching jobs for ${user.name}...`);
    let scrapedJobs: any[] = [];
    try {
      scrapedJobs = await jobSearchScraper.searchAll(profile);
    } catch (e: any) {
      logger.warn('[AutoPilot] Search failed:', e.message);
      warnings.push(`⚠️ Job search encountered errors: ${e.message}`);
    }

    // 2. Save new jobs to DB
    let saved = 0;
    for (const job of scrapedJobs) {
      try {
        await jobService.createJob(job);
        saved++;
      } catch { /* duplicate or error, skip */ }
    }
    logger.info(`[AutoPilot] Saved ${saved} new jobs`);

    // 3. Match & filter using Settings filters
    const filters = (check.settings as any)?.filters || {};
    const minMatchScore = filters.minMatchScore || 70;
    const minSalary = filters.minSalary || 0;
    const maxExperience = filters.maxExperience || 99;
    const excludeTitles: string[] = filters.excludeTitles || [];

    const newJobs = await Job.find({ status: 'new', isActive: true });
    const appliedJobs: AppliedJobInfo[] = [];

    if (!check.hasSkills) {
      skippedSteps.push('match');
      warnings.push('⚠️ Matching skipped — no skills to compare against.');
    } else {
      for (const job of newJobs) {
        try {
          // Filter: excluded titles
          if (excludeTitles.some(t => job.title.toLowerCase().includes(t.toLowerCase()))) {
            await Job.findByIdAndUpdate(job._id, { status: 'filtered', matchScore: 0 });
            continue;
          }

          // Filter: max experience (if job has experienceMin parsed)
          if (job.experienceMin && job.experienceMin > maxExperience) {
            await Job.findByIdAndUpdate(job._id, { status: 'filtered', matchScore: 0 });
            continue;
          }

          // Filter: min salary (if job has salaryMax parsed)
          if (job.salaryMax && job.salaryMax < minSalary) {
            await Job.findByIdAndUpdate(job._id, { status: 'filtered', matchScore: 0 });
            continue;
          }

          const jobObj = job.toObject() as unknown as IJob;
          const match = await matchingEngine.calculateMatchScore(jobObj, profile);

          if (match.overallScore >= minMatchScore) {
            await Job.findByIdAndUpdate(job._id, {
              status: 'matched', matchScore: match.overallScore, matchDetails: match,
            });

            // 4. Auto-apply (only if credentials exist)
            if (check.hasAnyCreds) {
              const applied = await this.applyToJob(job.url, profile, jobObj);
              if (applied) {
                await Job.findByIdAndUpdate(job._id, { status: 'applied' });
                await Application.create({
                  userId, jobId: job._id.toString(), status: 'submitted',
                  matchScore: match.overallScore, answers: [], notes: 'Auto-applied by CareerPilot',
                });
                appliedJobs.push({
                  title: job.title, company: job.company,
                  salary: job.salary || 'Not disclosed',
                  location: job.location || 'India',
                  skills: job.skills || [],
                  matchScore: match.overallScore, url: job.url,
                });
              }
            }
          } else {
            await Job.findByIdAndUpdate(job._id, { status: 'filtered', matchScore: match.overallScore });
          }
        } catch (e) { logger.warn(`[AutoPilot] Failed processing job ${job.title}:`, e); }
      }
    }

    if (!check.hasAnyCreds) {
      skippedSteps.push('apply');
    }

    // 5. Send email notification
    if (appliedJobs.length > 0) {
      await this.sendNotification(user.email, user.name, appliedJobs);
    }

    await this.close();
    logger.info(`[AutoPilot] Complete: ${scrapedJobs.length} found, ${newJobs.length} matched, ${appliedJobs.length} applied`);
    return { searched: scrapedJobs.length, matched: newJobs.length, applied: appliedJobs.length, warnings, skippedSteps };
  }

  private async applyToJob(url: string, profile: IUserProfile, job: IJob): Promise<boolean> {
    try {
      if (!this.browser) {
        this.browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
      }
      const page = await this.browser.newPage();
      const settings = await Settings.findOne({});
      const platforms = (settings as any)?.platforms || {};

      if (url.includes('naukri.com')) {
        return await this.applyNaukri(page, url, profile, platforms.naukri);
      } else if (url.includes('linkedin.com')) {
        return await this.applyLinkedIn(page, url, profile, platforms.linkedin);
      }

      await page.close();
      return false;
    } catch (e) {
      logger.warn(`[AutoPilot] Apply failed for ${url}:`, e);
      return false;
    }
  }

  private async applyNaukri(page: any, url: string, profile: IUserProfile, creds?: { email: string; password: string }): Promise<boolean> {
    try {
      // Login if credentials available
      if (creds?.email && creds?.password) {
        await page.goto('https://login.naukri.com/nLogin/Login.php', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        await page.fill('input[placeholder*="Email"], #usernameField', creds.email).catch(() => {});
        await page.fill('input[type="password"], #passwordField', creds.password).catch(() => {});
        await page.click('button[type="submit"], .loginButton').catch(() => {});
        await page.waitForTimeout(3000);
      }

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Look for "Apply" or "Apply on company site" button
      const applyBtn = await page.$('button#apply-button, button.apply-btn, .apply-button-container button, a[contains="Apply"]');
      if (applyBtn) {
        await applyBtn.click();
        await page.waitForTimeout(3000);
        logger.info(`[AutoPilot] Clicked apply on Naukri: ${url}`);
        await page.close();
        return true;
      }

      await page.close();
      return false;
    } catch {
      await page.close().catch(() => {});
      return false;
    }
  }

  private async applyLinkedIn(page: any, url: string, profile: IUserProfile, creds?: { email: string; password: string }): Promise<boolean> {
    try {
      // Login if credentials available
      if (creds?.email && creds?.password) {
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        await page.fill('#username', creds.email).catch(() => {});
        await page.fill('#password', creds.password).catch(() => {});
        await page.click('button[type="submit"]').catch(() => {});
        await page.waitForTimeout(3000);
      }

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // LinkedIn Easy Apply button
      const easyApply = await page.$('.jobs-apply-button, button[data-control-name="jobdetails_topcard_inapply"]');
      if (easyApply) {
        await easyApply.click();
        await page.waitForTimeout(3000);
        logger.info(`[AutoPilot] Clicked Easy Apply on LinkedIn: ${url}`);
        await page.close();
        return true;
      }

      await page.close();
      return false;
    } catch {
      await page.close().catch(() => {});
      return false;
    }
  }

  private async sendNotification(email: string, name: string, appliedJobs: AppliedJobInfo[]) {
    const html = this.buildEmailHtml(name, appliedJobs);

    // Try SMTP if configured, otherwise save as local report
    if (config.email.host && config.email.user) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.port === 465,
          auth: { user: config.email.user, pass: config.email.pass },
        });

        await transporter.sendMail({
          from: config.email.from || config.email.user,
          to: email,
          subject: `🚀 CareerPilot: ${appliedJobs.length} Jobs Applied Today!`,
          html,
        });

        logger.info(`[AutoPilot] Email sent to ${email}`);
      } catch (e) {
        logger.warn('[AutoPilot] Email failed, saving locally:', e);
        await this.saveLocalReport(html);
      }
    } else {
      // No SMTP configured — save report locally
      await this.saveLocalReport(html);
      logger.info(`[AutoPilot] Report saved locally (no SMTP configured)`);
    }
  }

  private buildEmailHtml(name: string, jobs: AppliedJobInfo[]): string {
    const rows = jobs.map(j => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:12px;"><strong>${j.title}</strong></td>
        <td style="padding:12px;">${j.company}</td>
        <td style="padding:12px;">${j.salary}</td>
        <td style="padding:12px;">${j.location}</td>
        <td style="padding:12px;">${j.skills.slice(0, 5).join(', ') || 'N/A'}</td>
        <td style="padding:12px;"><strong>${j.matchScore}%</strong></td>
      </tr>`).join('');

    return `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
      <h2 style="color:#2563eb;">🚀 CareerPilot AI - Daily Application Report</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Great news! CareerPilot auto-applied to <strong>${jobs.length} jobs</strong> matching your profile today:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:12px;text-align:left;">Role</th>
            <th style="padding:12px;text-align:left;">Company</th>
            <th style="padding:12px;text-align:left;">LPA</th>
            <th style="padding:12px;text-align:left;">Location</th>
            <th style="padding:12px;text-align:left;">Tech Stack</th>
            <th style="padding:12px;text-align:left;">Match</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#64748b;font-size:13px;">— CareerPilot AI (100% Local, Zero Cost)</p>
    </div>`;
  }

  private async saveLocalReport(html: string) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const date = new Date().toISOString().split('T')[0];
    const reportPath = path.resolve(config.reportsDir, `applied-${date}.html`);
    await fs.mkdir(config.reportsDir, { recursive: true });
    await fs.writeFile(reportPath, html);
    logger.info(`[AutoPilot] Report saved: ${reportPath}`);
  }

  private async close() {
    if (this.browser) { await this.browser.close(); this.browser = null; }
  }
}

export const autoPilotService = new AutoPilotService();
