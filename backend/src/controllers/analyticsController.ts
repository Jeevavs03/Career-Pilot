import { Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { reportService } from '../services/reportService';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export class AnalyticsController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const stats = await analyticsService.getDashboardStats(req.userId!);
      sendSuccess(res, stats);
    } catch (e: any) { sendError(res, e); }
  }

  async getSalaryTrends(req: AuthRequest, res: Response) {
    try {
      const trends = await analyticsService.getSalaryTrends(req.userId!);
      sendSuccess(res, trends);
    } catch (e: any) { sendError(res, e); }
  }

  async getTechDemand(req: AuthRequest, res: Response) {
    try {
      const demand = await analyticsService.getTechDemand();
      sendSuccess(res, demand);
    } catch (e: any) { sendError(res, e); }
  }

  async generateReport(req: AuthRequest, res: Response) {
    try {
      const path = await reportService.generateDailyReport(req.userId!);
      sendSuccess(res, { path }, 'Report generated');
    } catch (e: any) { sendError(res, e); }
  }

  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const notifications = await reportService.getNotifications(req.userId!);
      sendSuccess(res, notifications);
    } catch (e: any) { sendError(res, e); }
  }

  async markNotificationRead(req: AuthRequest, res: Response) {
    try {
      await reportService.markRead(req.params.id);
      sendSuccess(res, null);
    } catch (e: any) { sendError(res, e); }
  }
}

export const analyticsController = new AnalyticsController();
