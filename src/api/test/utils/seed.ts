import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import fixture from '../../src/jogos/rawg/jogos.fixture.json';

/**
 * Seed determinístico para os testes E2E. Espelha prisma/seed.ts, mas como função
 * que recebe o PrismaClient da app de teste e devolve os ids úteis, permitindo
 * re-seed rápido (in-process) e isolamento por arquivo de teste.
 */

export const SENHA_SEED = 'Senha@123';

interface JogoFixture {
  rawgId: number;
  slug: string;
  nome: string;
  capaUrl: string | null;
}

interface UsuarioRef {
  id: string;
  email: string;
}

interface JogoRef {
  id: string;
  rawgId: number;
  slug: string;
}

export interface SeedRefs {
  senha: string;
  usuarios: {
    admin: UsuarioRef;
    moderador: UsuarioRef;
    usuario: UsuarioRef;
    inativo: UsuarioRef;
  };
  jogos: Record<string, JogoRef>;
  reviewWitcherId: string; // review da usuária comum (jogo the-witcher-3-wild-hunt)
  reviewPortalId: string; // review do moderador (jogo portal-2)
  bibliotecaWitcherId: string; // item de biblioteca da usuária comum (witcher)
  denunciaId: string; // denúncia pendente (admin → review da usuária)
}

const jogos = fixture as JogoFixture[];

function porSlug(slug: string): JogoFixture {
  const j = jogos.find((g) => g.slug === slug);
  if (!j) {
    throw new Error(`Fixture sem o jogo ${slug}`);
  }
  return j;
}

export async function seedTestDb(prisma: PrismaClient): Promise<SeedRefs> {
  // Limpeza (ordem respeitando FKs).
  await prisma.denuncia.deleteMany();
  await prisma.review.deleteMany();
  await prisma.itemBiblioteca.deleteMany();
  await prisma.jogo.deleteMany();
  await prisma.usuario.deleteMany();

  const senhaHash = await bcrypt.hash(SENHA_SEED, 10);

  const [admin, moderador, usuario, inativo] = await Promise.all([
    prisma.usuario.create({
      data: { email: 'admin@pixelpress.dev', nome: 'Alice Admin', senhaHash, papel: 'ADMIN' },
    }),
    prisma.usuario.create({
      data: {
        email: 'moderador@pixelpress.dev',
        nome: 'Marcos Moderador',
        senhaHash,
        papel: 'MODERADOR',
      },
    }),
    prisma.usuario.create({
      data: { email: 'usuario@pixelpress.dev', nome: 'Ursula Usuária', senhaHash, papel: 'USUARIO' },
    }),
    prisma.usuario.create({
      data: {
        email: 'inativo@pixelpress.dev',
        nome: 'Ivo Inativo',
        senhaHash,
        papel: 'USUARIO',
        ativo: false,
      },
    }),
  ]);

  const seedJogos = [
    'the-witcher-3-wild-hunt',
    'grand-theft-auto-v',
    'portal-2',
    'god-of-war',
  ].map(porSlug);

  const jogosCriados = await Promise.all(
    seedJogos.map((j) =>
      prisma.jogo.create({
        data: { rawgId: j.rawgId, slug: j.slug, nome: j.nome, capaUrl: j.capaUrl },
      }),
    ),
  );
  const jogoPorSlug = new Map(jogosCriados.map((j) => [j.slug, j]));
  const witcher = jogoPorSlug.get('the-witcher-3-wild-hunt')!;
  const gta = jogoPorSlug.get('grand-theft-auto-v')!;
  const portal = jogoPorSlug.get('portal-2')!;

  const itemWitcher = await prisma.itemBiblioteca.create({
    data: { usuarioId: usuario.id, jogoId: witcher.id, status: 'PLATINADO', horasJogadas: 120 },
  });
  await prisma.itemBiblioteca.create({
    data: { usuarioId: usuario.id, jogoId: gta.id, status: 'JOGANDO', horasJogadas: 45 },
  });

  const reviewUsuario = await prisma.review.create({
    data: {
      usuarioId: usuario.id,
      jogoId: witcher.id,
      nota: 10,
      texto: 'Melhor RPG que já joguei. História impecável.',
      spoiler: false,
    },
  });
  const reviewModerador = await prisma.review.create({
    data: {
      usuarioId: moderador.id,
      jogoId: portal.id,
      nota: 9,
      texto: 'Puzzles geniais e humor afiado.',
      spoiler: false,
    },
  });

  const denuncia = await prisma.denuncia.create({
    data: {
      reviewId: reviewUsuario.id,
      denuncianteId: admin.id,
      motivo: 'Conteúdo possivelmente fora das diretrizes da comunidade.',
      status: 'PENDENTE',
    },
  });

  const jogosRef: Record<string, JogoRef> = {};
  for (const j of jogosCriados) {
    jogosRef[j.slug] = { id: j.id, rawgId: j.rawgId, slug: j.slug };
  }

  return {
    senha: SENHA_SEED,
    usuarios: {
      admin: { id: admin.id, email: admin.email },
      moderador: { id: moderador.id, email: moderador.email },
      usuario: { id: usuario.id, email: usuario.email },
      inativo: { id: inativo.id, email: inativo.email },
    },
    jogos: jogosRef,
    reviewWitcherId: reviewUsuario.id,
    reviewPortalId: reviewModerador.id,
    bibliotecaWitcherId: itemWitcher.id,
    denunciaId: denuncia.id,
  };
}
