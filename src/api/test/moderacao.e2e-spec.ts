import request from 'supertest';
import { createTestApp, TestContext } from './utils/app';
import { bearer, loginSeed, SeedTokens } from './utils/auth';
import { expectEnvelope } from './utils/expect';

/** Rotas 19–21 (moderação) — fluxo completo de denúncia → ocultação → resolução. */
describe('Moderação (e2e)', () => {
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

  it('1. POST /reports (usuário denuncia review) → 201 + PENDENTE', async () => {
    const res = await http()
      .post('/api/v1/reports')
      .set(bearer(tokens.usuario))
      .send({ reviewId: ctx.refs.reviewPortalId, motivo: 'Spoilers não marcados.' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDENTE');
  });

  it('2. GET /moderation/reports como MODERADOR → 200 + pendentes', async () => {
    const res = await http().get('/api/v1/moderation/reports').set(bearer(tokens.moderador));
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('3. GET /moderation/reports como USUARIO → 403', async () => {
    const res = await http().get('/api/v1/moderation/reports').set(bearer(tokens.usuario));
    expect(res.status).toBe(403);
    expectEnvelope(res.body);
  });

  it('4. PATCH /reviews/:id/hide como MODERADOR → 200 + oculto, denúncia RESOLVIDA', async () => {
    const res = await http()
      .patch(`/api/v1/reviews/${ctx.refs.reviewPortalId}/hide`)
      .set(bearer(tokens.moderador))
      .send({ motivo: 'Viola as diretrizes da comunidade.' });
    expect(res.status).toBe(200);
    expect(res.body.oculto).toBe(true);

    const denuncias = await ctx.prisma.denuncia.findMany({
      where: { reviewId: ctx.refs.reviewPortalId },
    });
    expect(denuncias.length).toBeGreaterThanOrEqual(1);
    expect(denuncias.every((d) => d.status === 'RESOLVIDA')).toBe(true);
  });

  it('5. review oculta some da listagem pública', async () => {
    const res = await http().get('/api/v1/reviews').query({ jogo: 'portal-2' });
    expect(res.status).toBe(200);
    const ids = (res.body.results as { id: string }[]).map((r) => r.id);
    expect(ids).not.toContain(ctx.refs.reviewPortalId);
  });

  it('6. PATCH /reviews/:id/hide como USUARIO → 403', async () => {
    const res = await http()
      .patch(`/api/v1/reviews/${ctx.refs.reviewWitcherId}/hide`)
      .set(bearer(tokens.usuario))
      .send({ motivo: 'Tentativa indevida.' });
    expect(res.status).toBe(403);
    expectEnvelope(res.body);
  });

  it('7. POST /reports de review inexistente → 404', async () => {
    const res = await http()
      .post('/api/v1/reports')
      .set(bearer(tokens.usuario))
      .send({ reviewId: 'id-que-nao-existe', motivo: 'Qualquer motivo.' });
    expect(res.status).toBe(404);
    expectEnvelope(res.body);
  });
});
