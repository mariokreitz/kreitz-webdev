import type { ProjectCategory } from '../../../../core/api';

export interface ProjectFormValue {
  readonly name: string;
  readonly description: string;
  readonly repoUrl: string;
  readonly liveUrl: string;
  readonly imageUrl: string;
  readonly tags: string;
  readonly category: ProjectCategory | '';
}

export const EMPTY_PROJECT_FORM_VALUE: ProjectFormValue = {
  name: '',
  description: '',
  repoUrl: '',
  liveUrl: '',
  imageUrl: '',
  tags: '',
  category: '',
};

export const PROJECT_CATEGORY_OPTIONS: readonly {
  readonly value: ProjectCategory;
  readonly labelKey: string;
}[] = [
  { value: 'DEMO', labelKey: 'projects.form.categories.demo' },
  { value: 'OPEN_SOURCE', labelKey: 'projects.form.categories.openSource' },
  { value: 'POC', labelKey: 'projects.form.categories.poc' },
  { value: 'MVP', labelKey: 'projects.form.categories.mvp' },
  { value: 'PLATFORM', labelKey: 'projects.form.categories.platform' },
];
