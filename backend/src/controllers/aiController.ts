import { Response } from 'express';
import { ollamaClient, questionAnswerer } from '../ai';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { settingsService } from '../services/settingsService';
import { Job, User } from '../models/mongoose';
import { IUserProfile } from '../types';

export class AIController {
  async status(req: AuthRequest, res: Response) {
    try {
      const available = await ollamaClient.isAvailable();
      const models = available ? await ollamaClient.listModels() : [];
      sendSuccess(res, { available, models });
    } catch (e: any) { sendError(res, e); }
  }

  async answerQuestion(req: AuthRequest, res: Response) {
    try {
      const { question, jobId } = req.body;
      const [user, job] = await Promise.all([User.findById(req.userId), Job.findById(jobId)]);
      if (!user || !job) return sendError(res, new Error('User or Job not found'), 404);

      const answer = await questionAnswerer.answerCustomQuestion(question, user.profile as unknown as IUserProfile, job.toObject() as any);
      sendSuccess(res, { question, answer });
    } catch (e: any) { sendError(res, e); }
  }

  async chat(req: AuthRequest, res: Response) {
    try {
      const { message } = req.body;
      const response = await ollamaClient.generate(message, 'You are CareerPilot AI, a career assistant for software developers in India.');
      sendSuccess(res, { response });
    } catch (e: any) { sendError(res, e); }
  }
}

export const aiController = new AIController();
