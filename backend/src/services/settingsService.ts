import { Settings } from '../models/mongoose';
import { ISettings } from '../types';

export class SettingsService {
  async get(userId: string) {
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      settings = await Settings.create({ userId });
    }
    return settings;
  }

  async update(userId: string, data: Partial<ISettings>) {
    return Settings.findOneAndUpdate({ userId }, { $set: data }, { upsert: true, new: true });
  }
}

export const settingsService = new SettingsService();
