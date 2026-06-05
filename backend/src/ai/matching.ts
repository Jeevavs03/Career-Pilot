import { ollamaClient } from './ollama';
import { IJob, IUserProfile, IMatchDetails } from '../types';
import { logger } from '../utils/logger';

export class MatchingEngine {
  async calculateMatchScore(job: IJob, profile: IUserProfile): Promise<IMatchDetails> {
    const skillMatch = this.calculateSkillMatch(job, profile);
    const experienceMatch = this.calculateExperienceMatch(job.experienceMin || 0, job.experienceMax || 5, profile.experience);
    const roleMatch = this.calculateRoleMatch(job.title, profile.targetRoles);
    const salaryMatch = this.calculateSalaryMatch(job.salaryMin || 0, profile.targetSalary);
    const technologyMatch = this.calculateTechMatchLocal(job, profile);

    const overallScore = Math.round(
      skillMatch * 0.30 + experienceMatch * 0.15 + roleMatch * 0.25 + salaryMatch * 0.10 + technologyMatch * 0.20
    );

    return { skillMatch, experienceMatch, technologyMatch, roleMatch, salaryMatch, overallScore };
  }

  // Batch: score multiple jobs in one AI call (5 at a time)
  async batchMatchJobs(jobs: IJob[], profile: IUserProfile): Promise<Map<string, IMatchDetails>> {
    const results = new Map<string, IMatchDetails>();

    // Phase 1: Fast local scoring for all jobs
    const scored = jobs.map(job => ({
      job,
      localScore: this.quickScore(job, profile),
    }));

    // Phase 2: Only use AI for borderline jobs (score 60-85) where AI can make a difference
    const borderline = scored.filter(s => s.localScore >= 55 && s.localScore <= 85);
    const aiBoosts = await this.batchAIScore(borderline.map(s => s.job), profile);

    // Phase 3: Combine results
    for (const { job, localScore } of scored) {
      const id = (job._id || (job as any).id || '').toString();
      const aiBoost = aiBoosts.get(id) || 0;

      const skillMatch = this.calculateSkillMatch(job, profile);
      const experienceMatch = this.calculateExperienceMatch(job.experienceMin || 0, job.experienceMax || 5, profile.experience);
      const roleMatch = this.calculateRoleMatch(job.title, profile.targetRoles);
      const salaryMatch = this.calculateSalaryMatch(job.salaryMin || 0, profile.targetSalary);
      const technologyMatch = Math.min(100, this.calculateTechMatchLocal(job, profile) + aiBoost);

      const overallScore = Math.round(
        skillMatch * 0.30 + experienceMatch * 0.15 + roleMatch * 0.25 + salaryMatch * 0.10 + technologyMatch * 0.20
      );

      results.set(id, { skillMatch, experienceMatch, technologyMatch, roleMatch, salaryMatch, overallScore });
    }

    return results;
  }

  // Quick local score (no AI) for pre-filtering
  private quickScore(job: IJob, profile: IUserProfile): number {
    const skill = this.calculateSkillMatch(job, profile);
    const role = this.calculateRoleMatch(job.title, profile.targetRoles);
    const exp = this.calculateExperienceMatch(job.experienceMin || 0, job.experienceMax || 5, profile.experience);
    return Math.round(skill * 0.4 + role * 0.35 + exp * 0.25);
  }

  // Batch AI call: score 5 jobs at once
  private async batchAIScore(jobs: IJob[], profile: IUserProfile): Promise<Map<string, number>> {
    const boosts = new Map<string, number>();
    if (jobs.length === 0) return boosts;

    const BATCH_SIZE = 5;
    const userSkillsSummary = `Frontend: ${profile.skills.frontend.join(', ')}. Backend: ${profile.skills.backend.join(', ')}. DB: ${profile.skills.database.join(', ')}. Tools: ${profile.skills.tools.join(', ')}`;

    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);
      const jobList = batch.map((j, idx) => `${idx + 1}. "${j.title}" at ${j.company} [Skills: ${j.skills.slice(0, 8).join(', ') || 'not listed'}]`).join('\n');

      const prompt = `Rate technology relevance (0-20 bonus points) for each job below for this candidate.
Candidate: ${profile.experience}yr exp. ${userSkillsSummary}

Jobs:
${jobList}

Reply with ONLY numbers separated by commas. Example: 15,8,20,5,12`;

