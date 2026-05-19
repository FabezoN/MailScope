import { Injectable } from '@nestjs/common';
import { OsintClientService } from '../osint-client/osint-client.service';

@Injectable()
export class InvestigationsService {
  constructor(private readonly osintClient: OsintClientService) {}

  analyze(email: string) {
    return this.osintClient.analyzeEmail(email);
  }
}
