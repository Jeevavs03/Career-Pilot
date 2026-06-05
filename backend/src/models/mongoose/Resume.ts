import mongoose, { Schema, Document } from 'mongoose';
import { IResume } from '../../types';

export interface IResumeDocument extends Omit<IResume, '_id'>, Document {}

const ResumeSchema = new Schema<IResumeDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['master', 'angular', 'react', 'mern', 'fullstack', 'custom'],
      default: 'master',
    },
    content: { type: String, required: true },
    atsScore: { type: Number, default: 0 },
    keywords: [{ type: String }],
    filePath: { type: String },
  },
  { timestamps: true }
);

export const Resume = mongoose.model<IResumeDocument>('Resume', ResumeSchema);
