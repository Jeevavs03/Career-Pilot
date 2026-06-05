import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { autoPilotService } from '../services/autoPilotService';
import { sendSuccess, sendError } from '../utils/response';

export class AutoPilotController {
  async run(req: AuthRequest, res: Response) {
    try {
      const result = await autoPilotService.runFullPipeline(req.userId!);
      const msg = result.warnings.length > 0
        ? `Auto-pilot completed with warnings. ${result.searched} searched, ${result.matched} matched, ${result.applied} applied.`
        : `Auto-pilot complete: ${result.applied} jobs applied`;
      sendSuccess(res, result, msg);
    } catch (e: any) { sendError(res, e); }
  }
}

export const autoPilotController = new AutoPilotController();
