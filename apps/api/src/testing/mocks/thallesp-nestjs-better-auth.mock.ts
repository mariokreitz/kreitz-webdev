export function Session(): ParameterDecorator {
  return () => undefined;
}

export function AllowAnonymous(): ClassDecorator {
  return () => undefined;
}

export class AuthModule {
  public readonly marker?: never;
}

export class AuthService {
  public readonly marker?: never;
}
