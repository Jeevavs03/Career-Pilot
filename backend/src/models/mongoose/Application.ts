import mongoose, { Schema, Document } from 'mongoose';
import { IApplication } from '../../types';

export interface IApplicationDocument extends Omit<IApplication, '_id'>, Document {}

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    userId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['queued', 'ready', 'approved', 'submitted', 'rejected', 'interview', 'offer'],
      default: 'queued',
    },
    resumeId: { type: String },
    coverletterId: { type: String },
    matchScore: { type: Number, default: 0 },
    answers: [{ question: String, answer: String }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ApplicationSchema.index({ userId: 1, status: 1 });

export const Application = mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
