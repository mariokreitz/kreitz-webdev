import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectService {
  public create(): string {
    return 'project created';
  }

  public findAll(): string {
    return 'returns all projects';
  }
}
