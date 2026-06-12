import request from 'supertest';
import { createTestApp, TestContext } from './utils/app';
import { bearer, login } from './utils/auth';
import { expectEnvelope } from './utils/expect';
import { RAWG_CLIENT, RawgClient } from '../src/jogos/rawg/rawg.types';
import { RawgIndisponivelException } from '../src/common/exceptions/domain.exception';

/**
 * Rotas 9–10 (catálogo). Tudo via MockRawgClient (USE_RAWG_MOCK=true): nenhuma
 * chamada à RAWG real. Cobre envelope de paginação, cache miss→hit, upsert do
 * Jogo e o caminho de 502.
 *
 * Divergência do plano (código vence): JogosController não tem guard — o catálogo
 * é público (sem token).
 */
describe('Catálogo (e2e)', () => {
  let ctx: TestContext;
  let rawg: RawgClient;

  beforeAll(async () => {
    ctx = await createTestApp();
    rawg = ctx.app.get<RawgClient>(RAWG_CLIENT);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  it('1. GET /games (público) → 200 + envelope de paginação', async () => {
    const res = await http().get('/api/v1/games').query({ search: 'witcher' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('next');
    expect(res.body).toHaveProperty('previous');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('2. mesma busca 2ª vez é servida do cache (RawgClient chamado 1×)', async () => {
    const spy = jest.spyOn(rawg, 'buscar');
    await http().get('/api/v1/games').query({ search: 'portal' });
    await http().get('/api/v1/games').query({ search: 'portal' });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('3. GET /games/:slug → 200 + detalhe', async () => {
    const res = await http().get('/api/v1/games/the-witcher-3-wild-hunt');
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('the-witcher-3-wild-hunt');
    expect(res.body.nome).toBeDefined();
  });

  it('4. adicionar um jogo novo à biblioteca faz upsert da referência Jogo', async () => {
    const token = await login(ctx.app, 'usuario@pixelpress.dev');
    // cyberpunk-2077 está na fixture mas NÃO entre os 4 jogos do seed.
    const antes = await ctx.prisma.jogo.findUnique({ where: { slug: 'cyberpunk-2077' } });
    expect(antes).toBeNull();

    const res = await http()
      .post('/api/v1/biblioteca')
      .set(bearer(token))
      .send({ jogoSlug: 'cyberpunk-2077', status: 'QUERO_JOGAR' });
    expect(res.status).toBe(201);

    const depois = await ctx.prisma.jogo.findUnique({ where: { slug: 'cyberpunk-2077' } });
    expect(depois).not.toBeNull();
    expect(depois!.rawgId).toBeGreaterThan(0);
  });

  it('5. falha do RawgClient → 502 no envelope, sem vazar a chave', async () => {
    const spy = jest
      .spyOn(rawg, 'buscar')
      .mockRejectedValueOnce(new RawgIndisponivelException());
    const res = await http().get('/api/v1/games').query({ search: 'falha-unica-xyz' });
    expect(res.status).toBe(502);
    expectEnvelope(res.body, 'CATALOGO_INDISPONIVEL');
    expect(JSON.stringify(res.body)).not.toContain('mock-key-nao-usada');
    spy.mockRestore();
  });
});
