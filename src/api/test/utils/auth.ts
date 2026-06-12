import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SENHA_SEED } from './seed';

/** Faz login e devolve o access token. */
export async function login(
  app: INestApplication,
  email: string,
  senha: string = SENHA_SEED,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, senha });
  if (res.status !== 200) {
    throw new Error(`Login falhou para ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.access_token as string;
}

/** Header Authorization para o supertest. */
export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/** Tokens dos quatro usuários do seed, por papel. */
export interface SeedTokens {
  admin: string;
  moderador: string;
  usuario: string;
}

export async function loginSeed(app: INestApplication): Promise<SeedTokens> {
  const [admin, moderador, usuario] = await Promise.all([
    login(app, 'admin@pixelpress.dev'),
    login(app, 'moderador@pixelpress.dev'),
    login(app, 'usuario@pixelpress.dev'),
  ]);
  return { admin, moderador, usuario };
}
