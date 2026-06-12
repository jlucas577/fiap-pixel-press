import request from 'supertest';
import { createTestApp, TestContext } from './utils/app';
import { bearer, loginSeed, SeedTokens } from './utils/auth';
import { expectEnvelope } from './utils/expect';

/** Rotas 4–8 (usuários + RBAC de admin). */
describe('Usuários (e2e)', () => {
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

  it('0. GET /usuarios/me sem token → 401', async () => {
    const res = await http().get('/api/v1/usuarios/me');
    expect(res.status).toBe(401);
    expectEnvelope(res.body);
  });

  it('1. GET /usuarios/me logado → 200 + perfil do token', async () => {
    const res = await http().get('/api/v1/usuarios/me').set(bearer(tokens.usuario));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('usuario@pixelpress.dev');
    expect(res.body).not.toHaveProperty('senhaHash');
  });

  it('2. PATCH /usuarios/me edita o nome → 200 + persistido', async () => {
    const patch = await http()
      .patch('/api/v1/usuarios/me')
      .set(bearer(tokens.usuario))
      .send({ nome: 'Ursula Renomeada' });
    expect(patch.status).toBe(200);
    expect(patch.body.nome).toBe('Ursula Renomeada');

    const me = await http().get('/api/v1/usuarios/me').set(bearer(tokens.usuario));
    expect(me.body.nome).toBe('Ursula Renomeada');
  });

  it('3. GET /usuarios como ADMIN → 200 + lista paginada', async () => {
    const res = await http().get('/api/v1/usuarios').set(bearer(tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(4);
  });

  it('4. GET /usuarios como USUARIO → 403', async () => {
    const res = await http().get('/api/v1/usuarios').set(bearer(tokens.usuario));
    expect(res.status).toBe(403);
    expectEnvelope(res.body);
  });

  it('5. GET /usuarios/:id (autenticado) → 200', async () => {
    const res = await http()
      .get(`/api/v1/usuarios/${ctx.refs.usuarios.admin.id}`)
      .set(bearer(tokens.usuario));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ctx.refs.usuarios.admin.id);
  });

  it('6. PATCH /usuarios/:id/papel como ADMIN muda o papel de fato', async () => {
    const alvo = ctx.refs.usuarios.inativo.id;
    const patch = await http()
      .patch(`/api/v1/usuarios/${alvo}/papel`)
      .set(bearer(tokens.admin))
      .send({ papel: 'MODERADOR' });
    expect(patch.status).toBe(200);
    expect(patch.body.papel).toBe('MODERADOR');

    const conferir = await http().get(`/api/v1/usuarios/${alvo}`).set(bearer(tokens.admin));
    expect(conferir.body.papel).toBe('MODERADOR');
  });

  it('7. PATCH /usuarios/:id/papel como USUARIO → 403', async () => {
    const res = await http()
      .patch(`/api/v1/usuarios/${ctx.refs.usuarios.moderador.id}/papel`)
      .set(bearer(tokens.usuario))
      .send({ papel: 'ADMIN' });
    expect(res.status).toBe(403);
    expectEnvelope(res.body);
  });
});
