import { IGithubAccountRepository } from '@app/database/interfaces/github-account.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { GithubLinkedAccount } from '@app/database/types/github-account.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GithubAccountRepository implements IGithubAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findByUserId(userId: string): Promise<GithubLinkedAccount | null> {
    return await this.prisma.account.findFirst({
      where: {
        userId,
        providerId: 'github',
      },
      select: {
        id: true,
        accountId: true,
      },
    });
  }
}
