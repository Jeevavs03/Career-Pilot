import { CoverLetter, Job, User } from '../models/mongoose';
import { coverLetterGenerator } from '../ai';
import { IUserProfile } from '../types';
import { AppError } from '../utils/response';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';
import path from 'path';

export class CoverLetterService {
  async generate(userId: string, jobId: string) {
    const [job, user] = await Promise.all([Job.findById(jobId), User.findById(userId)]);
    if (!job) throw new AppError(404, 'Job not found');
    if (!user) throw new AppError(404, 'User not found');

    const profile = user.profile as unknown as IUserProfile;
    const content = await coverLetterGenerator.generate(job.toObject() as any, profile);

    return CoverLetter.create({ userId, jobId, content, company: job.company, role: job.title });
  }

  async getCoverLetters(userId: string) {
    return CoverLetter.find({ userId }).sort({ createdAt: -1 });
  }

  async getById(id: string) {
    const cl = await CoverLetter.findById(id);
    if (!cl) throw new AppError(404, 'Cover letter not found');
    return cl;
  }

  async update(id: string, content: string) {
    return CoverLetter.findByIdAndUpdate(id, { content }, { new: true });
  }

  async exportPDF(id: string): Promise<string> {
    const cl = await CoverLetter.findById(id);
    if (!cl) throw new AppError(404, 'Cover letter not found');

    const dir = path.resolve(__dirname, '../../reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `coverletter_${cl.company}_${Date.now()}.pdf`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      doc.fontSize(12).text(cl.content, { align: 'left', lineGap: 6 });
      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  async exportDOCX(id: string): Promise<string> {
    const cl = await CoverLetter.findById(id);
    if (!cl) throw new AppError(404, 'Cover letter not found');

    const dir = path.resolve(__dirname, '../../reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `coverletter_${cl.company}_${Date.now()}.docx`);

    const paragraphs = cl.content.split('\n').map(line =>
      new Paragraph({ children: [new TextRun({ text: line, size: 24 })] })
    );
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  async delete(id: string) {
    return CoverLetter.findByIdAndDelete(id);
  }
}

export const coverLetterService = new CoverLetterService();
