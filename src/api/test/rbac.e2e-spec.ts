import request from 'supertest';
import { createTestApp, TestContext } from './utils/app';
import { bearer, loginSeed, SeedTokens } from './utils/auth';
import { expectEnvelope } from './utils/expect';

/**
 * Matriz RBAC consolidada (ADMIN ⊇ MODERADOR ⊇ USUARIO).
 * Rota admin-only: GET /usuarios. Rota moderador-only: GET /moderation/reports.
 */
describe('RBAC matriz (e2e)', () => {
  let ctx: TestContext;
  let tokens: SeedTokens;

  beforeAll(async () => {
    ctx = await createTestApp();
    tokens = await loginSeed(ctx.app);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());
  const adminOnly = '/api/v1/usuarios';
  const moderadorOnly = '/api/v1/moderation/reports';

  it('ADMIN acessa rota admin-only e moderador-only (hierarquia)', async () => {
    expect((await http().get(adminOnly).set(bearer(tokens.admin))).status).toBe(200);
    expect((await http().get(moderadorOnly).set(bearer(tokens.admin))).status).toBe(200);
  });

  it('MODERADOR: bloqueado em admin-only (403), liberado em moderador-only (200)', async () => {
    expect((await http().get(adminOnly).set(bearer(tokens.moderador))).status).toBe(403);
    expect((await http().get(moderadorOnly).set(bearer(tokens.moderador))).status).toBe(200);
  });

  it('USUARIO: bloqueado em ambas (403)', async () => {
    const a = await http().get(adminOnly).set(bearer(tokens.usuario));
    const m = await http().get(moderadorOnly).set(bearer(tokens.usuario));
    expect(a.status).toBe(403);
    expect(m.status).toBe(403);
    expectEnvelope(a.body);
  });

  it('Qualquer papel acessa GET /usuarios/me (autenticado)', async () => {
    for (const t of [tokens.admin, tokens.moderador, tokens.usuario]) {
      expect((await http().get('/api/v1/usuarios/me').set(bearer(t))).status).toBe(200);
    }
  });

  it('Sem token → 401 em rota protegida', async () => {
    const res = await http().get(adminOnly);
    expect(res.status).toBe(401);
    expectEnvelope(res.body);
  });
});
