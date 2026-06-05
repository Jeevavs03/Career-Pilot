import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (e: any) { sendError(res, e); }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      sendSuccess(res, result, 'Login successful');
    } catch (e: any) { sendError(res, e); }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens);
    } catch (e: any) { sendError(res, e); }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await authService.getProfile(req.userId!);
      sendSuccess(res, user);
    } catch (e: any) { sendError(res, e); }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const user = await authService.updateProfile(req.userId!, req.body);
      sendSuccess(res, user);
    } catch (e: any) { sendError(res, e); }
  }
}

export const authController = new AuthController();
