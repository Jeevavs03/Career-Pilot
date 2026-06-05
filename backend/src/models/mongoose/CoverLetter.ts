import mongoose, { Schema, Document } from 'mongoose';
import { ICoverLetter } from '../../types';

export interface ICoverLetterDocument extends Omit<ICoverLetter, '_id'>, Document {}

const CoverLetterSchema = new Schema<ICoverLetterDocument>(
  {
    userId: { type: String, required: true, index: true },
    jobId: { type: String, required: true },
    content: { type: String, required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    filePath: { type: String },
  },
  { timestamps: true }
);

export const CoverLetter = mongoose.model<ICoverLetterDocument>('CoverLetter', CoverLetterSchema);
