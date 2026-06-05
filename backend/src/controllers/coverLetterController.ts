import { Response } from 'express';
import { coverLetterService } from '../services/coverLetterService';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export class CoverLetterController {
  async generate(req: AuthRequest, res: Response) {
    try {
      const { jobId } = req.body;
      const cl = await coverLetterService.generate(req.userId!, jobId);
      sendSuccess(res, cl, 'Cover letter generated', 201);
    } catch (e: any) { sendError(res, e); }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const cls = await coverLetterService.getCoverLetters(req.userId!);
      sendSuccess(res, cls);
    } catch (e: any) { sendError(res, e); }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const cl = await coverLetterService.getById(req.params.id);
      sendSuccess(res, cl);
    } catch (e: any) { sendError(res, e); }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const cl = await coverLetterService.update(req.params.id, req.body.content);
      sendSuccess(res, cl);
    } catch (e: any) { sendError(res, e); }
  }

  async exportPDF(req: AuthRequest, res: Response) {
    try {
      const filePath = await coverLetterService.exportPDF(req.params.id);
      res.download(filePath);
    } catch (e: any) { sendError(res, e); }
  }

  async exportDOCX(req: AuthRequest, res: Response) {
    try {
      const filePath = await coverLetterService.exportDOCX(req.params.id);
      res.download(filePath);
    } catch (e: any) { sendError(res, e); }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await coverLetterService.delete(req.params.id);
      sendSuccess(res, null, 'Cover letter deleted');
    } catch (e: any) { sendError(res, e); }
  }
}

export const coverLetterController = new CoverLetterController();
