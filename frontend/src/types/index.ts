export interface User {
  id: string;
  email: string;
  name: string;
  profile: UserProfile;
}

export interface UserProfile {
  experience: number;
  targetRoles: string[];
  skills: { frontend: string[]; backend: string[]; database: string[]; tools: string[]; orm: string[] };
  targetSalary: string;
  location: string;
  noticePeriod: string;
  currentSalary: string;
  expectedSalary: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  salary: string;
  skills: string[];
  experience: string;
  description: string;
  url: string;
  location: string;
  source: string;
  status: string;
  matchScore: number;
  matchDetails?: MatchDetails;
  datePosted: string;
  dateCollected: string;
}

export interface MatchDetails {
  skillMatch: number;
  experienceMatch: number;
  technologyMatch: number;
  roleMatch: number;
  salaryMatch: number;
  overallScore: number;
}

export interface Application {
  _id: string;
  jobId: string;
  status: string;
  matchScore: number;
  answers: { question: string; answer: string }[];
  notes: string;
  createdAt: string;
}

export interface Resume {
  _id: string;
  name: string;
  type: string;
  content: string;
  atsScore: number;
  keywords: string[];
  createdAt: string;
}

export interface CoverLetter {
  _id: string;
  jobId: string;
  content: string;
  company: string;
  role: string;
  createdAt: string;
}

export interface DashboardStats {
  totalJobs: number;
  angularJobs: number;
  reactJobs: number;
  mernJobs: number;
  nodeJobs: number;
  fullstackJobs: number;
  totalApplications: number;
  interviews: number;
  offers: number;
  offerRate: string;
  trend: any[];
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
