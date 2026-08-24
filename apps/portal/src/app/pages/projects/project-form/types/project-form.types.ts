export interface ProjectFormValue {
  readonly name: string;
  readonly description: string;
  readonly repoUrl: string;
  readonly liveUrl: string;
  readonly imageUrl: string;
  readonly tags: string;
}

export const EMPTY_PROJECT_FORM_VALUE: ProjectFormValue = {
  name: '',
  description: '',
  repoUrl: '',
  liveUrl: '',
  imageUrl: '',
  tags: '',
};
