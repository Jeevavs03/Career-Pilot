import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('analytics')
export class AnalyticsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'int', default: 0 })
  jobsFound!: number;

  @Column({ type: 'int', default: 0 })
  jobsMatched!: number;

  @Column({ type: 'int', default: 0 })
  applicationsPrepared!: number;

  @Column({ type: 'int', default: 0 })
  interviewRequests!: number;

  @Column({ type: 'int', default: 0 })
  offers!: number;

  @Column({ type: 'jsonb', nullable: true })
  topSkills!: Record<string, any>[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
