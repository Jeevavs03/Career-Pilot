import { ollamaClient } from './ollama';
import { IJob, IUserProfile } from '../types';

export class CoverLetterGenerator {
  async generate(job: IJob, profile: IUserProfile): Promise<string> {
    const prompt = `Write a cover letter for this job application:

Company: ${job.company}
Role: ${job.title}
Location: ${job.location}
Required Skills: ${job.skills.join(', ')}

Candidate Profile:
- Experience: ${profile.experience} year(s)
- Skills: ${[...profile.skills.frontend, ...profile.skills.backend, ...profile.skills.database].join(', ')}
- Location: ${profile.location}

INSTRUCTIONS:
- Length: 150-250 words exactly
- Tone: Professional but enthusiastic
- Mention specific company name and role
- Highlight 3-4 relevant skills
- Show eagerness to contribute
- Do NOT include address headers or date
- Start with "Dear Hiring Manager,"
- End with a call to action
- Output ONLY the cover letter text`;

    return ollamaClient.generate(prompt, 'You are an expert cover letter writer for tech professionals in India.');
  }

  async generateForTemplate(job: IJob, profile: IUserProfile, template: 'formal' | 'modern' | 'creative'): Promise<string> {
    const styleGuide = {
      formal: 'Use formal business language, structured paragraphs',
      modern: 'Use concise, impactful sentences with modern tone',
      creative: 'Show personality while remaining professional',
    };

    const prompt = `Write a ${template} cover letter (150-250 words):
Company: ${job.company} | Role: ${job.title}
Style: ${styleGuide[template]}
Skills to highlight: ${job.skills.slice(0, 5).join(', ')}
Experience: ${profile.experience} year(s) in web development
Output ONLY the cover letter.`;

    return ollamaClient.generate(prompt);
  }
}

export const coverLetterGenerator = new CoverLetterGenerator();
