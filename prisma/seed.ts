import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client';
import { WeekDay } from '@prisma/client';
import { text } from 'stream/consumers';
import * as bcrypt from 'bcrypt';

function resolveBcryptRounds(envValue?: string): number {
  const parsed = Number.parseInt(envValue ?? '', 10);

  if (Number.isFinite(parsed) && parsed >= 4 && parsed <= 15) {
    return parsed;
  }

  return 10;
}

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
async function main() {
  // LIMPA BANCO
  await prisma.answer.deleteMany();
  await prisma.alternative.deleteMany();
  await prisma.question.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.studyLog.deleteMany();
  await prisma.path.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.studyDay.deleteMany();
  await prisma.user.deleteMany();

  // =========================
  // USERS
  // =========================
  const bcryptRounds = resolveBcryptRounds(process.env.BCRYPT_ROUNDS);

  const password1Hash = await bcrypt.hash('Admin123', bcryptRounds);
  const password2Hash = await bcrypt.hash('User321', bcryptRounds);
  const password3Hash = await bcrypt.hash('User123', bcryptRounds);

  const user1 = await prisma.user.create({
    data: {
      full_name: 'Aurelio Fagundes',
      email: 'admin@admin.com',
      password: password1Hash,
      phone_number: '51911111111',
      role: Role.ADM,
      birth_date: new Date('1985-03-20'),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      full_name: 'Ana Souza',
      email: 'ana@email.com',
      password: password2Hash,
      phone_number: '51911111114',
      birth_date: new Date('2002-07-12'),
      desired_course: 'Medicina',
      desired_exam: 'Pucrs',
      role: Role.USER,
      coins: 50,
      streak: 3,
      Study_day: {
        create: [
          { day: WeekDay.MONDAY, hour: 10 },
          { day: WeekDay.WEDNESDAY, hour: 15 },
        ],
      },
    },
  });

  const user3 = await prisma.user.create({
    data: {
      full_name: 'Lucas Pereira',
      email: 'lucas@email.com',
      password: password3Hash,
      phone_number: '51922222222',
      birth_date: new Date('2001-11-05'),
      desired_course: 'Engenharia Civil',
      desired_exam: 'UFRGS',
      role: Role.USER,
      coins: 120,
      streak: 7,
      Study_day: {
        create: [
          { day: WeekDay.FRIDAY, hour: 10 },
          { day: WeekDay.FRIDAY, hour: 11 },
        ],
      },
    },
  });

  // =========================
  // SUBJECTS
  // =========================
  const historia = await prisma.subject.create({
    data: {
      name: 'História',
      icon_url: 'https://cdn.exemplo.com/icons/historia.png',
    },
  });

  const matematica = await prisma.subject.create({
    data: {
      name: 'Matemática',
      icon_url: 'https://cdn.exemplo.com/icons/matematica.png',
    },
  });

  const portugues = await prisma.subject.create({
    data: {
      name: 'Português',
      icon_url: 'https://cdn.exemplo.com/icons/portugues.png',
    },
  });

  const geografia = await prisma.subject.create({
    data: {
      name: 'Geografia',
      icon_url: 'https://cdn.exemplo.com/icons/geografia.png',
    },
  });

  const fisica = await prisma.subject.create({
    data: {
      name: 'Física',
      icon_url: 'https://cdn.exemplo.com/icons/fisica.png',
    },
  });

  const quimica = await prisma.subject.create({
    data: {
      name: 'Química',
      icon_url: 'https://cdn.exemplo.com/icons/quimica.png',
    },
  });

  const biologia = await prisma.subject.create({
    data: {
      name: 'Biologia',
      icon_url: 'https://cdn.exemplo.com/icons/biologia.png',
    },
  });

  const filosofia = await prisma.subject.create({
    data: {
      name: 'Filosofia',
      icon_url: 'https://cdn.exemplo.com/icons/filosofia.png',
    },
  });

  const sociologia = await prisma.subject.create({
    data: {
      name: 'Sociologia',
      icon_url: 'https://cdn.exemplo.com/icons/sociologia.png',
    },
  });

  const literatura = await prisma.subject.create({
    data: {
      name: 'Literatura',
      icon_url: 'https://cdn.exemplo.com/icons/literatura.png',
    },
  });

  const ingles = await prisma.subject.create({
    data: {
      name: 'Inglês',
      icon_url: 'https://cdn.exemplo.com/icons/ingles.png',
    },
  });

  const espanhol = await prisma.subject.create({
    data: {
      name: 'Espanhol',
      icon_url: 'https://cdn.exemplo.com/icons/espanhol.png',
    },
  });

  // =========================
  // PATHS COM CONST
  // =========================

  // ---------- História ----------
  const historiaAntiguidade = await prisma.path.create({
    data: {
      name: 'Antiguidade',
      schedule_position: 1,
      trail_position: 1,
      subject_id: historia.id,
      text: 'Estude a história da antiguidade.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const historiaIdadeMedia = await prisma.path.create({
    data: {
      name: 'Idade Média',
      schedule_position: 2,
      trail_position: 2,
      subject_id: historia.id,
      text: 'Estude a história da Idade Média.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const historiaRenascimento = await prisma.path.create({
    data: {
      name: 'Renascimento',
      schedule_position: 3,
      trail_position: 3,
      subject_id: historia.id,
      text: 'Estude o Renascimento.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const historiaEraModerna = await prisma.path.create({
    data: {
      name: 'Era Moderna',
      schedule_position: 4,
      trail_position: 4,
      subject_id: historia.id,
      text: 'Estude a Era Moderna.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const historiaEraContemporanea = await prisma.path.create({
    data: {
      name: 'Era Contemporânea',
      schedule_position: 5,
      trail_position: 5,
      subject_id: historia.id,
      text: 'Estude a Era Contemporânea.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Matemática ----------
  const matematicaBasica = await prisma.path.create({
    data: {
      name: 'Matemática Básica',
      schedule_position: 6,
      trail_position: 1,
      subject_id: matematica.id,
      text: 'Estude os conceitos básicos de matemática.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const matematicaAlgebra = await prisma.path.create({
    data: {
      name: 'Álgebra',
      schedule_position: 7,
      trail_position: 2,
      subject_id: matematica.id,
      text: 'Estude Álgebra.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const matematicaGeometria = await prisma.path.create({
    data: {
      name: 'Geometria',
      schedule_position: 8,
      trail_position: 3,
      subject_id: matematica.id,
      text: 'Estude Geometria.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const matematicaTrigonometria = await prisma.path.create({
    data: {
      name: 'Trigonometria',
      schedule_position: 9,
      trail_position: 4,
      subject_id: matematica.id,
      text: 'Estude Trigonometria.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const matematicaEstatistica = await prisma.path.create({
    data: {
      name: 'Estatística',
      schedule_position: 10,
      trail_position: 5,
      subject_id: matematica.id,
      text: 'Estude Estatística.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Português ----------
  const portuguesInterpretacao = await prisma.path.create({
    data: {
      name: 'Interpretação de Texto',
      schedule_position: 11,
      trail_position: 1,
      subject_id: portugues.id,
      text: 'Estude interpretação de textos.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const portuguesGramaticaAvancada = await prisma.path.create({
    data: {
      name: 'Gramática Avançada',
      schedule_position: 12,
      trail_position: 2,
      subject_id: portugues.id,
      text: 'Estude gramática avançada.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const portuguesRedacao = await prisma.path.create({
    data: {
      name: 'Redação',
      schedule_position: 13,
      trail_position: 3,
      subject_id: portugues.id,
      text: 'Estude técnicas de redação.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const portuguesLiteraturaBrasileira = await prisma.path.create({
    data: {
      name: 'Literatura Brasileira',
      schedule_position: 14,
      trail_position: 4,
      subject_id: portugues.id,
      text: 'Estude literatura brasileira.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const portuguesLiteraturaPortuguesa = await prisma.path.create({
    data: {
      name: 'Literatura Portuguesa',
      schedule_position: 15,
      trail_position: 5,
      subject_id: portugues.id,
      text: 'Estude literatura portuguesa.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Geografia ----------
  const geografiaCartografia = await prisma.path.create({
    data: {
      name: 'Cartografia',
      schedule_position: 16,
      trail_position: 1,
      subject_id: geografia.id,
      text: 'Estude cartografia.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const geografiaFisica = await prisma.path.create({
    data: {
      name: 'Geografia Física',
      schedule_position: 17,
      trail_position: 2,
      subject_id: geografia.id,
      text: 'Estude geografia física.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const geografiaHumana = await prisma.path.create({
    data: {
      name: 'Geografia Humana',
      schedule_position: 18,
      trail_position: 3,
      subject_id: geografia.id,
      text: 'Estude geografia humana.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const geografiaClimatologia = await prisma.path.create({
    data: {
      name: 'Climatologia',
      schedule_position: 19,
      trail_position: 4,
      subject_id: geografia.id,
      text: 'Estude climatologia.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const geografiaGeomorfologia = await prisma.path.create({
    data: {
      name: 'Geomorfologia',
      schedule_position: 20,
      trail_position: 5,
      subject_id: geografia.id,
      text: 'Estude geomorfologia.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Física ----------
  const fisicaMecanica = await prisma.path.create({
    data: {
      name: 'Mecânica',
      schedule_position: 21,
      trail_position: 1,
      subject_id: fisica.id,
      text: 'Estude mecânica.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const fisicaTermodinamica = await prisma.path.create({
    data: {
      name: 'Termodinâmica',
      schedule_position: 22,
      trail_position: 2,
      subject_id: fisica.id,
      text: 'Estude termodinâmica.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const fisicaOndulatoria = await prisma.path.create({
    data: {
      name: 'Ondulatória',
      schedule_position: 23,
      trail_position: 3,
      subject_id: fisica.id,
      text: 'Estude ondulatória.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const fisicaEletromagnetismo = await prisma.path.create({
    data: {
      name: 'Eletromagnetismo',
      schedule_position: 24,
      trail_position: 4,
      subject_id: fisica.id,
      text: 'Estude eletromagnetismo.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const fisicaOptica = await prisma.path.create({
    data: {
      name: 'Óptica',
      schedule_position: 25,
      trail_position: 5,
      subject_id: fisica.id,
      text: 'Estude óptica.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Química ----------
  const quimicaModelosAtomicos = await prisma.path.create({
    data: {
      name: 'Modelos Atômicos',
      schedule_position: 26,
      trail_position: 1,
      subject_id: quimica.id,
      text: 'Estude modelos atômicos.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const quimicaLigacoes = await prisma.path.create({
    data: {
      name: 'Ligações Químicas',
      schedule_position: 27,
      trail_position: 2,
      subject_id: quimica.id,
      text: 'Estude ligações químicas.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const quimicaTermoquimica = await prisma.path.create({
    data: {
      name: 'Termoquímica',
      schedule_position: 28,
      trail_position: 3,
      subject_id: quimica.id,
      text: 'Estude termoquímica.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const quimicaCinetica = await prisma.path.create({
    data: {
      name: 'Cinética Química',
      schedule_position: 29,
      trail_position: 4,
      subject_id: quimica.id,
      text: 'Estude cinética química.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const quimicaOrganica = await prisma.path.create({
    data: {
      name: 'Química Orgânica',
      schedule_position: 30,
      trail_position: 5,
      subject_id: quimica.id,
      text: 'Estude química orgânica.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Biologia ----------
  const biologiaBioquimica = await prisma.path.create({
    data: {
      name: 'Bioquímica',
      schedule_position: 31,
      trail_position: 1,
      subject_id: biologia.id,
      text: 'Estude bioquímica.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const biologiaGenetica = await prisma.path.create({
    data: {
      name: 'Genética',
      schedule_position: 32,
      trail_position: 2,
      subject_id: biologia.id,
      text: 'Estude genética.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const biologiaEcologia = await prisma.path.create({
    data: {
      name: 'Ecologia',
      schedule_position: 33,
      trail_position: 3,
      subject_id: biologia.id,
      text: 'Estude ecologia.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const biologiaMicrobiologia = await prisma.path.create({
    data: {
      name: 'Microbiologia',
      schedule_position: 34,
      trail_position: 4,
      subject_id: biologia.id,
      text: 'Estude microbiologia.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const biologiaZoologia = await prisma.path.create({
    data: {
      name: 'Zoologia',
      schedule_position: 35,
      trail_position: 5,
      subject_id: biologia.id,
      text: 'Estude zoologia.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Filosofia ----------
  const filosofiaAntiga = await prisma.path.create({
    data: {
      name: 'Filosofia Antiga',
      schedule_position: 36,
      trail_position: 1,
      subject_id: filosofia.id,
      text: 'Estude filosofia antiga.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const filosofiaMedieval = await prisma.path.create({
    data: {
      name: 'Filosofia Medieval',
      schedule_position: 37,
      trail_position: 2,
      subject_id: filosofia.id,
      text: 'Estude filosofia medieval.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const filosofiaModerna = await prisma.path.create({
    data: {
      name: 'Filosofia Moderna',
      schedule_position: 38,
      trail_position: 3,
      subject_id: filosofia.id,
      text: 'Estude filosofia moderna.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const filosofiaContemporanea = await prisma.path.create({
    data: {
      name: 'Filosofia Contemporânea',
      schedule_position: 39,
      trail_position: 4,
      subject_id: filosofia.id,
      text: 'Estude filosofia contemporânea.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const filosofiaEtica = await prisma.path.create({
    data: {
      name: 'Ética',
      schedule_position: 40,
      trail_position: 5,
      subject_id: filosofia.id,
      text: 'Estude ética.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Sociologia ----------
  const sociologiaCultura = await prisma.path.create({
    data: {
      name: 'Cultura',
      schedule_position: 41,
      trail_position: 1,
      subject_id: sociologia.id,
      text: 'Estude cultura.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const sociologiaEstrutura = await prisma.path.create({
    data: {
      name: 'Estrutura Social',
      schedule_position: 42,
      trail_position: 2,
      subject_id: sociologia.id,
      text: 'Estude estrutura social.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const sociologiaMovimentos = await prisma.path.create({
    data: {
      name: 'Movimentos Sociais',
      schedule_position: 43,
      trail_position: 3,
      subject_id: sociologia.id,
      text: 'Estude movimentos sociais.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const sociologiaInstituicoes = await prisma.path.create({
    data: {
      name: 'Instituições',
      schedule_position: 44,
      trail_position: 4,
      subject_id: sociologia.id,
      text: 'Estude instituições.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const sociologiaGlobalizacao = await prisma.path.create({
    data: {
      name: 'Globalização',
      schedule_position: 45,
      trail_position: 5,
      subject_id: sociologia.id,
      text: 'Estude globalização.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Literatura ----------
  const literaturaEscolas = await prisma.path.create({
    data: {
      name: 'Escolas Literárias',
      schedule_position: 46,
      trail_position: 1,
      subject_id: literatura.id,
      text: 'Estude escolas literárias.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const literaturaPoesia = await prisma.path.create({
    data: {
      name: 'Poesia',
      schedule_position: 47,
      trail_position: 2,
      subject_id: literatura.id,
      text: 'Estude poesia.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const literaturaProsa = await prisma.path.create({
    data: {
      name: 'Prosa',
      schedule_position: 48,
      trail_position: 3,
      subject_id: literatura.id,
      text: 'Estude prosa.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const literaturaTeatro = await prisma.path.create({
    data: {
      name: 'Teatro',
      schedule_position: 49,
      trail_position: 4,
      subject_id: literatura.id,
      text: 'Estude teatro.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const literaturaCritica = await prisma.path.create({
    data: {
      name: 'Crítica Literária',
      schedule_position: 50,
      trail_position: 5,
      subject_id: literatura.id,
      text: 'Estude crítica literária.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Inglês ----------
  const inglesGramatica = await prisma.path.create({
    data: {
      name: 'Gramática Básica',
      schedule_position: 51,
      trail_position: 1,
      subject_id: ingles.id,
      text: 'Estude gramática básica em inglês.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const inglesVocabulário = await prisma.path.create({
    data: {
      name: 'Vocabulário',
      schedule_position: 52,
      trail_position: 2,
      subject_id: ingles.id,
      text: 'Estude vocabulário em inglês.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const inglesLeitura = await prisma.path.create({
    data: {
      name: 'Leitura e Interpretação',
      schedule_position: 53,
      trail_position: 3,
      subject_id: ingles.id,
      text: 'Estude leitura e interpretação em inglês.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const inglesConversacao = await prisma.path.create({
    data: {
      name: 'Conversação',
      schedule_position: 54,
      trail_position: 4,
      subject_id: ingles.id,
      text: 'Pratique conversação em inglês.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const inglesEscrita = await prisma.path.create({
    data: {
      name: 'Escrita',
      schedule_position: 55,
      trail_position: 5,
      subject_id: ingles.id,
      text: 'Pratique escrita em inglês.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // ---------- Espanhol ----------
  const espanholGramatica = await prisma.path.create({
    data: {
      name: 'Gramática Básica',
      schedule_position: 56,
      trail_position: 1,
      subject_id: espanhol.id,
      text: 'Estude gramática básica em espanhol.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const espanholVocabulário = await prisma.path.create({
    data: {
      name: 'Vocabulário',
      schedule_position: 57,
      trail_position: 2,
      subject_id: espanhol.id,
      text: 'Estude vocabulário em espanhol.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const espanholLeitura = await prisma.path.create({
    data: {
      name: 'Leitura e Interpretação',
      schedule_position: 58,
      trail_position: 3,
      subject_id: espanhol.id,
      text: 'Estude leitura e interpretação em espanhol.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const espanholConversacao = await prisma.path.create({
    data: {
      name: 'Conversação',
      schedule_position: 59,
      trail_position: 4,
      subject_id: espanhol.id,
      text: 'Pratique conversação em espanhol.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });
  const espanholEscrita = await prisma.path.create({
    data: {
      name: 'Escrita',
      schedule_position: 60,
      trail_position: 5,
      subject_id: espanhol.id,
      text: 'Pratique escrita em espanhol.',
      icon_url: 'https://cdn.com/default-path-icon.png',
    },
  });

  // =========================
  // QUESTIONS
  // =========================

  const allPaths = [
    // História
    historiaAntiguidade,
    historiaIdadeMedia,
    historiaRenascimento,
    historiaEraModerna,
    historiaEraContemporanea,
    // Matemática
    matematicaBasica,
    matematicaAlgebra,
    matematicaGeometria,
    matematicaTrigonometria,
    matematicaEstatistica,
    // Português
    portuguesInterpretacao,
    portuguesGramaticaAvancada,
    portuguesRedacao,
    portuguesLiteraturaBrasileira,
    portuguesLiteraturaPortuguesa,
    // Geografia
    geografiaCartografia,
    geografiaFisica,
    geografiaHumana,
    geografiaClimatologia,
    geografiaGeomorfologia,
    // Física
    fisicaMecanica,
    fisicaTermodinamica,
    fisicaOndulatoria,
    fisicaEletromagnetismo,
    fisicaOptica,
    // Química
    quimicaModelosAtomicos,
    quimicaLigacoes,
    quimicaTermoquimica,
    quimicaCinetica,
    quimicaOrganica,
    // Biologia
    biologiaBioquimica,
    biologiaGenetica,
    biologiaEcologia,
    biologiaMicrobiologia,
    biologiaZoologia,
    // Filosofia
    filosofiaAntiga,
    filosofiaMedieval,
    filosofiaModerna,
    filosofiaContemporanea,
    filosofiaEtica,
    // Sociologia
    sociologiaCultura,
    sociologiaEstrutura,
    sociologiaMovimentos,
    sociologiaInstituicoes,
    sociologiaGlobalizacao,
    // Literatura
    literaturaEscolas,
    literaturaPoesia,
    literaturaProsa,
    literaturaTeatro,
    literaturaCritica,
    // Inglês
    inglesGramatica,
    inglesVocabulário,
    inglesLeitura,
    inglesConversacao,
    inglesEscrita,
    // Espanhol
    espanholGramatica,
    espanholVocabulário,
    espanholLeitura,
    espanholConversacao,
    espanholEscrita,
  ];

  // Função auxiliar para gerar número aleatório entre min e max (inclusive)
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Função para criar alternativas genéricas (a primeira é a correta)
  function generateAlternatives(correctText, wrongTexts) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const alternatives = [
      { text: correctText, letter: letters[0], is_correct: true },
      ...wrongTexts.map((text, idx) => ({
        text,
        letter: letters[idx + 1],
        is_correct: false,
      })),
    ];
    return alternatives;
  }

  // Percorre cada path e cria as questões
  for (const path of allPaths) {
    // Quantidade de questões ORIGINAL e EXTERNAL (1 a 3 cada)
    const numOriginal = rand(1, 3);
    const numExternal = rand(1, 3);

    // Questões ORIGINAL
    for (let i = 0; i < numOriginal; i++) {
      await prisma.question.create({
        data: {
          text: `Questão ORIGINAL sobre ${path.name}: Qual dos seguintes conceitos é fundamental para o estudo de "${path.name}"?`,
          origin: 'ORIGINAL',
          year: 2024,
          feedback: `Revise os principais tópicos de ${path.name}.`,
          path_id: path.id,
          alternatives: {
            create: generateAlternatives(`Conceito correto de ${path.name} (versão ${i + 1})`, [
              `Conceito errado A para ${path.name}`,
              `Conceito errado B para ${path.name}`,
              `Conceito errado C para ${path.name}`,
              `Conceito errado D para ${path.name}`,
            ]),
          },
        },
      });
    }

    // Questões EXTERNAL
    for (let i = 0; i < numExternal; i++) {
      await prisma.question.create({
        data: {
          text: `Questão EXTERNAL sobre ${path.name}: Em relação a "${path.name}", assinale a alternativa que melhor descreve uma aplicação prática.`,
          origin: 'EXTERNAL',
          year: 2023, // Ano fictício para external
          feedback: `Consulte fontes externas sobre ${path.name}.`,
          path_id: path.id,
          alternatives: {
            create: generateAlternatives(`Aplicação correta de ${path.name} (versão ${i + 1})`, [
              `Aplicação errada X para ${path.name}`,
              `Aplicação errada Y para ${path.name}`,
              `Aplicação errada Z para ${path.name}`,
              `Aplicação errada W para ${path.name}`,
            ]),
          },
        },
      });
    }
  }

  console.log('Questões criadas com sucesso para todos os paths!');

  // Lista de usuários
  const users = [user2, user3];

  // Para cada usuário
  for (const user of users) {
    // Quantidade de questões que ele vai responder
    const numQuestions = rand(20, 25);

    // Pega todas as questões do banco
    const allQuestions = await prisma.question.findMany();

    // Embaralha as questões
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);

    // Pega apenas o número sorteado de questões
    const questionsToAnswer = shuffledQuestions.slice(0, numQuestions);

    // Para cada questão, cria uma resposta aleatória
    for (const question of questionsToAnswer) {
      // Pega as alternativas da questão
      const alternatives = await prisma.alternative.findMany({
        where: { question_id: question.id },
      });

      // Escolhe uma alternativa aleatória
      const chosenAlternative = alternatives[rand(0, alternatives.length - 1)];

      // Cria a resposta
      await prisma.answer.create({
        data: {
          user_id: user.id,
          question_id: question.id,
          alternative_id: chosenAlternative.id,
          answer_date: new Date(),
        },
      });
    }
  }

  console.log('Respostas aleatórias criadas para os usuários!');

  const q3 = await prisma.question.create({
    data: {
      text: 'Qual é a fórmula da água?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Revise este conteúdo.',
      day: 1,
      number: 1,
      path_id: quimicaModelosAtomicos.id,
      alternatives: {
        create: [
          { text: 'CO2', letter: 'A', is_correct: false },
          { text: 'H2O', letter: 'B', is_correct: true },
          { text: 'O2', letter: 'C', is_correct: false },
          { text: 'NaCl', letter: 'D', is_correct: false },
          { text: 'CH4', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const q4 = await prisma.question.create({
    data: {
      text: 'Qual planeta é conhecido como planeta vermelho?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Revise este conteúdo.',
      day: 2,
      number: 2,
      path_id: fisicaOndulatoria.id,
      alternatives: {
        create: [
          { text: 'Terra', letter: 'A', is_correct: false },
          { text: 'Marte', letter: 'B', is_correct: true },
          { text: 'Júpiter', letter: 'C', is_correct: false },
          { text: 'Vênus', letter: 'D', is_correct: false },
          { text: 'Saturno', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const exam1 = await prisma.exam.create({
    data: {
      name: 'Simulado Geral 1',
      origin: 'ORIGINAL',
      image_url: 'https://example.com/exam1.png',
      questions: {
        connect: [{ id: q3!.id }, { id: q4!.id }],
      },
    },
  });

  const attempt1 = await prisma.attempt.create({
    data: {
      time_spent_minutes: 0,
      current_question: 2,
      language: 'ENGLISH',
      init_time: new Date(),
      exam_id: exam1.id,
      user_id: user2.id,
    },
  });

  const q = await prisma.question.findFirst({
    where: { text: 'Qual é a fórmula da água?' },
    include: { alternatives: true },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: q!.id,
      alternative_id: q!.alternatives.find((a) => a.text === 'CO2')!.id,
      attempt_id: attempt1.id,
      answer_date: new Date('2026-03-27T10:00:00'),
    },
  });

  await prisma.studyLog.create({
    data: {
      user_id: user2.id,
      path_id: fisicaOndulatoria.id,
      date: new Date('2026-03-27T10:00:00'),
      done: false,
    },
  });

  await prisma.studyLog.create({
    data: {
      user_id: user2.id,
      path_id: matematicaBasica.id,
      date: new Date('2026-03-27T11:00:00'),
      done: false,
    },
  });

  console.log('Seed completed');
}
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
