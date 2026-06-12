/**
 * Ambiente de teste determinístico. Aplicado ANTES de qualquer import do AppModule
 * (setupFiles) e no globalSetup. Define as invariáveis do plano de testes:
 *   - banco isolado em test.db (nunca dev.db)
 *   - USE_RAWG_MOCK=true (nenhuma chamada à RAWG real)
 *
 * Define as variáveis direto em process.env (sem depender de dotenv): o ConfigModule
 * do Nest não sobrescreve chaves já presentes, então o .env de dev é ignorado aqui.
 */
export const TEST_DATABASE_URL = 'file:./test.db';

export function applyTestEnv(): void {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'test-secret-suficientemente-longo-para-os-testes';
  process.env.JWT_EXPIRATION = '3600s';
  process.env.JWT_REFRESH_EXPIRATION = '7d';
  process.env.RAWG_API_KEY = 'mock-key-nao-usada';
  process.env.RAWG_BASE_URL = 'https://api.rawg.io/api';
  process.env.RAWG_CACHE_TTL_SECONDS = '300';
  process.env.USE_RAWG_MOCK = 'true';
}
