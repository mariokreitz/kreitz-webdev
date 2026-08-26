import type { UserRecord } from '@app/database/types/user.repository.types';

export interface IUserRepository {
  findById: (id: string) => Promise<UserRecord | null>;
}
