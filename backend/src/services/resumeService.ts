import { Resume, User } from '../models/mongoose';
import { resumeOptimizer } from '../ai';
import { IUserProfile } from '../types';
import { AppError } from '../utils/response';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';
import path from 'path';

export class ResumeService {
  async createMasterResume(userId: string, content: string, name = 'Master Resume') {
    const keywords = await resumeOptimizer.extractKeywords(content);
    return Resume.create({ userId, name, type: 'master', content, keywords });
  }

  async generateVariants(userId: string) {
    const master = await Resume.findOne({ userId, type: 'master' });
    if (!master) throw new AppError(404, 'Master resume not found. Upload one first.');

    const user = await User.findById(userId);
    if (!user) throw new AppError(404, 'User not found');
    const profile = user.profile as unknown as IUserProfile;

    const variants: { type: string; content: string }[] = [];
    const types = ['angular', 'react', 'mern', 'fullstack'] as const;

    for (const type of types) {
      const roleName = type === 'mern' ? 'MERN Stack Developer' :
        type === 'fullstack' ? 'Full Stack Developer' :
        `${type.charAt(0).toUpperCase() + type.slice(1)} Developer`;

      const content = await resumeOptimizer.optimizeForRole(master.content, roleName, profile);
      const keywords = await resumeOptimizer.extractKeywords(content);

      await Resume.findOneAndUpdate(
        { userId, type },
        { userId, name: `${roleName} Resume`, type, content, keywords },
        { upsert: true, new: true }
      );
      variants.push({ type, content });
    }

    return variants;
  }

  async getResumes(userId: string) {
    return Resume.find({ userId }).sort({ type: 1 });
  }

  async getResumeById(id: string) {
    const resume = await Resume.findById(id);
    if (!resume) throw new AppError(404, 'Resume not found');
    return resume;
  }

  async updateResume(id: string, content: string) {
    const keywords = await resumeOptimizer.extractKeywords(content);
    return Resume.findByIdAndUpdate(id, { content, keywords }, { new: true });
  }

  async getATSScore(resumeId: string, jobDescription: string) {
    const resume = await Resume.findById(resumeId);
    if (!resume) throw new AppError(404, 'Resume not found');
    const result = await resumeOptimizer.calculateATSScore(resume.content, jobDescription);
    await Resume.findByIdAndUpdate(resumeId, { atsScore: result.score });
    return result;
  }

  async exportPDF(resumeId: string): Promise<string> {
    const resume = await Resume.findById(resumeId);
    if (!resume) throw new AppError(404, 'Resume not found');

    const dir = path.resolve(__dirname, '../../reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `resume_${resume.type}_${Date.now()}.pdf`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      doc.fontSize(11).text(resume.content, { align: 'left', lineGap: 4 });
      doc.end();
      stream.on('finish', () => {
        Resume.findByIdAndUpdate(resumeId, { filePath }).then(() => resolve(filePath));
      });
      stream.on('error', reject);
    });
  }

  async exportDOCX(resumeId: string): Promise<string> {
    const resume = await Resume.findById(resumeId);
    if (!resume) throw new AppError(404, 'Resume not found');

    const dir = path.resolve(__dirname, '../../reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `resume_${resume.type}_${Date.now()}.docx`);

    const paragraphs = resume.content.split('\n').map(line =>
      new Paragraph({ children: [new TextRun({ text: line, size: 22 })] })
    );

    const doc = new Document({ sections: [{ children: paragraphs }] });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    await Resume.findByIdAndUpdate(resumeId, { filePath });
    return filePath;
  }

  async deleteResume(id: string) {
    return Resume.findByIdAndDelete(id);
  }
}

export const resumeService = new ResumeService();
