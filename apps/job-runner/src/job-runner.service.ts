import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";

@Injectable()
export class JobRunnerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobRunnerService.name);

  onApplicationBootstrap(): void {
    this.logger.log("Job runner is ready.");
  }
}
