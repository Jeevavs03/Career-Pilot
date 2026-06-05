import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../../types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true, trim: true },
    profile: {
      experience: { type: Number, default: 1 },
      targetRoles: [{ type: String }],
      skills: {
        frontend: [String],
        backend: [String],
        database: [String],
        tools: [String],
        orm: [String],
      },
      targetSalary: { type: String, default: '7 LPA+' },
      location: { type: String, default: 'India' },
      locations: [{ type: String, default: ['India'] }],
      noticePeriod: { type: String, default: 'Immediate' },
      currentSalary: { type: String, default: '' },
      expectedSalary: { type: String, default: '7 LPA' },
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
