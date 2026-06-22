import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Investigation } from './investigation.entity';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface PlatformResult {
  platform: string;
  exists: boolean;
  emailRecovery: boolean;
  rateLimit: boolean;
}

export interface LeakIXExposure {
  host: string;
  ip: string;
  port: number;
  protocol: string;
  service: string;
  severity: string;
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  investigationId!: string;

  @OneToOne(() => Investigation, (inv) => inv.report, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investigationId' })
  investigation!: Investigation;

  @Column()
  email!: string;

  @Column()
  domain!: string;

  @Column({ type: 'int' })
  globalScore!: number;

  @Column({ type: 'enum', enum: RiskLevel })
  riskLevel!: RiskLevel;

  @Column({ type: 'int', default: 0 })
  accountsFound!: number;

  @Column({ type: 'jsonb' })
  platforms!: PlatformResult[];

  @Column({ type: 'jsonb' })
  leakixExposures!: LeakIXExposure[];

  @Column({ type: 'jsonb' })
  recommendations!: string[];

  @Column({ type: 'int' })
  durationMs!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
