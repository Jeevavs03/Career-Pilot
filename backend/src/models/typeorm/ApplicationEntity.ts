import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('applications')
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar' })
  jobId!: string;

  @Column({ type: 'varchar', default: 'queued' })
  status!: string;

  @Column({ type: 'float', default: 0 })
  matchScore!: number;

  @Column({ type: 'jsonb', nullable: true })
  answers!: Record<string, any>[];

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
