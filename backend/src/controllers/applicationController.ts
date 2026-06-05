import { Response } from 'express';
import { applicationService } from '../services/applicationService';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export class ApplicationController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { jobId } = req.body;
      const result = await applicationService.createApplicationPackage(req.userId!, jobId);
      sendSuccess(res, result, 'Application package created', 201);
    } catch (e: any) { sendError(res, e); }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await applicationService.getApplications(req.userId!, status as string, +page, +limit);
      sendSuccess(res, result);
    } catch (e: any) { sendError(res, e); }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const result = await applicationService.getApplicationById(req.params.id);
      sendSuccess(res, result);
    } catch (e: any) { sendError(res, e); }
  }

  async approve(req: AuthRequest, res: Response) {
    try {
      const app = await applicationService.approveApplication(req.params.id);
      sendSuccess(res, app, 'Application approved');
    } catch (e: any) { sendError(res, e); }
  }

  async reject(req: AuthRequest, res: Response) {
    try {
      const app = await applicationService.rejectApplication(req.params.id);
      sendSuccess(res, app, 'Application rejected');
    } catch (e: any) { sendError(res, e); }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.body;
      const app = await applicationService.updateStatus(req.params.id, status);
      sendSuccess(res, app);
    } catch (e: any) { sendError(res, e); }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await applicationService.getStats(req.userId!);
      sendSuccess(res, stats);
    } catch (e: any) { sendError(res, e); }
  }
}

export const applicationController = new ApplicationController();
