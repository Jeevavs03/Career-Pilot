import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('jobs')
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  company!: string;

  @Column({ type: 'varchar', nullable: true })
  salary!: string;

  @Column({ type: 'simple-array', nullable: true })
  skills!: string[];

  @Column({ type: 'varchar', nullable: true })
  experience!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', unique: true })
  url!: string;

  @Column({ type: 'varchar', nullable: true })
  location!: string;

  @Column({ type: 'varchar', default: 'other' })
  source!: string;

  @Column({ type: 'float', default: 0 })
  matchScore!: number;

  @Column({ type: 'varchar', default: 'new' })
  status!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
