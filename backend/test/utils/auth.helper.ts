import { JwtService } from '@nestjs/jwt';

export function signTestToken(payload: { sub: string; email: string; role: string }) {
  // .env.test içindeki JWT_SECRET değerini kullanır
  const jwt = new JwtService({ secret: process.env.JWT_SECRET || 'test_jwt_secret_key_987' });
  return jwt.sign(payload, { expiresIn: '15m' });
}