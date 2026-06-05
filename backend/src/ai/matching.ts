import { ollamaClient } from './ollama';
import { IJob, IUserProfile, IMatchDetails } from '../types';
import { logger } from '../utils/logger';

export class MatchingEngine {
  async calculateMatchScore(job: IJob, profile: IUserProfile): Promise<IMatchDetails> {
    const skillMatch = this.calculateSkillMatch(job.skills, profile.skills);
    const experienceMatch = this.calculateExperienceMatch(job.experienceMin || 0, job.experienceMax || 5, profile.experience);
    const roleMatch = this.calculateRoleMatch(job.title, profile.targetRoles);
    const salaryMatch = this.calculateSalaryMatch(job.salaryMin || 0, profile.targetSalary);
    const technologyMatch = await this.calculateTechnologyMatch(job, profile);

    const overallScore = Math.round(
      skillMatch * 0.3 + experienceMatch * 0.2 + roleMatch * 0.25 + salaryMatch * 0.1 + technologyMatch * 0.15
    );

    return { skillMatch, experienceMatch, technologyMatch, roleMatch, salaryMatch, overallScore };
  }

  private calculateSkillMatch(jobSkills: string[], userSkills: { frontend: string[]; backend: string[]; database: string[]; tools: string[]; orm: string[] }): number {
    const allUserSkills = [
      ...userSkills.frontend, ...userSkills.backend, ...userSkills.database,
      ...userSkills.tools, ...userSkills.orm,
    ].map(s => s.toLowerCase());

    if (jobSkills.length === 0) return 50;

    const matched = jobSkills.filter(s => allUserSkills.includes(s.toLowerCase())).length;
    return Math.round((matched / jobSkills.length) * 100);
  }

  private calculateExperienceMatch(minExp: number, maxExp: number, userExp: number): number {
    if (userExp >= minExp && userExp <= maxExp) return 100;
    if (userExp < minExp) return Math.max(0, 100 - (minExp - userExp) * 30);
    return Math.max(0, 100 - (userExp - maxExp) * 20);
  }

  private calculateRoleMatch(jobTitle: string, targetRoles: string[]): number {
    const title = jobTitle.toLowerCase();
    for (const role of targetRoles) {
      if (title.includes(role.toLowerCase())) return 100;
      const words = role.toLowerCase().split(' ');
      const matchedWords = words.filter(w => title.includes(w));
      if (matchedWords.length >= words.length * 0.5) return 80;
    }
    const techKeywords = ['developer', 'engineer', 'frontend', 'backend', 'fullstack', 'full stack', 'node', 'react', 'angular'];
    if (techKeywords.some(k => title.includes(k))) return 60;
    return 20;
  }

  private calculateSalaryMatch(salaryMin: number, targetSalary: string): number {
    const target = parseFloat(targetSalary.replace(/[^0-9.]/g, '')) || 7;
    if (salaryMin === 0) return 70; // Unknown salary
    if (salaryMin >= target) return 100;
    if (salaryMin >= target * 0.8) return 80;
    return Math.max(0, (salaryMin / target) * 100);
  }

  private async calculateTechnologyMatch(job: IJob, profile: IUserProfile): Promise<number> {
    try {
      const prompt = `Rate technology match from 0-100 between this job and candidate. Reply with ONLY a number.
Job: ${job.title} at ${job.company}. Skills: ${job.skills.join(', ')}
Candidate skills: Frontend: ${profile.skills.frontend.join(', ')}. Backend: ${profile.skills.backend.join(', ')}. DB: ${profile.skills.database.join(', ')}`;

      const response = await ollamaClient.generate(prompt, 'Reply with only a number between 0 and 100. No explanation.');
      const score = parseInt(response.trim().match(/\d+/)?.[0] || '50');
      return Math.min(100, Math.max(0, score));
    } catch {
      // Fallback to basic calculation
      return this.calculateSkillMatch(job.skills, profile.skills);
    }
  }
}

export const matchingEngine = new MatchingEngine();
