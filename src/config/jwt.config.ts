
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      '[Configuration Error] Missing required environment variable: JWT_SECRET',
    );
  }

  const expiresIn =
    process.env.JWT_EXPIRES_IN?.trim() || '1h';

  if (!/^\d+(ms|s|m|h|d|w|y)$/.test(expiresIn)) {
    throw new Error(
      '[Configuration Error] JWT_EXPIRES_IN must be a valid duration, such as 15m, 1h, or 7d.',
    );
  }

  return {
    secret,
    expiresIn,
  };
});
