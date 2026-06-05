import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authController } from '../controllers/authController';
import { jobController } from '../controllers/jobController';
import { applicationController } from '../controllers/applicationController';
import { resumeController } from '../controllers/resumeController';
import { coverLetterController } from '../controllers/coverLetterController';
import { analyticsController } from '../controllers/analyticsController';
import { aiController } from '../controllers/aiController';
import { settingsController } from '../controllers/settingsController';
import { autoPilotController } from '../controllers/autoPilotController';

const router = Router();

// Auth
router.post('/auth/register', (req, res) => authController.register(req, res));
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/refresh', (req, res) => authController.refresh(req, res));
router.get('/auth/profile', authenticate, (req, res) => authController.getProfile(req, res));
router.put('/auth/profile', authenticate, (req, res) => authController.updateProfile(req, res));

// Jobs
router.get('/jobs', authenticate, (req, res) => jobController.getJobs(req, res));
router.get('/jobs/matched', authenticate, (req, res) => jobController.getMatchedJobs(req, res));
router.get('/jobs/stats', authenticate, (req, res) => jobController.getStats(req, res));
router.get('/jobs/search', authenticate, (req, res) => jobController.searchJobs(req, res));
router.get('/jobs/:id', authenticate, (req, res) => jobController.getJobById(req, res));
router.post('/jobs', authenticate, (req, res) => jobController.addJob(req, res));
router.post('/jobs/scrape', authenticate, (req, res) => jobController.addJobFromUrl(req, res));
router.post('/jobs/bulk-scrape', authenticate, (req, res) => jobController.bulkScrape(req, res));
router.delete('/jobs/:id', authenticate, (req, res) => jobController.deleteJob(req, res));

// Applications
router.get('/applications', authenticate, (req, res) => applicationController.getAll(req, res));
router.get('/applications/stats', authenticate, (req, res) => applicationController.getStats(req, res));
router.get('/applications/:id', authenticate, (req, res) => applicationController.getById(req, res));
router.post('/applications', authenticate, (req, res) => applicationController.create(req, res));
router.patch('/applications/:id/approve', authenticate, (req, res) => applicationController.approve(req, res));
router.patch('/applications/:id/reject', authenticate, (req, res) => applicationController.reject(req, res));
router.patch('/applications/:id/status', authenticate, (req, res) => applicationController.updateStatus(req, res));

// Resumes
router.get('/resumes', authenticate, (req, res) => resumeController.getAll(req, res));
router.get('/resumes/:id', authenticate, (req, res) => resumeController.getById(req, res));
router.post('/resumes', authenticate, (req, res) => resumeController.upload(req, res));
router.post('/resumes/generate-variants', authenticate, (req, res) => resumeController.generateVariants(req, res));
router.put('/resumes/:id', authenticate, (req, res) => resumeController.update(req, res));
router.post('/resumes/:id/ats-score', authenticate, (req, res) => resumeController.getATSScore(req, res));
router.get('/resumes/:id/export/pdf', authenticate, (req, res) => resumeController.exportPDF(req, res));
router.get('/resumes/:id/export/docx', authenticate, (req, res) => resumeController.exportDOCX(req, res));
router.delete('/resumes/:id', authenticate, (req, res) => resumeController.delete(req, res));

// Cover Letters
router.get('/cover-letters', authenticate, (req, res) => coverLetterController.getAll(req, res));
router.get('/cover-letters/:id', authenticate, (req, res) => coverLetterController.getById(req, res));
router.post('/cover-letters', authenticate, (req, res) => coverLetterController.generate(req, res));
router.put('/cover-letters/:id', authenticate, (req, res) => coverLetterController.update(req, res));
router.get('/cover-letters/:id/export/pdf', authenticate, (req, res) => coverLetterController.exportPDF(req, res));
router.get('/cover-letters/:id/export/docx', authenticate, (req, res) => coverLetterController.exportDOCX(req, res));
router.delete('/cover-letters/:id', authenticate, (req, res) => coverLetterController.delete(req, res));

// Analytics
router.get('/analytics/dashboard', authenticate, (req, res) => analyticsController.getDashboard(req, res));
router.get('/analytics/salary-trends', authenticate, (req, res) => analyticsController.getSalaryTrends(req, res));
router.get('/analytics/tech-demand', authenticate, (req, res) => analyticsController.getTechDemand(req, res));
router.post('/analytics/report', authenticate, (req, res) => analyticsController.generateReport(req, res));
router.get('/notifications', authenticate, (req, res) => analyticsController.getNotifications(req, res));
router.patch('/notifications/:id/read', authenticate, (req, res) => analyticsController.markNotificationRead(req, res));

// AI
router.get('/ai/status', authenticate, (req, res) => aiController.status(req, res));
router.post('/ai/answer', authenticate, (req, res) => aiController.answerQuestion(req, res));
router.post('/ai/chat', authenticate, (req, res) => aiController.chat(req, res));

// Auto-Pilot
router.post('/autopilot/run', authenticate, (req, res) => autoPilotController.run(req, res));

// Settings
router.get('/settings', authenticate, (req, res) => settingsController.get(req, res));
router.put('/settings', authenticate, (req, res) => settingsController.update(req, res));

export default router;
