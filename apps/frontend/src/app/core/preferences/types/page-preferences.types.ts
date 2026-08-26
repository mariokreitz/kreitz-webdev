import type { Language } from '../../language/types/language.types';
import type { Theme } from '../../theme/types/theme.types';

export interface PagePreferences {
  readonly theme: Theme;
  readonly language: Language;
}
