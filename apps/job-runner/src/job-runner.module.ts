import { Module } from "@nestjs/common";

import { JobRunnerService } from "./job-runner.service";

@Module({
  providers: [JobRunnerService]
})
export class JobRunnerModule {}
