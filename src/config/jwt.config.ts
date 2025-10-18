import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-change-this',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-this',
  // Expiry will be taken from app.config based on environment
}));
