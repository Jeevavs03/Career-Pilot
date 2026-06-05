export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  profile: IUserProfile;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserProfile {
  experience: number;
  targetRoles: string[];
  skills: ISkills;
  targetSalary: string;
  location: string;
  locations: string[];
  noticePeriod: string;
  currentSalary: string;
  expectedSalary: string;
}

export interface ISkills {
  frontend: string[];
  backend: string[];
  database: string[];
  tools: string[];
  orm: string[];
}

export interface IJob {
  _id?: any;
  title: string;
  company: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
  experience: string;
  experienceMin?: number;
  experienceMax?: number;
  description: string;
  url: string;
  location: string;
  source: 'linkedin' | 'naukri' | 'company' | 'manual' | 'other';
  datePosted: Date;
  dateCollected: Date;
  status: 'new' | 'matched' | 'filtered' | 'applied' | 'rejected' | 'interview' | 'offer';
  matchScore?: number;
  matchDetails?: IMatchDetails;
  isActive: boolean;
}

export interface IMatchDetails {
  skillMatch: number;
  experienceMatch: number;
  technologyMatch: number;
  roleMatch: number;
  salaryMatch: number;
  overallScore: number;
}

export interface IApplication {
  _id?: string;
  userId: string;
  jobId: string;
  status: 'queued' | 'ready' | 'approved' | 'submitted' | 'rejected' | 'interview' | 'offer';
  resumeId?: string;
  coverletterId?: string;
  matchScore: number;
  answers: IApplicationAnswer[];
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IApplicationAnswer {
  question: string;
  answer: string;
}

export interface IResume {
  _id?: string;
  userId: string;
  name: string;
  type: 'master' | 'angular' | 'react' | 'mern' | 'fullstack' | 'custom';
  content: string;
  atsScore?: number;
  keywords: string[];
  filePath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICoverLetter {
  _id?: string;
  userId: string;
  jobId: string;
  content: string;
  company: string;
  role: string;
  filePath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAnalytics {
  _id?: string;
  userId: string;
  date: Date;
  jobsFound: number;
  jobsMatched: number;
  applicationsPrepared: number;
  interviewRequests: number;
  offers: number;
  topSkills: { skill: string; count: number }[];
  salaryTrends: { range: string; count: number }[];
}

export interface INotification {
  _id?: string;
  userId: string;
  type: 'job_match' | 'report' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt?: Date;
}

export interface ISettings {
  _id?: string;
  userId: string;
  hardwareMode: 'low' | 'medium' | 'high';
  autoSearch: boolean;
  searchSchedule: { morning: string; evening: string };
  filters: IFilterSettings;
  notifications: { email: boolean; dashboard: boolean };
  platforms: IPlatformAccounts;
}

export interface IPlatformCreds {
  profileUrl: string;
  email: string;
  password: string;
}

export interface IPlatformAccounts {
  linkedin: IPlatformCreds;
  naukri: IPlatformCreds;
  indeed: IPlatformCreds;
  glassdoor: IPlatformCreds;
  instahyre: IPlatformCreds;
  foundit: IPlatformCreds;
  wellfound: IPlatformCreds;
}

export interface IFilterSettings {
  minSalary: number;
  maxExperience: number;
  locations: string[];
  excludeTitles: string[];
  minMatchScore: number;
}
