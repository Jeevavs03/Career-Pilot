import { Response } from 'express';
import { resumeService } from '../services/resumeService';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export class ResumeController {
  async upload(req: AuthRequest, res: Response) {
    try {
      const { content, name } = req.body;
      const resume = await resumeService.createMasterResume(req.userId!, content, name);
      sendSuccess(res, resume, 'Master resume uploaded', 201);
    } catch (e: any) { sendError(res, e); }
  }

  async generateVariants(req: AuthRequest, res: Response) {
    try {
      const variants = await resumeService.generateVariants(req.userId!);
      sendSuccess(res, variants, 'Resume variants generated');
    } catch (e: any) { sendError(res, e); }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const resumes = await resumeService.getResumes(req.userId!);
      sendSuccess(res, resumes);
    } catch (e: any) { sendError(res, e); }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const resume = await resumeService.getResumeById(req.params.id);
      sendSuccess(res, resume);
    } catch (e: any) { sendError(res, e); }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const resume = await resumeService.updateResume(req.params.id, req.body.content);
      sendSuccess(res, resume);
    } catch (e: any) { sendError(res, e); }
  }

  async getATSScore(req: AuthRequest, res: Response) {
    try {
      const { jobDescription } = req.body;
      const result = await resumeService.getATSScore(req.params.id, jobDescription);
      sendSuccess(res, result);
    } catch (e: any) { sendError(res, e); }
  }

  async exportPDF(req: AuthRequest, res: Response) {
    try {
      const filePath = await resumeService.exportPDF(req.params.id);
      res.download(filePath);
    } catch (e: any) { sendError(res, e); }
  }

  async exportDOCX(req: AuthRequest, res: Response) {
    try {
      const filePath = await resumeService.exportDOCX(req.params.id);
      res.download(filePath);
    } catch (e: any) { sendError(res, e); }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await resumeService.deleteResume(req.params.id);
      sendSuccess(res, null, 'Resume deleted');
    } catch (e: any) { sendError(res, e); }
  }
}

export const resumeController = new ResumeController();
