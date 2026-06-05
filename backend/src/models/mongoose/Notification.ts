import mongoose, { Schema, Document } from 'mongoose';
import { INotification } from '../../types';

export interface INotificationDocument extends Omit<INotification, '_id'>, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['job_match', 'report', 'reminder', 'system'], default: 'system' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
