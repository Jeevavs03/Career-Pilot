import { IJob, IUserProfile } from '../types';
import { logger } from '../utils/logger';
import config from '../config';

interface StrictAudit {
  required_experience_years: string;
  matched_skills: string[];
  missing_skills: string[];
}

interface Verdicts {
  experience_fits_max_limit: boolean;
  skills_threshold_passed: boolean;
  location_is_allowed: boolean;
}

export interface ScreeningResult {
  strict_audit: StrictAudit;
  verdicts: Verdicts;
  is_match: boolean;
  reasoning: string;
  match_score: number;
}

export class JobScreener {

  // ═══════════════════════════════════════════════
  // STAGE 1: Instant Regex/Local Rejection (0ms)
  // ═══════════════════════════════════════════════
  private quickReject(job: IJob, profile: IUserProfile, maxExp: number): ScreeningResult | null {
    const title = (job.title || '').toLowerCase();
    const expText = job.experience || '';

    // 1. Senior/Lead titles → instant reject
    if (/\b(senior|sr\.?|lead|principal|architect|staff|manager|director|head|vp|distinguished)\b/i.test(title)) {
      return this.reject(`Title "${job.title}" is a senior-level role. User max experience is ${maxExp} years.`);
    }

    // 2. Irrelevant tech stack in title
    const userSkills = [
      ...profile.skills.frontend, ...profile.skills.backend,
      ...profile.skills.database, ...profile.skills.tools, ...profile.skills.orm,
    ].map(s => s.toLowerCase());

    const irrelevantTech = ['java', '.net', 'dotnet', 'c#', 'python', 'ruby', 'php', 'golang', 'go lang',
      'rust', 'scala', 'kotlin', 'swift', 'flutter', 'android', 'ios', 'salesforce', 'sap',
      'mainframe', 'cobol', 'data scientist', 'machine learning', 'devops', 'cloud engineer'];

    for (const tech of irrelevantTech) {
      if (title.includes(tech) && !userSkills.some(s => s.includes(tech) || tech.includes(s))) {
        return this.reject(`Title "${job.title}" requires "${tech}" which is absent from user's skill set.`);
      }
    }

    // 3. Experience number clearly too high
    const expMatch = expText.match(/(\d+)\s*[-–+]/);
    if (expMatch && parseInt(expMatch[1]) > maxExp) {
      return this.reject(`Job requires ${expMatch[1]}+ years experience. User max is ${maxExp} years.`);
    }

    // Also check description for experience
    const descExpMatch = (job.description || '').match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
    if (descExpMatch && parseInt(descExpMatch[1]) > maxExp) {
      return this.reject(`Description requires ${descExpMatch[1]}+ years. User max is ${maxExp} years.`);
    }

    return null; // Not obviously bad → needs Llama3 deep analysis
  }

