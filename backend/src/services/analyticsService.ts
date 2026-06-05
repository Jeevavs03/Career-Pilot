import { Analytics, Job, Application } from '../models/mongoose';
import { startOfDay, subDays, format } from 'date-fns';

export class AnalyticsService {
  async getDashboardStats(userId: string) {
    const today = startOfDay(new Date());
    const [jobStats, appStats, recentAnalytics] = await Promise.all([
      this.getJobStats(),
      this.getApplicationStats(userId),
      Analytics.find({ userId, date: { $gte: subDays(today, 30) } }).sort({ date: -1 }),
    ]);
    return { ...jobStats, ...appStats, trend: recentAnalytics };
  }

  private async getJobStats() {
    const [total, angular, react, mern, node, fullstack] = await Promise.all([
      Job.countDocuments({ isActive: true }),
      Job.countDocuments({ isActive: true, title: { $regex: /angular/i } }),
      Job.countDocuments({ isActive: true, title: { $regex: /react/i } }),
      Job.countDocuments({ isActive: true, title: { $regex: /mern/i } }),
      Job.countDocuments({ isActive: true, title: { $regex: /node/i } }),
      Job.countDocuments({ isActive: true, title: { $regex: /full.?stack/i } }),
    ]);
    return { totalJobs: total, angularJobs: angular, reactJobs: react, mernJobs: mern, nodeJobs: node, fullstackJobs: fullstack };
  }

  private async getApplicationStats(userId: string) {
    const [total, interviews, offers] = await Promise.all([
      Application.countDocuments({ userId }),
      Application.countDocuments({ userId, status: 'interview' }),
      Application.countDocuments({ userId, status: 'offer' }),
    ]);
    return { totalApplications: total, interviews, offers, offerRate: total > 0 ? ((offers / total) * 100).toFixed(1) : '0' };
  }

  async recordDaily(userId: string) {
    const today = startOfDay(new Date());
    const jobsFound = await Job.countDocuments({ dateCollected: { $gte: today } });
    const jobsMatched = await Job.countDocuments({ status: 'matched', dateCollected: { $gte: today } });
    const applicationsPrepared = await Application.countDocuments({ userId, createdAt: { $gte: today } });

    // Get top skills from today's jobs
    const todayJobs = await Job.find({ dateCollected: { $gte: today } });
    const skillCount: Record<string, number> = {};
    todayJobs.forEach(j => j.skills.forEach(s => { skillCount[s] = (skillCount[s] || 0) + 1; }));
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    return Analytics.findOneAndUpdate(
      { userId, date: today },
      { userId, date: today, jobsFound, jobsMatched, applicationsPrepared, topSkills },
      { upsert: true, new: true }
    );
  }

  async getSalaryTrends(userId: string) {
    const jobs = await Job.find({ isActive: true, salaryMin: { $gt: 0 } });
    const ranges: Record<string, number> = { '3-5 LPA': 0, '5-7 LPA': 0, '7-10 LPA': 0, '10-15 LPA': 0, '15+ LPA': 0 };
    jobs.forEach(j => {
      const s = j.salaryMin || 0;
      if (s < 5) ranges['3-5 LPA']++;
      else if (s < 7) ranges['5-7 LPA']++;
      else if (s < 10) ranges['7-10 LPA']++;
      else if (s < 15) ranges['10-15 LPA']++;
      else ranges['15+ LPA']++;
    });
    return Object.entries(ranges).map(([range, count]) => ({ range, count }));
  }

  async getTechDemand() {
    const jobs = await Job.find({ isActive: true });
    const techCount: Record<string, number> = {};
    jobs.forEach(j => j.skills.forEach(s => { techCount[s.toLowerCase()] = (techCount[s.toLowerCase()] || 0) + 1; }));
    return Object.entries(techCount).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tech, count]) => ({ tech, count }));
  }
}

export const analyticsService = new AnalyticsService();
