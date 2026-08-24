import type { CreateProjectPayload, UpdateProjectPayload } from '../../../core/projects';
import type { ProjectFormValue } from './types/project-form.types';

export function toProjectPayload(value: ProjectFormValue): CreateProjectPayload & UpdateProjectPayload {
  const tags = value.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return {
    name: value.name.trim(),
    description: value.description.trim(),
    tags,
    // repoUrl/liveUrl/imageUrl use @IsUrl() server-side (rejects empty string), so an emptied field must be omitted rather than sent.
    ...(value.repoUrl.trim() && { repoUrl: value.repoUrl.trim() }),
    ...(value.liveUrl.trim() && { liveUrl: value.liveUrl.trim() }),
    ...(value.imageUrl.trim() && { imageUrl: value.imageUrl.trim() }),
  };
}
