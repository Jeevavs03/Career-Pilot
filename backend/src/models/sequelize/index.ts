import { DataTypes, Model, Sequelize } from 'sequelize';

export const defineModels = (sequelize: Sequelize) => {
  class UserModel extends Model {}
  UserModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    profile: { type: DataTypes.JSON },
  }, { sequelize, tableName: 'users', timestamps: true });

  class JobModel extends Model {}
  JobModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    company: { type: DataTypes.STRING, allowNull: false },
    salary: DataTypes.STRING,
    skills: DataTypes.JSON,
    experience: DataTypes.STRING,
    description: DataTypes.TEXT,
    url: { type: DataTypes.STRING, unique: true, allowNull: false },
    location: DataTypes.STRING,
    source: { type: DataTypes.ENUM('linkedin', 'naukri', 'company', 'manual', 'other'), defaultValue: 'other' },
    matchScore: { type: DataTypes.FLOAT, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'new' },
  }, { sequelize, tableName: 'jobs', timestamps: true });

  class ApplicationModel extends Model {}
  ApplicationModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    jobId: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'queued' },
    matchScore: { type: DataTypes.FLOAT, defaultValue: 0 },
    answers: DataTypes.JSON,
    notes: DataTypes.TEXT,
  }, { sequelize, tableName: 'applications', timestamps: true });

  class AnalyticsModel extends Model {}
  AnalyticsModel.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    jobsFound: { type: DataTypes.INTEGER, defaultValue: 0 },
    jobsMatched: { type: DataTypes.INTEGER, defaultValue: 0 },
    applicationsPrepared: { type: DataTypes.INTEGER, defaultValue: 0 },
    topSkills: DataTypes.JSON,
  }, { sequelize, tableName: 'analytics', timestamps: true });

  return { UserModel, JobModel, ApplicationModel, AnalyticsModel };
};
