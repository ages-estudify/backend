import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Language, Origin, PrismaClient } from '@prisma/client';
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

function makeAlternatives(correctLetter: string) {
  const letters = ['A', 'B', 'C', 'D', 'E'];

  return letters.map((letter) => ({
    letter,
    text: `Alternativa ${letter}`,
    is_correct: letter === correctLetter,
  }));
}

const connectionString = `${process.env.DATABASE_URL}`;
const ICON_BASE_URL = '/icons/topics';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
async function main() {
  await prisma.answer.deleteMany();
  await prisma.attemptDay.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.alternative.deleteMany();
  await prisma.question.deleteMany();
  await prisma.examDay.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.studyLog.deleteMany();
  await prisma.studyDay.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.path.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.refreshToken.deleteMany();
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
      plan_end_date: new Date('2030-12-31'),
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
      plan_end_date: new Date('2030-12-31'),
      phone_number: '51911111114',
      birth_date: new Date('2002-07-12'),
      desired_course: 'Medicina',
      desired_university: 'Pucrs',
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
      plan_end_date: new Date('2030-12-31'),
      desired_course: 'Engenharia Civil',
      desired_university: 'UFRGS',
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
      icon_url: `${ICON_BASE_URL}/historia-antiguidade.png`,
    },
  });
  const historiaIdadeMedia = await prisma.path.create({
    data: {
      name: 'Idade Média',
      schedule_position: 2,
      trail_position: 2,
      subject_id: historia.id,
      text: 'Estude a história da Idade Média.',
      icon_url: `${ICON_BASE_URL}/historia-idade-media.png`,
    },
  });
  const historiaRenascimento = await prisma.path.create({
    data: {
      name: 'Renascimento',
      schedule_position: 3,
      trail_position: 3,
      subject_id: historia.id,
      text: 'Estude o Renascimento.',
      icon_url: `${ICON_BASE_URL}/historia-renascimento.png`,
    },
  });
  const historiaEraModerna = await prisma.path.create({
    data: {
      name: 'Era Moderna',
      schedule_position: 4,
      trail_position: 4,
      subject_id: historia.id,
      text: 'Estude a Era Moderna.',
      icon_url: `${ICON_BASE_URL}/historia-era-moderna.png`,
    },
  });
  const historiaEraContemporanea = await prisma.path.create({
    data: {
      name: 'Era Contemporânea',
      schedule_position: 5,
      trail_position: 5,
      subject_id: historia.id,
      text: 'Estude a Era Contemporânea.',
      icon_url: `${ICON_BASE_URL}/historia-era-contemporanea.png`,
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
      icon_url: `${ICON_BASE_URL}/matematica-basica.png`,
    },
  });
  const matematicaAlgebra = await prisma.path.create({
    data: {
      name: 'Álgebra',
      schedule_position: 7,
      trail_position: 2,
      subject_id: matematica.id,
      text: 'Estude Álgebra.',
      icon_url: `${ICON_BASE_URL}/matematica-algebra.png`,
    },
  });
  const matematicaGeometria = await prisma.path.create({
    data: {
      name: 'Geometria',
      schedule_position: 8,
      trail_position: 3,
      subject_id: matematica.id,
      text: 'Estude Geometria.',
      icon_url: `${ICON_BASE_URL}/matematica-geometria.png`,
    },
  });
  const matematicaTrigonometria = await prisma.path.create({
    data: {
      name: 'Trigonometria',
      schedule_position: 9,
      trail_position: 4,
      subject_id: matematica.id,
      text: 'Estude Trigonometria.',
      icon_url: `${ICON_BASE_URL}/matematica-trigonometria.png`,
    },
  });
  const matematicaEstatistica = await prisma.path.create({
    data: {
      name: 'Estatística',
      schedule_position: 10,
      trail_position: 5,
      subject_id: matematica.id,
      text: 'Estude Estatística.',
      icon_url: `${ICON_BASE_URL}/matematica-estatistica.png`,
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
      icon_url: `${ICON_BASE_URL}/portugues-interpretacao-de-texto.png`,
    },
  });
  const portuguesGramaticaAvancada = await prisma.path.create({
    data: {
      name: 'Gramática Avançada',
      schedule_position: 12,
      trail_position: 2,
      subject_id: portugues.id,
      text: 'Estude gramática avançada.',
      icon_url: `${ICON_BASE_URL}/portugues-gramatica-avancada.png`,
    },
  });
  const portuguesRedacao = await prisma.path.create({
    data: {
      name: 'Redação',
      schedule_position: 13,
      trail_position: 3,
      subject_id: portugues.id,
      text: 'Estude técnicas de redação.',
      icon_url: `${ICON_BASE_URL}/portugues-redacao.png`,
    },
  });
  const portuguesCrase = await prisma.path.create({
    data: {
      name: 'Crase',
      schedule_position: 14,
      trail_position: 4,
      subject_id: portugues.id,
      text: 'Estude o uso da crase.',
      icon_url: `${ICON_BASE_URL}/portugues-crase.png`,
    },
  });
  const portuguesPorques = await prisma.path.create({
    data: {
      name: 'Porquês',
      schedule_position: 15,
      trail_position: 5,
      subject_id: portugues.id,
      text: 'Estude o uso dos porquês.',
      icon_url: `${ICON_BASE_URL}/portugues-porques.png`,
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
      icon_url: `${ICON_BASE_URL}/geografia-cartografia.png`,
    },
  });
  const geografiaFisica = await prisma.path.create({
    data: {
      name: 'Geografia Física',
      schedule_position: 17,
      trail_position: 2,
      subject_id: geografia.id,
      text: 'Estude geografia física.',
      icon_url: `${ICON_BASE_URL}/geografia-fisica.png`,
    },
  });
  const geografiaHumana = await prisma.path.create({
    data: {
      name: 'Geografia Humana',
      schedule_position: 18,
      trail_position: 3,
      subject_id: geografia.id,
      text: 'Estude geografia humana.',
      icon_url: `${ICON_BASE_URL}/geografia-humana.png`,
    },
  });
  const geografiaClimatologia = await prisma.path.create({
    data: {
      name: 'Climatologia',
      schedule_position: 19,
      trail_position: 4,
      subject_id: geografia.id,
      text: 'Estude climatologia.',
      icon_url: `${ICON_BASE_URL}/geografia-climatologia.png`,
    },
  });
  const geografiaGeomorfologia = await prisma.path.create({
    data: {
      name: 'Geomorfologia',
      schedule_position: 20,
      trail_position: 5,
      subject_id: geografia.id,
      text: 'Estude geomorfologia.',
      icon_url: `${ICON_BASE_URL}/geografia-geomorfologia.png`,
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
      icon_url: `${ICON_BASE_URL}/fisica-mecanica.png`,
    },
  });
  const fisicaTermodinamica = await prisma.path.create({
    data: {
      name: 'Termodinâmica',
      schedule_position: 22,
      trail_position: 2,
      subject_id: fisica.id,
      text: 'Estude termodinâmica.',
      icon_url: `${ICON_BASE_URL}/fisica-termodinamica.png`,
    },
  });
  const fisicaOndulatoria = await prisma.path.create({
    data: {
      name: 'Ondulatória',
      schedule_position: 23,
      trail_position: 3,
      subject_id: fisica.id,
      text: 'Estude ondulatória.',
      icon_url: `${ICON_BASE_URL}/fisica-ondulatoria.png`,
    },
  });
  const fisicaEletromagnetismo = await prisma.path.create({
    data: {
      name: 'Eletromagnetismo',
      schedule_position: 24,
      trail_position: 4,
      subject_id: fisica.id,
      text: 'Estude eletromagnetismo.',
      icon_url: `${ICON_BASE_URL}/fisica-eletromagnetismo.png`,
    },
  });
  const fisicaOptica = await prisma.path.create({
    data: {
      name: 'Óptica',
      schedule_position: 25,
      trail_position: 5,
      subject_id: fisica.id,
      text: 'Estude óptica.',
      icon_url: `${ICON_BASE_URL}/fisica-optica.png`,
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
      icon_url: `${ICON_BASE_URL}/quimica-modelos-atomicos.png`,
    },
  });
  const quimicaLigacoes = await prisma.path.create({
    data: {
      name: 'Ligações Químicas',
      schedule_position: 27,
      trail_position: 2,
      subject_id: quimica.id,
      text: 'Estude ligações químicas.',
      icon_url: `${ICON_BASE_URL}/quimica-ligacoes-quimicas.png`,
    },
  });
  const quimicaTermoquimica = await prisma.path.create({
    data: {
      name: 'Termoquímica',
      schedule_position: 28,
      trail_position: 3,
      subject_id: quimica.id,
      text: 'Estude termoquímica.',
      icon_url: `${ICON_BASE_URL}/quimica-termoquimica.png`,
    },
  });
  const quimicaCinetica = await prisma.path.create({
    data: {
      name: 'Cinética Química',
      schedule_position: 29,
      trail_position: 4,
      subject_id: quimica.id,
      text: 'Estude cinética química.',
      icon_url: `${ICON_BASE_URL}/quimica-cinetica-quimica.png`,
    },
  });
  const quimicaOrganica = await prisma.path.create({
    data: {
      name: 'Química Orgânica',
      schedule_position: 30,
      trail_position: 5,
      subject_id: quimica.id,
      text: 'Estude química orgânica.',
      icon_url: `${ICON_BASE_URL}/quimica-organica.png`,
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
      icon_url: `${ICON_BASE_URL}/biologia-bioquimica.png`,
    },
  });
  const biologiaGenetica = await prisma.path.create({
    data: {
      name: 'Genética',
      schedule_position: 32,
      trail_position: 2,
      subject_id: biologia.id,
      text: 'Estude genética.',
      icon_url: `${ICON_BASE_URL}/biologia-genetica.png`,
    },
  });
  const biologiaEcologia = await prisma.path.create({
    data: {
      name: 'Ecologia',
      schedule_position: 33,
      trail_position: 3,
      subject_id: biologia.id,
      text: 'Estude ecologia.',
      icon_url: `${ICON_BASE_URL}/biologia-ecologia.png`,
    },
  });
  const biologiaMicrobiologia = await prisma.path.create({
    data: {
      name: 'Microbiologia',
      schedule_position: 34,
      trail_position: 4,
      subject_id: biologia.id,
      text: 'Estude microbiologia.',
      icon_url: `${ICON_BASE_URL}/biologia-microbiologia.png`,
    },
  });
  const biologiaZoologia = await prisma.path.create({
    data: {
      name: 'Zoologia',
      schedule_position: 35,
      trail_position: 5,
      subject_id: biologia.id,
      text: 'Estude zoologia.',
      icon_url: `${ICON_BASE_URL}/biologia-zoologia.png`,
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
      icon_url: `${ICON_BASE_URL}/filosofia-antiga.png`,
    },
  });
  const filosofiaMedieval = await prisma.path.create({
    data: {
      name: 'Filosofia Medieval',
      schedule_position: 37,
      trail_position: 2,
      subject_id: filosofia.id,
      text: 'Estude filosofia medieval.',
      icon_url: `${ICON_BASE_URL}/filosofia-medieval.png`,
    },
  });
  const filosofiaModerna = await prisma.path.create({
    data: {
      name: 'Filosofia Moderna',
      schedule_position: 38,
      trail_position: 3,
      subject_id: filosofia.id,
      text: 'Estude filosofia moderna.',
      icon_url: `${ICON_BASE_URL}/filosofia-moderna.png`,
    },
  });
  const filosofiaContemporanea = await prisma.path.create({
    data: {
      name: 'Filosofia Contemporânea',
      schedule_position: 39,
      trail_position: 4,
      subject_id: filosofia.id,
      text: 'Estude filosofia contemporânea.',
      icon_url: `${ICON_BASE_URL}/filosofia-contemporanea.png`,
    },
  });
  const filosofiaEtica = await prisma.path.create({
    data: {
      name: 'Ética',
      schedule_position: 40,
      trail_position: 5,
      subject_id: filosofia.id,
      text: 'Estude ética.',
      icon_url: `${ICON_BASE_URL}/filosofia-etica.png`,
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
      icon_url: `${ICON_BASE_URL}/sociologia-cultura.png`,
    },
  });
  const sociologiaEstrutura = await prisma.path.create({
    data: {
      name: 'Estrutura Social',
      schedule_position: 42,
      trail_position: 2,
      subject_id: sociologia.id,
      text: 'Estude estrutura social.',
      icon_url: `${ICON_BASE_URL}/sociologia-estrutura-social.png`,
    },
  });
  const sociologiaMovimentos = await prisma.path.create({
    data: {
      name: 'Movimentos Sociais',
      schedule_position: 43,
      trail_position: 3,
      subject_id: sociologia.id,
      text: 'Estude movimentos sociais.',
      icon_url: `${ICON_BASE_URL}/sociologia-movimentos-sociais.png`,
    },
  });
  const sociologiaInstituicoes = await prisma.path.create({
    data: {
      name: 'Instituições',
      schedule_position: 44,
      trail_position: 4,
      subject_id: sociologia.id,
      text: 'Estude instituições.',
      icon_url: `${ICON_BASE_URL}/sociologia-instituicoes.png`,
    },
  });
  const sociologiaGlobalizacao = await prisma.path.create({
    data: {
      name: 'Globalização',
      schedule_position: 45,
      trail_position: 5,
      subject_id: sociologia.id,
      text: 'Estude globalização.',
      icon_url: `${ICON_BASE_URL}/sociologia-globalizacao.png`,
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
      icon_url: `${ICON_BASE_URL}/literatura-escolas-literarias.png`,
    },
  });
  const literaturaPoesia = await prisma.path.create({
    data: {
      name: 'Poesia',
      schedule_position: 47,
      trail_position: 2,
      subject_id: literatura.id,
      text: 'Estude poesia.',
      icon_url: `${ICON_BASE_URL}/literatura-poesia.png`,
    },
  });
  const literaturaProsa = await prisma.path.create({
    data: {
      name: 'Prosa',
      schedule_position: 48,
      trail_position: 3,
      subject_id: literatura.id,
      text: 'Estude prosa.',
      icon_url: `${ICON_BASE_URL}/literatura-prosa.png`,
    },
  });
  const literaturaTeatro = await prisma.path.create({
    data: {
      name: 'Teatro',
      schedule_position: 49,
      trail_position: 4,
      subject_id: literatura.id,
      text: 'Estude teatro.',
      icon_url: `${ICON_BASE_URL}/literatura-teatro.png`,
    },
  });
  const literaturaCritica = await prisma.path.create({
    data: {
      name: 'Crítica Literária',
      schedule_position: 50,
      trail_position: 5,
      subject_id: literatura.id,
      text: 'Estude crítica literária.',
      icon_url: `${ICON_BASE_URL}/literatura-critica-literaria.png`,
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
      icon_url: `${ICON_BASE_URL}/ingles-gramatica-basica.png`,
    },
  });
  const inglesVocabulário = await prisma.path.create({
    data: {
      name: 'Vocabulário',
      schedule_position: 52,
      trail_position: 2,
      subject_id: ingles.id,
      text: 'Estude vocabulário em inglês.',
      icon_url: `${ICON_BASE_URL}/ingles-vocabulario.png`,
    },
  });
  const inglesLeitura = await prisma.path.create({
    data: {
      name: 'Leitura e Interpretação',
      schedule_position: 53,
      trail_position: 3,
      subject_id: ingles.id,
      text: 'Estude leitura e interpretação em inglês.',
      icon_url: `${ICON_BASE_URL}/ingles-leitura-e-interpretacao.png`,
    },
  });
  const inglesConversacao = await prisma.path.create({
    data: {
      name: 'Conversação',
      schedule_position: 54,
      trail_position: 4,
      subject_id: ingles.id,
      text: 'Pratique conversação em inglês.',
      icon_url: `${ICON_BASE_URL}/ingles-conversacao.png`,
    },
  });
  const inglesEscrita = await prisma.path.create({
    data: {
      name: 'Escrita',
      schedule_position: 55,
      trail_position: 5,
      subject_id: ingles.id,
      text: 'Pratique escrita em inglês.',
      icon_url: `${ICON_BASE_URL}/ingles-escrita.png`,
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
      icon_url: `${ICON_BASE_URL}/espanhol-gramatica-basica.png`,
    },
  });
  const espanholVocabulário = await prisma.path.create({
    data: {
      name: 'Vocabulário',
      schedule_position: 57,
      trail_position: 2,
      subject_id: espanhol.id,
      text: 'Estude vocabulário em espanhol.',
      icon_url: `${ICON_BASE_URL}/espanhol-vocabulario.png`,
    },
  });
  const espanholLeitura = await prisma.path.create({
    data: {
      name: 'Leitura e Interpretação',
      schedule_position: 58,
      trail_position: 3,
      subject_id: espanhol.id,
      text: 'Estude leitura e interpretação em espanhol.',
      icon_url: `${ICON_BASE_URL}/espanhol-leitura-e-interpretacao.png`,
    },
  });
  const espanholConversacao = await prisma.path.create({
    data: {
      name: 'Conversação',
      schedule_position: 59,
      trail_position: 4,
      subject_id: espanhol.id,
      text: 'Pratique conversação em espanhol.',
      icon_url: `${ICON_BASE_URL}/espanhol-conversacao.png`,
    },
  });
  const espanholEscrita = await prisma.path.create({
    data: {
      name: 'Escrita',
      schedule_position: 60,
      trail_position: 5,
      subject_id: espanhol.id,
      text: 'Pratique escrita em espanhol.',
      icon_url: `${ICON_BASE_URL}/espanhol-escrita.png`,
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
    portuguesCrase,
    portuguesPorques,
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
  function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Função para criar alternativas genéricas (a primeira é a correta)
  function generateAlternatives(correctText: string, wrongTexts: string[]): any[] {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const alternatives = [
      { text: correctText, letter: letters[0], is_correct: true },
      ...wrongTexts.map((text: string, idx: number) => ({
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

  // Questões de matemática adicionais para testes manuais
  const mathQuestion1 = await prisma.question.create({
    data: {
      text: 'Resolva 2 + 2.',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'A soma simples é a base para calcular expressões maiores.',
      number: 1,
      path_id: matematicaBasica.id,
      alternatives: {
        create: [
          { text: '3', letter: 'A', is_correct: false },
          { text: '4', letter: 'B', is_correct: true },
          { text: '5', letter: 'C', is_correct: false },
          { text: '6', letter: 'D', is_correct: false },
          { text: '8', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion2 = await prisma.question.create({
    data: {
      text: 'Qual é a solução da equação x + 3 = 7?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Equações do 1º grau exigem isolamento do x.',
      number: 2,
      path_id: matematicaAlgebra.id,
      alternatives: {
        create: [
          { text: '3', letter: 'A', is_correct: false },
          { text: '4', letter: 'B', is_correct: true },
          { text: '7', letter: 'C', is_correct: false },
          { text: '10', letter: 'D', is_correct: false },
          { text: '0', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion3 = await prisma.question.create({
    data: {
      text: 'Em geometria, qual figura tem 4 lados iguais e 4 ângulos retos?',
      origin: 'EXTERNAL',
      year: 2023,
      feedback: 'Considere propriedades de quadriláteros.',
      number: 3,
      path_id: matematicaGeometria.id,
      alternatives: {
        create: [
          { text: 'Losango', letter: 'A', is_correct: false },
          { text: 'Retângulo', letter: 'B', is_correct: false },
          { text: 'Quadrado', letter: 'C', is_correct: true },
          { text: 'Trapézio', letter: 'D', is_correct: false },
          { text: 'Paralelogramo', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion4 = await prisma.question.create({
    data: {
      text: 'Qual é o seno de um ângulo de 90º?',
      origin: 'EXTERNAL',
      year: 2023,
      feedback: 'Revise os valores básicos das funções trigonométricas.',
      number: 4,
      path_id: matematicaTrigonometria.id,
      alternatives: {
        create: [
          { text: '0', letter: 'A', is_correct: false },
          { text: '1', letter: 'B', is_correct: true },
          { text: '-1', letter: 'C', is_correct: false },
          { text: '0.5', letter: 'D', is_correct: false },
          { text: '√2/2', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion5 = await prisma.question.create({
    data: {
      text: 'Quanto é 5 x 6?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Multiplicação básica.',
      number: 1,
      path_id: matematicaBasica.id,
      alternatives: {
        create: [
          { text: '25', letter: 'A', is_correct: false },
          { text: '30', letter: 'B', is_correct: true },
          { text: '35', letter: 'C', is_correct: false },
          { text: '40', letter: 'D', is_correct: false },
          { text: '45', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion6 = await prisma.question.create({
    data: {
      text: 'Resolva 2x - 4 = 0.',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Isolamento da variável.',
      number: 2,
      path_id: matematicaAlgebra.id,
      alternatives: {
        create: [
          { text: '2', letter: 'A', is_correct: true },
          { text: '1', letter: 'B', is_correct: false },
          { text: '4', letter: 'C', is_correct: false },
          { text: '0', letter: 'D', is_correct: false },
          { text: '-2', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion7 = await prisma.question.create({
    data: {
      text: 'Qual é a área de um círculo de raio 3?',
      origin: 'EXTERNAL',
      year: 2023,
      feedback: 'Fórmula: πr².',
      number: 3,
      path_id: matematicaGeometria.id,
      alternatives: {
        create: [
          { text: '6π', letter: 'A', is_correct: false },
          { text: '9π', letter: 'B', is_correct: true },
          { text: '3π', letter: 'C', is_correct: false },
          { text: '12π', letter: 'D', is_correct: false },
          { text: '18π', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion8 = await prisma.question.create({
    data: {
      text: 'Qual é o cosseno de 0º?',
      origin: 'EXTERNAL',
      year: 2023,
      feedback: 'Cosseno de 0 é 1.',
      number: 4,
      path_id: matematicaTrigonometria.id,
      alternatives: {
        create: [
          { text: '0', letter: 'A', is_correct: false },
          { text: '1', letter: 'B', is_correct: false },
          { text: '-1', letter: 'C', is_correct: false },
          { text: '1', letter: 'D', is_correct: true },
          { text: '0.5', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion9 = await prisma.question.create({
    data: {
      text: 'Qual é a média de 2, 4, 6?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Soma dividida pelo número de elementos.',
      number: 1,
      path_id: matematicaEstatistica.id,
      alternatives: {
        create: [
          { text: '3', letter: 'A', is_correct: false },
          { text: '4', letter: 'B', is_correct: true },
          { text: '5', letter: 'C', is_correct: false },
          { text: '6', letter: 'D', is_correct: false },
          { text: '2', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion10 = await prisma.question.create({
    data: {
      text: 'Quanto é 10 ÷ 2?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Divisão básica.',
      number: 2,
      path_id: matematicaBasica.id,
      alternatives: {
        create: [
          { text: '5', letter: 'A', is_correct: true },
          { text: '2', letter: 'B', is_correct: false },
          { text: '10', letter: 'C', is_correct: false },
          { text: '20', letter: 'D', is_correct: false },
          { text: '0', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion11 = await prisma.question.create({
    data: {
      text: 'Resolva x² - 4 = 0.',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Raízes quadradas.',
      number: 3,
      path_id: matematicaAlgebra.id,
      alternatives: {
        create: [
          { text: 'x = 2', letter: 'A', is_correct: false },
          { text: 'x = ±2', letter: 'B', is_correct: false },
          { text: 'x = ±2', letter: 'C', is_correct: true },
          { text: 'x = 4', letter: 'D', is_correct: false },
          { text: 'x = 0', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion12 = await prisma.question.create({
    data: {
      text: 'Qual é o perímetro de um quadrado de lado 5?',
      origin: 'EXTERNAL',
      year: 2023,
      feedback: '4 x lado.',
      number: 4,
      path_id: matematicaGeometria.id,
      alternatives: {
        create: [
          { text: '15', letter: 'A', is_correct: false },
          { text: '20', letter: 'B', is_correct: true },
          { text: '25', letter: 'C', is_correct: false },
          { text: '30', letter: 'D', is_correct: false },
          { text: '5', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion13 = await prisma.question.create({
    data: {
      text: 'Qual é a tangente de 45º?',
      origin: 'EXTERNAL',
      year: 2023,
      feedback: 'Tan = sen/cos.',
      number: 1,
      path_id: matematicaTrigonometria.id,
      alternatives: {
        create: [
          { text: '0', letter: 'A', is_correct: false },
          { text: '1', letter: 'B', is_correct: false },
          { text: '-1', letter: 'C', is_correct: false },
          { text: '0.5', letter: 'D', is_correct: false },
          { text: '1', letter: 'E', is_correct: true },
        ],
      },
    },
  });

  const mathQuestion14 = await prisma.question.create({
    data: {
      text: 'Qual é a mediana de 1, 3, 5?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Valor do meio.',
      number: 2,
      path_id: matematicaEstatistica.id,
      alternatives: {
        create: [
          { text: '3', letter: 'A', is_correct: true },
          { text: '1', letter: 'B', is_correct: false },
          { text: '5', letter: 'C', is_correct: false },
          { text: '2', letter: 'D', is_correct: false },
          { text: '4', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion15 = await prisma.question.create({
    data: {
      text: 'Quanto é 7 + 8?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Soma simples.',
      number: 3,
      path_id: matematicaBasica.id,
      alternatives: {
        create: [
          { text: '13', letter: 'A', is_correct: false },
          { text: '14', letter: 'B', is_correct: false },
          { text: '15', letter: 'C', is_correct: true },
          { text: '16', letter: 'D', is_correct: false },
          { text: '17', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion16 = await prisma.question.create({
    data: {
      text: 'Qual é o resultado de 9 - 5?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Subtrações simples fazem parte da matemática básica.',
      number: 4,
      path_id: matematicaBasica.id,
      alternatives: {
        create: [
          { text: '3', letter: 'A', is_correct: false },
          { text: '4', letter: 'B', is_correct: true },
          { text: '5', letter: 'C', is_correct: false },
          { text: '6', letter: 'D', is_correct: false },
          { text: '7', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const mathQuestion1Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion1.id },
  });
  const mathQuestion2Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion2.id },
  });
  const mathQuestion3Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion3.id },
  });
  const mathQuestion4Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion4.id },
  });
  const mathQuestion5Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion5.id },
  });
  const mathQuestion6Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion6.id },
  });
  const mathQuestion7Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion7.id },
  });
  const mathQuestion8Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion8.id },
  });
  const mathQuestion9Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion9.id },
  });
  const mathQuestion10Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion10.id },
  });
  const mathQuestion11Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion11.id },
  });
  const mathQuestion12Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion12.id },
  });
  const mathQuestion13Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion13.id },
  });
  const mathQuestion14Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion14.id },
  });
  const mathQuestion15Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion15.id },
  });
  const mathQuestion16Alts = await prisma.alternative.findMany({
    where: { question_id: mathQuestion16.id },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: mathQuestion1.id,
      alternative_id: mathQuestion1Alts.find((alt) => alt.letter === 'B')!.id,
      answer_date: new Date('2026-03-27T12:00:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: mathQuestion2.id,
      alternative_id: mathQuestion2Alts.find((alt) => alt.letter === 'A')!.id,
      answer_date: new Date('2026-03-27T12:05:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user3.id,
      question_id: mathQuestion3.id,
      alternative_id: mathQuestion3Alts.find((alt) => alt.letter === 'C')!.id,
      answer_date: new Date('2026-03-27T12:10:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user3.id,
      question_id: mathQuestion4.id,
      alternative_id: mathQuestion4Alts.find((alt) => alt.letter === 'A')!.id,
      answer_date: new Date('2026-03-27T12:15:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: mathQuestion5.id,
      alternative_id: mathQuestion5Alts.find((alt) => alt.letter === 'B')!.id,
      answer_date: new Date('2026-03-28T10:00:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: mathQuestion6.id,
      alternative_id: mathQuestion6Alts.find((alt) => alt.letter === 'C')!.id,
      answer_date: new Date('2026-03-28T10:05:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: mathQuestion16.id,
      alternative_id: mathQuestion16Alts.find((alt) => alt.letter === 'A')!.id,
      answer_date: new Date('2026-03-28T10:07:00'),
    },
  });

  // mathQuestion7 não respondida

  await prisma.answer.create({
    data: {
      user_id: user3.id,
      question_id: mathQuestion8.id,
      alternative_id: mathQuestion8Alts.find((alt) => alt.letter === 'D')!.id,
      answer_date: new Date('2026-03-28T10:10:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user3.id,
      question_id: mathQuestion9.id,
      alternative_id: mathQuestion9Alts.find((alt) => alt.letter === 'A')!.id,
      answer_date: new Date('2026-03-28T10:15:00'),
    },
  });

  // mathQuestion10 não respondida

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: mathQuestion11.id,
      alternative_id: mathQuestion11Alts.find((alt) => alt.letter === 'C')!.id,
      answer_date: new Date('2026-03-29T11:00:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: mathQuestion12.id,
      alternative_id: mathQuestion12Alts.find((alt) => alt.letter === 'D')!.id,
      answer_date: new Date('2026-03-29T11:05:00'),
    },
  });

  // mathQuestion13 não respondida

  await prisma.answer.create({
    data: {
      user_id: user3.id,
      question_id: mathQuestion14.id,
      alternative_id: mathQuestion14Alts.find((alt) => alt.letter === 'A')!.id,
      answer_date: new Date('2026-03-29T11:10:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user3.id,
      question_id: mathQuestion15.id,
      alternative_id: mathQuestion15Alts.find((alt) => alt.letter === 'B')!.id,
      answer_date: new Date('2026-03-29T11:15:00'),
    },
  });

  const q3 = await prisma.question.create({
    data: {
      text: 'Qual é a fórmula da água?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Revise este conteúdo.',
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

  /*

  const exam1 = await prisma.exam.create({
    data: {
      name: 'Simulado Geral 1',
      origin: 'ORIGINAL',
      media_key: null,
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

  */

  type ExamWithDays = {
    exam: {
      id: string;
      name: string;
      origin: string;
      media_key: string | null;
    };
    examDays: {
      id: string;
      day: number;
      exam_id: string;
    }[];
  };

  const exams: ExamWithDays[] = [];

  // Criando exams + days
  for (let i = 0; i < 5; i++) {
    const exam = await prisma.exam.create({
      data: {
        name: `Simulado ${i + 1}`,
        status: i < 3 ? 'PUBLISHED' : 'DRAFT',
        origin: Origin.EXTERNAL,
        media_key: i < 3 ? `https://example.com/${i + 1}.png` : null,
      },
    });

    const examDays = [1, 2].map((day) => ({
      id: crypto.randomUUID(),
      day,
      exam_id: exam.id,
    }));

    await prisma.examDay.createMany({
      data: examDays,
    });

    exams.push({ exam, examDays });
  }

  // Pegando dados
  //const allPaths = await prisma.path.findMany();
  const examDays = await prisma.examDay.findMany();

  // Criando questões + alternativas
  for (const examDay of examDays) {
    const prova = await prisma.exam.findUnique({
      where: {
        id: examDay.exam_id,
      },
    });

    for (let i = 1; i <= 15; i++) {
      const isLanguageQuestion = examDay.day === 1 && i <= 5;
      const questionLanguage = isLanguageQuestion
        ? i % 2 === 0
          ? Language.SPANISH
          : Language.ENGLISH
        : null;

      const question = await prisma.question.create({
        data: {
          text: `Questão ${i} do ${prova?.name} do dia ${examDay.day}`,
          origin: Origin.EXTERNAL,
          year: 2023,
          feedback: `Comentário da questão ${i} do ${prova?.name} dia ${examDay.day}`,
          number: i,
          language: questionLanguage,
          exam_day_id: examDay.id,
          path_id: allPaths[Math.floor(Math.random() * allPaths.length)].id,
        },
      });

      await prisma.alternative.createMany({
        data: makeAlternatives('A').map((alt) => ({
          ...alt,
          question_id: question.id,
        })),
      });
    }
  }

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

  const allAlternatives = await prisma.alternative.findMany();

  // mapa pra evitar query por resposta
  const altMap = new Map(allAlternatives.map((a) => [`${a.question_id}_${a.letter}`, a.id]));

  function getRandom<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      const exam = getRandom(exams).exam;

      const attempt = await prisma.attempt.create({
        data: {
          user_id: user.id,
          exam_id: exam.id,
          language: Language.ENGLISH,
          time_spent_seconds: Math.floor(Math.random() * 60) + 20,
          init_time: new Date(),
          end_time: Math.random() < 0.5 ? null : new Date(),
        },
      });

      // pega os dias do exam
      const examDays = exams.find((e) => e.exam.id === exam.id)!.examDays;

      for (const examDay of examDays) {
        const attemptDay = await prisma.attemptDay.create({
          data: {
            attempt_id: attempt.id,
            exam_day_id: examDay.id,
            time_spent_seconds: Math.floor(Math.random() * 30) + 10,
            current_question: 1,
            init_time: new Date(),
            end_time: new Date(),
          },
        });

        // pega questões desse dia
        const questions = await prisma.question.findMany({
          where: {
            exam_day_id: examDay.id,
          },
        });

        for (const question of questions) {
          // 70% chance de acertar
          const isCorrect = Math.random() < 0.7;

          const alternatives = allAlternatives.filter((a) => a.question_id === question.id);

          const correctAlt = alternatives.find((a) => a.is_correct)!;
          const wrongAlts = alternatives.filter((a) => !a.is_correct);

          const chosen = isCorrect ? correctAlt : getRandom(wrongAlts);

          const alternativeId = altMap.get(`${question.id}_${chosen.letter}`);

          await prisma.answer.create({
            data: {
              user_id: user.id,
              question_id: question.id,
              alternative_id: alternativeId,
              attempt_day_id: attemptDay.id,
              answer_date: new Date(),
            },
          });
        }
      }
    }
  }

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
