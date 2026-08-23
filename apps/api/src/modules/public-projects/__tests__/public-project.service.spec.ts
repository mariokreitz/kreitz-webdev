import type { IPublicProjectRepository } from '@app/database/interfaces/public-project.repository.interface';
import type { PublicProjectRecord } from '@app/database/types/public-project.types';

import { PublicProjectService } from '../public-project.service';

function buildRepository(records: PublicProjectRecord[]): IPublicProjectRepository {
  return {
    findPublishedByWebsiteId: jest.fn().mockResolvedValue(records),
  };
}

function firstOf<T>(items: readonly T[]): T {
  const [item] = items;

  if (item === undefined) {
    throw new Error('Expected at least one item');
  }

  return item;
}

const record: PublicProjectRecord = {
  id: 'project-1',
  name: 'My awesome project',
  description: 'A project description',
  repoUrl: 'https://github.com/mariokreitz/my-project',
  liveUrl: 'https://myproject.dev',
  tags: ['Angular', 'NestJS'],
  imageUrl: 'https://example.com/project.png',
};

describe('PublicProjectService', () => {
  describe('getPublishedProjects', () => {
    it('returns the website projects in the documented public shape with exactly id, name, description, repoUrl, liveUrl, tags, and imageUrl', async () => {
      const repository = buildRepository([record]);
      const service = new PublicProjectService(repository);

      const result = await service.getPublishedProjects('website-1');

      expect(result).toEqual([
        {
          id: 'project-1',
          name: 'My awesome project',
          description: 'A project description',
          repoUrl: 'https://github.com/mariokreitz/my-project',
          liveUrl: 'https://myproject.dev',
          tags: ['Angular', 'NestJS'],
          imageUrl: 'https://example.com/project.png',
        },
      ]);
      expect(Object.keys(firstOf(result))).toEqual([
        'id',
        'name',
        'description',
        'repoUrl',
        'liveUrl',
        'tags',
        'imageUrl',
      ]);
    });

    it('does not include githubOwner, githubRepo, sortOrder, or any other internal field in the returned projects', async () => {
      const repository = buildRepository([record]);
      const service = new PublicProjectService(repository);

      const result = await service.getPublishedProjects('website-1');

      expect(Object.keys(firstOf(result))).not.toContain('githubOwner');
      expect(Object.keys(firstOf(result))).not.toContain('githubRepo');
      expect(Object.keys(firstOf(result))).not.toContain('sortOrder');
    });

    it('queries the repository with exactly the given websiteId, so no code path can return another website data', async () => {
      const repository = buildRepository([]);
      const service = new PublicProjectService(repository);

      await service.getPublishedProjects('website-a');

      expect(repository.findPublishedByWebsiteId).toHaveBeenCalledTimes(1);
      expect(repository.findPublishedByWebsiteId).toHaveBeenCalledWith('website-a');
    });

    it('never calls the repository with a websiteId other than the one it received', async () => {
      const repository = buildRepository([]);
      const service = new PublicProjectService(repository);

      await service.getPublishedProjects('website-b');

      expect(repository.findPublishedByWebsiteId).not.toHaveBeenCalledWith('website-a');
    });

    it('returns an empty array as-is, relying on the repository to have already excluded unpublished projects', async () => {
      const repository = buildRepository([]);
      const service = new PublicProjectService(repository);

      const result = await service.getPublishedProjects('website-c');

      expect(result).toEqual([]);
    });

    it('maps only the 7 allow-listed fields even when the underlying record carries extra internal fields, guarding against a newly-added sensitive field silently leaking', async () => {
      const leakyRecord = {
        ...record,
        githubOwner: 'mariokreitz',
        githubRepo: 'my-project',
        sortOrder: 3,
        internalNotes: 'never expose this',
      } as PublicProjectRecord;
      const repository = buildRepository([leakyRecord]);
      const service = new PublicProjectService(repository);

      const result = await service.getPublishedProjects('website-1');

      const mapped = firstOf(result);

      expect(Object.keys(mapped)).toEqual(['id', 'name', 'description', 'repoUrl', 'liveUrl', 'tags', 'imageUrl']);
      expect(mapped).not.toHaveProperty('githubOwner');
      expect(mapped).not.toHaveProperty('githubRepo');
      expect(mapped).not.toHaveProperty('sortOrder');
      expect(mapped).not.toHaveProperty('internalNotes');
    });
  });
});
