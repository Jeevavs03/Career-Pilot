import { ollamaClient } from './ollama';
import { IUserProfile, IJob } from '../types';

export class QuestionAnswerer {
  async generateAnswers(job: IJob, profile: IUserProfile): Promise<{ question: string; answer: string }[]> {
    const questions = [
      { q: 'What is your expected salary?', ctx: `Target: ${profile.expectedSalary}` },
      { q: 'What is your current salary?', ctx: `Current: ${profile.currentSalary || 'Fresher/First Job'}` },
      { q: 'What is your notice period?', ctx: `Notice: ${profile.noticePeriod}` },
      { q: 'How many years of experience do you have?', ctx: `${profile.experience} year(s) in web development` },
      { q: 'Are you willing to relocate?', ctx: `Location preference: ${profile.location}` },
      { q: 'Do you have work authorization in India?', ctx: 'Indian citizen with full work authorization' },
      { q: 'Describe your relevant technical skills', ctx: `Frontend: ${profile.skills.frontend.join(', ')}. Backend: ${profile.skills.backend.join(', ')}` },
    ];

    const answers: { question: string; answer: string }[] = [];

    for (const { q, ctx } of questions) {
      const prompt = `Generate a professional, concise answer (2-3 sentences max) for this job application question:
Question: ${q}
Context: ${ctx}
Job: ${job.title} at ${job.company}
Output ONLY the answer.`;

      try {
        const answer = await ollamaClient.generate(prompt, 'Give brief professional answers for job applications.');
        answers.push({ question: q, answer: answer.trim() });
      } catch {
        answers.push({ question: q, answer: ctx });
      }
    }

    return answers;
  }

  async answerCustomQuestion(question: string, profile: IUserProfile, job: IJob): Promise<string> {
    const prompt = `Answer this job application question professionally and concisely:
Question: ${question}
Role: ${job.title} at ${job.company}
My experience: ${profile.experience} year(s)
My skills: ${[...profile.skills.frontend, ...profile.skills.backend].join(', ')}
Give a 2-3 sentence answer only.`;

    return ollamaClient.generate(prompt);
  }
}

export const questionAnswerer = new QuestionAnswerer();
