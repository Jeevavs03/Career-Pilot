import mongoose, { Schema, Document } from 'mongoose';
import { ISettings } from '../../types';

export interface ISettingsDocument extends Omit<ISettings, '_id'>, Document {}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    userId: { type: String, required: true, unique: true },
    hardwareMode: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    autoSearch: { type: Boolean, default: true },
    searchSchedule: {
      morning: { type: String, default: '0 8 * * *' },
      evening: { type: String, default: '0 20 * * *' },
    },
    filters: {
      minSalary: { type: Number, default: 7 },
      maxExperience: { type: Number, default: 3 },
      locations: [{ type: String, default: ['India'] }],
      excludeTitles: [{ type: String, default: ['Lead', 'Principal', 'Architect', 'Manager', 'Staff Engineer'] }],
      minMatchScore: { type: Number, default: 75 },
    },
    notifications: {
      email: { type: Boolean, default: false },
      dashboard: { type: Boolean, default: true },
    },
    platforms: {
      linkedin: {
        profileUrl: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
      },
      naukri: {
        profileUrl: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
      },
      indeed: {
        profileUrl: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
      },
      glassdoor: {
        profileUrl: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
      },
      instahyre: {
        profileUrl: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
      },
      foundit: {
        profileUrl: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
      },
      wellfound: {
        profileUrl: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
      },
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettingsDocument>('Settings', SettingsSchema);
