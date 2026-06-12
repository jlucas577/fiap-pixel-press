import request from 'supertest';
import { createTestApp, TestContext } from './utils/app';
import { bearer, loginSeed, SeedTokens } from './utils/auth';
import { expectEnvelope } from './utils/expect';

/** Rotas 15–18 (reviews). Happy-path, regra de nota (422), unicidade e ownership. */
describe('Reviews (e2e)', () => {
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

  it('1. GET /reviews (público) → 200 + paginado', async () => {
    const res = await http().get('/api/v1/reviews');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('2. POST /reviews com nota válida → 201 + persistida', async () => {
    const res = await http()
      .post('/api/v1/reviews')
      .set(bearer(tokens.usuario))
      .send({ jogoSlug: 'god-of-war', nota: 8, spoiler: false, texto: 'Ótimo.' });
    expect(res.status).toBe(201);
    expect(res.body.nota).toBe(8);
  });

  it('3. POST /reviews repetida para o mesmo jogo → 409 (unicidade)', async () => {
    // A usuária já tem review de the-witcher-3-wild-hunt pelo seed.
    const res = await http()
      .post('/api/v1/reviews')
      .set(bearer(tokens.usuario))
      .send({ jogoSlug: 'the-witcher-3-wild-hunt', nota: 7, spoiler: false });
    expect(res.status).toBe(409);
    expectEnvelope(res.body, 'REVIEW_DUPLICADA');
  });

  it('4. POST /reviews com nota 11 → 422 (regra de negócio)', async () => {
    const res = await http()
      .post('/api/v1/reviews')
      .set(bearer(tokens.usuario))
      .send({ jogoSlug: 'portal', nota: 11, spoiler: false });
    expect(res.status).toBe(422);
    expectEnvelope(res.body, 'NOTA_INVALIDA');
  });

  it('5. PATCH /reviews/:id (dono) → 200 + editada', async () => {
    const res = await http()
      .patch(`/api/v1/reviews/${ctx.refs.reviewWitcherId}`)
      .set(bearer(tokens.usuario))
      .send({ nota: 6 });
    expect(res.status).toBe(200);
    expect(res.body.nota).toBe(6);
  });

  it('6. PATCH /reviews/:id de outro usuário → 403', async () => {
    const res = await http()
      .patch(`/api/v1/reviews/${ctx.refs.reviewWitcherId}`)
      .set(bearer(tokens.moderador))
      .send({ nota: 1 });
    expect(res.status).toBe(403);
    expectEnvelope(res.body, 'OWNERSHIP_NEGADO');
  });

  it('7. DELETE /reviews/:id de outro usuário → 403', async () => {
    const res = await http()
      .delete(`/api/v1/reviews/${ctx.refs.reviewWitcherId}`)
      .set(bearer(tokens.moderador));
    expect(res.status).toBe(403);
  });

  it('8. DELETE /reviews/:id (dono) → 204', async () => {
    const res = await http()
      .delete(`/api/v1/reviews/${ctx.refs.reviewWitcherId}`)
      .set(bearer(tokens.usuario));
    expect(res.status).toBe(204);
  });

  it('9. POST /reviews sem token → 401', async () => {
    const res = await http()
      .post('/api/v1/reviews')
      .send({ jogoSlug: 'portal-2', nota: 5, spoiler: false });
    expect(res.status).toBe(401);
    expectEnvelope(res.body);
  });
});
