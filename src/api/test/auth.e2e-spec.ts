import request from 'supertest';
import { createTestApp, TestContext } from './utils/app';
import { SENHA_SEED } from './utils/seed';
import { expectEnvelope } from './utils/expect';

/**
 * Rotas 1–3 (auth) + 401 sem token.
 * Divergência do plano (código vence): payload inválido no register cai no
 * ValidationPipe → 400 (não 422). 422 fica para regras de negócio (ex.: nota).
 */
describe('Auth (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  it('1. register com e-mail novo → 201 + tokens, papel USUARIO', async () => {
    const res = await http()
      .post('/api/v1/auth/register')
      .send({ email: 'novo@pixelpress.dev', nome: 'Nina Nova', senha: 'Senha@123' });
    expect(res.status).toBe(201);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.usuario.papel).toBe('USUARIO');
  });

  it('2. login com as credenciais recém-criadas → 200 + JWT', async () => {
    const res = await http()
      .post('/api/v1/auth/login')
      .send({ email: 'novo@pixelpress.dev', senha: 'Senha@123' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
  });

  it('3. register com e-mail duplicado → 409', async () => {
    const res = await http()
      .post('/api/v1/auth/register')
      .send({ email: 'admin@pixelpress.dev', nome: 'Outro', senha: 'Senha@123' });
    expect(res.status).toBe(409);
    expectEnvelope(res.body, 'EMAIL_DUPLICADO');
  });

  it('4. register com payload inválido → 400 (ValidationPipe)', async () => {
    const res = await http()
      .post('/api/v1/auth/register')
      .send({ email: 'nao-eh-email', nome: 'x', senha: '123' });
    expect(res.status).toBe(400);
    expectEnvelope(res.body);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('5. login com senha errada → 401', async () => {
    const res = await http()
      .post('/api/v1/auth/login')
      .send({ email: 'admin@pixelpress.dev', senha: 'senha-errada' });
    expect(res.status).toBe(401);
    expectEnvelope(res.body);
  });

  it('5b. login de usuário inativo → 401', async () => {
    const res = await http()
      .post('/api/v1/auth/login')
      .send({ email: 'inativo@pixelpress.dev', senha: SENHA_SEED });
    expect(res.status).toBe(401);
  });

  it('6. refresh com refresh token válido → 200 + novo access', async () => {
    const login = await http()
      .post('/api/v1/auth/login')
      .send({ email: 'usuario@pixelpress.dev', senha: SENHA_SEED });
    const res = await http()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: login.body.refresh_token });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
  });

  it('7. refresh com access token (tipo errado) → 401', async () => {
    const login = await http()
      .post('/api/v1/auth/login')
      .send({ email: 'usuario@pixelpress.dev', senha: SENHA_SEED });
    const res = await http()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: login.body.access_token });
    expect(res.status).toBe(401);
    expectEnvelope(res.body);
  });

  it('7b. refresh com token malformado → 400 (não é JWT)', async () => {
    const res = await http()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: 'isto-nao-e-um-jwt' });
    expect(res.status).toBe(400);
  });

  it('8. escrita sem Authorization → 401', async () => {
    const res = await http()
      .post('/api/v1/biblioteca')
      .send({ jogoSlug: 'portal-2', status: 'JOGANDO' });
    expect(res.status).toBe(401);
    expectEnvelope(res.body);
  });
});
