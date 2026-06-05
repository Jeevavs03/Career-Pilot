import { Notification } from '../models/mongoose';
import { analyticsService } from './analyticsService';
import { jobService } from './jobService';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import config from '../config';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class ReportService {
  async generateDailyReport(userId: string): Promise<string> {
    const stats = await analyticsService.getDashboardStats(userId);
    const jobStats = await jobService.getJobStats();
    const salaryTrends = await analyticsService.getSalaryTrends(userId);

    const reportDir = config.reportsDir;
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    // Generate HTML report
    const htmlPath = path.join(reportDir, `report_${Date.now()}.html`);
    const html = this.buildHTMLReport(stats, jobStats, salaryTrends);
    fs.writeFileSync(htmlPath, html);

    // Create notification
    await Notification.create({
      userId,
      type: 'report',
      title: 'Daily Report Generated',
      message: `Found ${jobStats.total} jobs, ${jobStats.matched} matched. Report saved.`,
    });

    // Try to send email if configured
    if (config.email.host && config.email.user) {
      await this.sendEmailReport(html);
    }

    return htmlPath;
  }

  private buildHTMLReport(stats: any, jobStats: any, salaryTrends: any[]): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>CareerPilot Daily Report</title>
<style>
body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px;background:#f5f5f5}
.card{background:white;border-radius:8px;padding:20px;margin:16px 0;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
h1{color:#1e40af}h2{color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:8px}
.stat{display:inline-block;margin:10px 20px 10px 0;text-align:center}
.stat-value{font-size:2em;font-weight:bold;color:#1e40af}
.stat-label{color:#6b7280;font-size:0.9em}
table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left}
</style></head><body>
<h1>🚀 CareerPilot AI - Daily Report</h1>
<p>Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
<div class="card"><h2>📊 Overview</h2>
<div class="stat"><div class="stat-value">${jobStats.total}</div><div class="stat-label">Total Jobs</div></div>
<div class="stat"><div class="stat-value">${jobStats.matched}</div><div class="stat-label">Matched</div></div>
<div class="stat"><div class="stat-value">${stats.totalApplications || 0}</div><div class="stat-label">Applications</div></div>
<div class="stat"><div class="stat-value">${stats.interviews || 0}</div><div class="stat-label">Interviews</div></div>
<div class="stat"><div class="stat-value">${stats.offers || 0}</div><div class="stat-label">Offers</div></div>
</div>
<div class="card"><h2>💰 Salary Trends</h2><table><tr><th>Range</th><th>Jobs</th></tr>
${salaryTrends.map(s => `<tr><td>${s.range}</td><td>${s.count}</td></tr>`).join('')}
</table></div>
<div class="card"><h2>🎯 Technology Demand</h2>
<p>Angular: ${stats.angularJobs || 0} | React: ${stats.reactJobs || 0} | MERN: ${stats.mernJobs || 0} | Node: ${stats.nodeJobs || 0} | Full Stack: ${stats.fullstackJobs || 0}</p>
</div></body></html>`;
  }

  private async sendEmailReport(html: string) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        auth: { user: config.email.user, pass: config.email.pass },
      });
      await transporter.sendMail({
        from: config.email.from,
        to: config.email.user,
        subject: `CareerPilot Daily Report - ${new Date().toLocaleDateString()}`,
        html,
      });
      logger.info('Email report sent');
    } catch (e) {
      logger.warn('Email send failed (using local report instead):', e);
    }
  }

  async getNotifications(userId: string, limit = 20) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  async markRead(notificationId: string) {
    return Notification.findByIdAndUpdate(notificationId, { read: true });
  }

  async markAllRead(userId: string) {
    return Notification.updateMany({ userId, read: false }, { read: true });
  }
}

export const reportService = new ReportService();
