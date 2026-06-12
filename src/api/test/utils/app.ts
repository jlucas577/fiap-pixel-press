import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { seedTestDb, SeedRefs } from './seed';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaClient;
  refs: SeedRefs;
}

/**
 * Sobe a app Nest com a MESMA configuração do main.ts (prefixo, ValidationPipe,
 * ExceptionFilter), re-seeda o test.db e devolve os ids úteis. Logger desligado
 * para manter a saída dos testes limpa.
 */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  const prisma = app.get(PrismaService);
  const refs = await seedTestDb(prisma);

  return { app, prisma, refs };
}
