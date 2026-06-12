import { execSync } from 'child_process';
import { applyTestEnv, TEST_DATABASE_URL } from './test-env';

/**
 * Roda uma vez antes de toda a suíte: materializa o schema no test.db isolado.
 * Cada arquivo de teste re-seeda o banco em beforeAll (seed.ts), garantindo isolamento.
 */
export default async function globalSetup(): Promise<void> {
  applyTestEnv();
  execSync('pnpm exec prisma db push --skip-generate --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
