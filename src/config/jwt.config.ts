
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      '[Configuration Error] Missing required environment variable: JWT_SECRET',
    );
  }

  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN?.trim() || '1h',
  };
});
