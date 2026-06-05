import { Response } from 'express';
import { settingsService } from '../services/settingsService';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export class SettingsController {
  async get(req: AuthRequest, res: Response) {
    try {
      const settings = await settingsService.get(req.userId!);
      sendSuccess(res, settings);
    } catch (e: any) { sendError(res, e); }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const settings = await settingsService.update(req.userId!, req.body);
      sendSuccess(res, settings);
    } catch (e: any) { sendError(res, e); }
  }
}

export const settingsController = new SettingsController();
