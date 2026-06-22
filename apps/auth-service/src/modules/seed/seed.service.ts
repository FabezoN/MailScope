import * as path from 'path';
import * as fs from 'fs';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as yaml from 'js-yaml';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

interface SeedUser {
  email: string;
  password: string;
}

interface SeedData {
  users?: SeedUser[];
}

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const env = this.configService.get('NODE_ENV') === 'production' ? 'prod' : 'dev';
    const seedFile = path.resolve(__dirname, '../../../seeds', `${env}.yml`);

    if (!fs.existsSync(seedFile)) {
      this.logger.warn(`Seed file not found: ${seedFile}`);
      return;
    }

    const data = yaml.load(fs.readFileSync(seedFile, 'utf8')) as SeedData;

    if (!data?.users?.length) return;

    for (const entry of data.users) {
      const existing = await this.usersService.findByEmail(entry.email);
      if (existing) {
        this.logger.log(`Seed: ${entry.email} already exists, skipping`);
        continue;
      }
      const hashed = await bcrypt.hash(entry.password, 10);
      await this.usersService.create({ email: entry.email, password: hashed });
      this.logger.log(`Seed: ${entry.email} created`);
    }
  }
}
