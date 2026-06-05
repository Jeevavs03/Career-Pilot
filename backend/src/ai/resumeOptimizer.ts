import { ollamaClient } from './ollama';
import { IJob, IUserProfile } from '../types';
import { logger } from '../utils/logger';

export class ResumeOptimizer {
  async optimizeForRole(masterResume: string, targetRole: string, profile: IUserProfile): Promise<string> {
    const prompt = `Optimize this resume for a ${targetRole} position. 
The candidate has ${profile.experience} year(s) of experience.
Target skills to highlight based on role:
${this.getSkillsForRole(targetRole, profile)}

MASTER RESUME:
${masterResume}

INSTRUCTIONS:
- Keep it concise and ATS-friendly
- Use bullet points with action verbs
- Highlight relevant skills for ${targetRole}
- Quantify achievements where possible
- Keep format clean and professional
- Output the optimized resume content only`;

    return ollamaClient.generate(prompt, 'You are an expert resume writer specializing in tech resumes for the Indian job market.');
  }

  async optimizeForJob(masterResume: string, job: IJob, profile: IUserProfile): Promise<string> {
    const prompt = `Tailor this resume for this specific job:
Job: ${job.title} at ${job.company}
Required Skills: ${job.skills.join(', ')}
Description: ${job.description.substring(0, 500)}

MASTER RESUME:
${masterResume}

INSTRUCTIONS:
- Mirror keywords from the job description
- Highlight matching skills: ${job.skills.join(', ')}
- Emphasize relevant experience
- Keep ATS-friendly format
- Output only the optimized resume`;

    return ollamaClient.generate(prompt, 'You are an ATS optimization expert.');
  }

  async calculateATSScore(resume: string, jobDescription: string): Promise<{ score: number; suggestions: string[] }> {
    const prompt = `Analyze this resume against the job description for ATS compatibility.
Return a JSON object with: { "score": <number 0-100>, "suggestions": [<string improvements>] }

RESUME:
${resume.substring(0, 1500)}

JOB DESCRIPTION:
${jobDescription.substring(0, 1000)}

Return ONLY valid JSON.`;

    try {
      const response = await ollamaClient.generate(prompt, 'You are an ATS scoring system. Return only valid JSON.');
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      logger.warn('ATS score parse failed, using fallback');
    }
    return { score: 65, suggestions: ['Add more keywords from job description', 'Use standard section headings'] };
  }

  async extractKeywords(text: string): Promise<string[]> {
    const prompt = `Extract the top 20 technical keywords/skills from this text. Return as a JSON array of strings only.
TEXT: ${text.substring(0, 2000)}
Return ONLY a JSON array like ["keyword1", "keyword2"]`;

    try {
      const response = await ollamaClient.generate(prompt, 'Return only a JSON array of strings.');
      const match = response.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      logger.warn('Keyword extraction failed');
    }
    return [];
  }

  private getSkillsForRole(role: string, profile: IUserProfile): string {
    const r = role.toLowerCase();
    if (r.includes('angular')) return `Angular, TypeScript, ${profile.skills.frontend.join(', ')}`;
    if (r.includes('react')) return `React, JavaScript, TypeScript, ${profile.skills.frontend.join(', ')}`;
    if (r.includes('mern')) return `MongoDB, Express, React, Node.js, ${profile.skills.backend.join(', ')}`;
    if (r.includes('full stack') || r.includes('fullstack')) return `${profile.skills.frontend.join(', ')}, ${profile.skills.backend.join(', ')}`;
    if (r.includes('node') || r.includes('backend')) return `Node.js, Express, ${profile.skills.backend.join(', ')}, ${profile.skills.database.join(', ')}`;
    return [...profile.skills.frontend, ...profile.skills.backend].join(', ');
  }
}

export const resumeOptimizer = new ResumeOptimizer();