      try {
        const response = await ollamaClient.generate(prompt, 'Reply with only comma-separated numbers. No text.');
        const scores = response.match(/\d+/g)?.map(Number) || [];
        batch.forEach((job, idx) => {
          const id = (job._id || (job as any).id || '').toString();
          boosts.set(id, Math.min(20, scores[idx] || 0));
        });
      } catch (e) {
        logger.warn('[Matching] Batch AI failed, using local scores only');
      }
    }

    return boosts;
  }

  // Improved skill matching with fuzzy + synonym support
  private calculateSkillMatch(job: IJob, profile: IUserProfile): number {
    const allUserSkills = [
      ...profile.skills.frontend, ...profile.skills.backend,
      ...profile.skills.database, ...profile.skills.tools, ...profile.skills.orm,
    ].map(s => s.toLowerCase());

    const jobSkills = job.skills.map(s => s.toLowerCase());
    if (jobSkills.length === 0) {
      // No skills listed — infer from title/description
      return this.inferSkillMatch(job.title, job.description || '', allUserSkills);
    }

    let matched = 0;
    for (const skill of jobSkills) {
      if (allUserSkills.includes(skill)) { matched++; continue; }
      // Fuzzy: check partial matches and synonyms
      if (this.isSkillMatch(skill, allUserSkills)) matched += 0.7;
    }

    return Math.round(Math.min(100, (matched / jobSkills.length) * 100));
  }

  // Infer match from title/description when no skills listed
  private inferSkillMatch(title: string, description: string, userSkills: string[]): number {
    const text = `${title} ${description}`.toLowerCase();
    let hits = 0;
    for (const skill of userSkills) {
      if (text.includes(skill.toLowerCase())) hits++;
    }
    return Math.min(100, Math.round((hits / Math.max(3, userSkills.length * 0.3)) * 100));
  }

  // Synonym/fuzzy skill matching
  private isSkillMatch(jobSkill: string, userSkills: string[]): boolean {
    const synonyms: Record<string, string[]> = {
      'js': ['javascript'], 'javascript': ['js'],
      'ts': ['typescript'], 'typescript': ['ts'],
      'node': ['node.js', 'nodejs'], 'node.js': ['node', 'nodejs'], 'nodejs': ['node', 'node.js'],
      'react': ['react.js', 'reactjs'], 'react.js': ['react', 'reactjs'],
      'angular': ['angular.js', 'angularjs'],
      'express': ['express.js', 'expressjs'], 'express.js': ['express', 'expressjs'],
      'mongo': ['mongodb'], 'mongodb': ['mongo'],
      'postgres': ['postgresql'], 'postgresql': ['postgres'],
      'tailwind': ['tailwindcss'], 'tailwindcss': ['tailwind'],
      'next': ['next.js', 'nextjs'], 'next.js': ['next', 'nextjs'],
      'vue': ['vue.js', 'vuejs'], 'vue.js': ['vue', 'vuejs'],
      'css3': ['css'], 'css': ['css3'],
      'html5': ['html'], 'html': ['html5'],
      'rest': ['restful', 'rest api'], 'restful': ['rest', 'rest api'],
      'sql': ['mysql', 'postgresql', 'postgres'],
      'nosql': ['mongodb', 'mongo'],
      'frontend': ['front-end', 'front end'], 'front-end': ['frontend'],
      'backend': ['back-end', 'back end'], 'back-end': ['backend'],
      'fullstack': ['full-stack', 'full stack'], 'full-stack': ['fullstack', 'full stack'],
    };

    // Check synonyms
    const alts = synonyms[jobSkill] || [];
    for (const alt of alts) {
      if (userSkills.includes(alt)) return true;
    }

    // Partial match (e.g., "react" matches "react.js")
    return userSkills.some(s => s.includes(jobSkill) || jobSkill.includes(s));
  }

  // Better local tech match without AI
  private calculateTechMatchLocal(job: IJob, profile: IUserProfile): number {
    const title = job.title.toLowerCase();
    const desc = (job.description || '').toLowerCase();
    const text = `${title} ${desc} ${job.skills.join(' ').toLowerCase()}`;

    const userStack = [
      ...profile.skills.frontend, ...profile.skills.backend,
      ...profile.skills.database, ...profile.skills.tools,
    ].map(s => s.toLowerCase());

    let relevance = 0;
    let checked = 0;

    for (const skill of userStack) {
      checked++;
      if (text.includes(skill)) relevance++;
    }

    if (checked === 0) return 50;

    // Weight: if most of user's stack appears in job, high match
    const ratio = relevance / Math.min(checked, 8);
    return Math.round(Math.min(100, ratio * 100));
  }

  private calculateExperienceMatch(minExp: number, maxExp: number, userExp: number): number {
    if (userExp >= minExp && userExp <= maxExp) return 100;
    if (userExp < minExp) return Math.max(0, 100 - (minExp - userExp) * 25);
    return Math.max(0, 100 - (userExp - maxExp) * 15);
  }

  private calculateRoleMatch(jobTitle: string, targetRoles: string[]): number {
    const title = jobTitle.toLowerCase();

    // Exact role match
    for (const role of targetRoles) {
      if (title.includes(role.toLowerCase())) return 100;
    }

    // Word overlap match
    for (const role of targetRoles) {
      const words = role.toLowerCase().split(' ').filter(w => w.length > 2);
      const matchedWords = words.filter(w => title.includes(w));
      if (matchedWords.length >= words.length * 0.6) return 85;
      if (matchedWords.length >= words.length * 0.4) return 70;
    }

    // Generic tech role
    const techKeywords = ['developer', 'engineer', 'frontend', 'backend', 'fullstack', 'full stack', 'node', 'react', 'angular', 'mern', 'mean', 'software'];
    const matches = techKeywords.filter(k => title.includes(k));
    if (matches.length >= 2) return 65;
    if (matches.length === 1) return 50;

    return 15;
  }

  private calculateSalaryMatch(salaryMin: number, targetSalary: string): number {
    const target = parseFloat(targetSalary.replace(/[^0-9.]/g, '')) || 7;
    if (salaryMin === 0) return 70; // Unknown salary — neutral
    if (salaryMin >= target) return 100;
    if (salaryMin >= target * 0.85) return 85;
    if (salaryMin >= target * 0.7) return 70;
    return Math.max(20, Math.round((salaryMin / target) * 100));
  }
}

export const matchingEngine = new MatchingEngine();
