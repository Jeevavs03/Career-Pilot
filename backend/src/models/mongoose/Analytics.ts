import mongoose, { Schema, Document } from 'mongoose';
import { IAnalytics } from '../../types';

export interface IAnalyticsDocument extends Omit<IAnalytics, '_id'>, Document {}

const AnalyticsSchema = new Schema<IAnalyticsDocument>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    jobsFound: { type: Number, default: 0 },
    jobsMatched: { type: Number, default: 0 },
    applicationsPrepared: { type: Number, default: 0 },
    interviewRequests: { type: Number, default: 0 },
    offers: { type: Number, default: 0 },
    topSkills: [{ skill: String, count: Number }],
    salaryTrends: [{ range: String, count: Number }],
  },
  { timestamps: true }
);

AnalyticsSchema.index({ userId: 1, date: -1 });

export const Analytics = mongoose.model<IAnalyticsDocument>('Analytics', AnalyticsSchema);
