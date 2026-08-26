import { IUserRepository } from '@app/database/interfaces/user.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { UserRecord } from '@app/database/types/user.repository.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
      },
    });
  }
}
