import mongoose, { Schema, Document } from 'mongoose';
import { IJob } from '../../types';

export interface IJobDocument extends Omit<IJob, '_id'>, Document {}

const JobSchema = new Schema<IJobDocument>(
  {
    title: { type: String, required: true, index: true },
    company: { type: String, required: true, index: true },
    salary: { type: String, default: '' },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    skills: [{ type: String }],
    experience: { type: String, default: '' },
    experienceMin: { type: Number, default: 0 },
    experienceMax: { type: Number, default: 0 },
    description: { type: String, default: '' },
    url: { type: String, required: true, unique: true },
    location: { type: String, default: 'India' },
    source: { type: String, enum: ['linkedin', 'naukri', 'company', 'manual', 'other'], default: 'other' },
    datePosted: { type: Date, default: Date.now },
    dateCollected: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['new', 'matched', 'filtered', 'applied', 'rejected', 'interview', 'offer'],
      default: 'new',
    },
    matchScore: { type: Number, default: 0 },
    matchDetails: {
      skillMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      technologyMatch: { type: Number, default: 0 },
      roleMatch: { type: Number, default: 0 },
      salaryMatch: { type: Number, default: 0 },
      overallScore: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

JobSchema.index({ title: 'text', company: 'text', description: 'text' });
JobSchema.index({ matchScore: -1 });
JobSchema.index({ status: 1, matchScore: -1 });

export const Job = mongoose.model<IJobDocument>('Job', JobSchema);