  // ═══════════════════════════════════════════════
  // STAGE 2: Llama3 Deep Analysis (structured JSON)
  // ═══════════════════════════════════════════════
  private async deepScreenWithLlama3(job: IJob, profile: IUserProfile, maxExp: number, minSalary: number, locations: string[]): Promise<ScreeningResult> {
    const allSkills = [
      ...profile.skills.frontend, ...profile.skills.backend,
      ...profile.skills.database, ...profile.skills.tools, ...profile.skills.orm,
    ];

    const cleanedDesc = this.cleanText(`${job.description || ''} Skills: ${job.skills.join(', ')}. Experience: ${job.experience || 'Not specified'}. Salary: ${job.salary || 'Not listed'}`);

    const systemPrompt = `You are a strict automated ATS filter. Evaluate the job deeply. Output ONLY a valid JSON object with keys: "strict_audit" (with required_experience_years, matched_skills, missing_skills), "verdicts" (with experience_fits_max_limit, skills_threshold_passed, location_is_allowed), "is_match" (true/false), and "reasoning" (1 sentence).

RULES:
- experience_fits_max_limit: false if job needs MORE years than user's max limit
- skills_threshold_passed: false if fewer than 2 of user's Must-Have Skills are explicitly required
- location_is_allowed: false only if job is on-site in a city user didn't list
- is_match: true ONLY if ALL verdicts are true. One false = is_match must be false.`;

    const userPrompt = `### USER SETTINGS
- Allowed Roles: ${JSON.stringify(profile.targetRoles)}
- Must-Have Skills: ${JSON.stringify(allSkills)}
- Max Experience Allowed: ${maxExp} years
- Expected Min Salary: ${minSalary} LPA
- Location Preference: ${locations.join(', ')}

### SCRAPED JOB
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location || 'Not specified'}
- Description: ${cleanedDesc.substring(0, 600)}

Perform a deep check. If the text requires more experience than max allowed, fail it. If it misses multiple must-have skills, fail it.`;

    try {
      const response = await fetch(`${config.ollama.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollama.model, // llama3
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          format: 'json', // Forces Ollama to return clean JSON
        }),
      });

      const data = await response.json() as any;
      const content = data?.message?.content || '';
      const parsed = JSON.parse(content);

      // Enforce: is_match can only be true if ALL verdicts pass
      const verdicts = parsed.verdicts || {};
      const allPass = verdicts.experience_fits_max_limit !== false &&
                      verdicts.skills_threshold_passed !== false &&
                      verdicts.location_is_allowed !== false;

      const isMatch = allPass && parsed.is_match === true;

      // Calculate score
      let score = 0;
      if (verdicts.experience_fits_max_limit) score += 30;
      if (verdicts.skills_threshold_passed) score += 40;
      if (verdicts.location_is_allowed) score += 15;
      if (isMatch) score += 15;

      return {
        strict_audit: parsed.strict_audit || { required_experience_years: 'unknown', matched_skills: [], missing_skills: [] },
        verdicts: { experience_fits_max_limit: !!verdicts.experience_fits_max_limit, skills_threshold_passed: !!verdicts.skills_threshold_passed, location_is_allowed: !!verdicts.location_is_allowed },
        is_match: isMatch,
        match_score: score,
        reasoning: parsed.reasoning || '',
      };
    } catch (e: any) {
      logger.warn(`[Screener] Llama3 failed for "${job.title}": ${e.message}`);
      return this.localFallback(job, profile, maxExp);
    }
  }

  // ═══════════════════════════════════════════════
  // PUBLIC: Screen a batch of jobs through the pipeline
  // ═══════════════════════════════════════════════
  async batchScreen(jobs: IJob[], profile: IUserProfile, settings: any): Promise<Map<string, ScreeningResult>> {
    const results = new Map<string, ScreeningResult>();
    const maxExp = settings?.filters?.maxExperience || profile.experience + 1;
    const minSalary = settings?.filters?.minSalary || 7;
    const locations = profile.locations?.length ? profile.locations : [profile.location || 'India'];

    let rejected = 0, aiScreened = 0;

    for (const job of jobs) {
      const id = (job._id || (job as any).id || '').toString();

      // STAGE 1: Instant regex rejection
      const quickResult = this.quickReject(job, profile, maxExp);
      if (quickResult) {
        results.set(id, quickResult);
        rejected++;
        continue;
      }

      // STAGE 2: Llama3 deep analysis
      const deepResult = await this.deepScreenWithLlama3(job, profile, maxExp, minSalary, locations);
      results.set(id, deepResult);
      aiScreened++;
    }

    logger.info(`[Screener] ${jobs.length} jobs → ${rejected} instant-rejected, ${aiScreened} AI-screened, ${results.size - rejected - aiScreened} fallback`);
    return results;
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  private cleanText(text: string): string {
    return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  private reject(reasoning: string): ScreeningResult {
    return {
      strict_audit: { required_experience_years: '', matched_skills: [], missing_skills: [] },
      verdicts: { experience_fits_max_limit: false, skills_threshold_passed: false, location_is_allowed: true },
      is_match: false,
      match_score: 0,
      reasoning,
    };
  }

  private localFallback(job: IJob, profile: IUserProfile, maxExp: number): ScreeningResult {
    const userSkills = [
      ...profile.skills.frontend, ...profile.skills.backend,
      ...profile.skills.database, ...profile.skills.tools, ...profile.skills.orm,
    ].map(s => s.toLowerCase());

    const jobText = `${job.title} ${job.skills.join(' ')} ${job.description || ''}`.toLowerCase();
    const matched = userSkills.filter(s => jobText.includes(s));
    const missing = userSkills.filter(s => !jobText.includes(s));

    const expOk = !job.experience || !job.experience.match(/(\d+)/) || parseInt(job.experience.match(/(\d+)/)![1]) <= maxExp;
    const skillsOk = matched.length >= 2;
    const isMatch = expOk && skillsOk;

    return {
      strict_audit: { required_experience_years: job.experience || 'not specified', matched_skills: matched, missing_skills: missing.slice(0, 5) },
      verdicts: { experience_fits_max_limit: expOk, skills_threshold_passed: skillsOk, location_is_allowed: true },
      is_match: isMatch,
      match_score: isMatch ? 60 + matched.length * 5 : 20,
      reasoning: isMatch ? `${matched.length} skills matched, experience within limit.` : `Failed: ${!expOk ? 'experience too high' : `only ${matched.length} skills matched`}.`,
    };
  }
}

export const jobScreener = new JobScreener();
