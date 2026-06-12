import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * E2E de UI (Camada B do plano de testes). Sobe a stack de teste automaticamente:
 *   - API NestJS na :3333 com banco isolado (test-e2e.db) e USE_RAWG_MOCK=true
 *   - SPA (vite) na :4173 apontando VITE_API_BASE_URL para a API de teste
 *
 * Determinismo: nenhuma chamada à RAWG real; banco re-seedado no boot do servidor.
 * workers=1 e sem paralelismo: os specs compartilham o mesmo banco seedado.
 */
const API_PORT = 3333;
const WEB_PORT = 4173;
const API_DIR = path.resolve(__dirname, '../api');

const API_ENV: Record<string, string> = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: String(API_PORT),
  DATABASE_URL: 'file:./test-e2e.db',
  JWT_SECRET: 'test-secret-suficientemente-longo-para-os-testes',
  JWT_EXPIRATION: '3600s',
  JWT_REFRESH_EXPIRATION: '7d',
  RAWG_API_KEY: 'mock-key-nao-usada',
  RAWG_BASE_URL: 'https://api.rawg.io/api',
  RAWG_CACHE_TTL_SECONDS: '300',
  USE_RAWG_MOCK: 'true',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command:
        'pnpm exec prisma db push --skip-generate --accept-data-loss && pnpm exec prisma db seed && pnpm exec nest start',
      cwd: API_DIR,
      url: `http://localhost:${API_PORT}/api/docs`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
      env: API_ENV,
    },
    {
      command: `pnpm exec vite --port ${WEB_PORT} --strictPort`,
      cwd: __dirname,
      url: `http://localhost:${WEB_PORT}`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { ...process.env, VITE_API_BASE_URL: `http://localhost:${API_PORT}/api/v1` },
    },
  ],
});
