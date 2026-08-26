export interface Environment {
  readonly production: boolean;
  readonly api: {
    readonly authBaseUrl: string;
    readonly kreitzWebdev: string;
  };
}
