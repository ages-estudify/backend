import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client';
import { WeekDay } from '@prisma/client';
import { text } from 'stream/consumers';

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
  const user1 = await prisma.user.create({
    data: {
      full_name: 'Aurelio Fagundes',
      email: 'Fagund_Au@email.com',
      password: '1029384',
      phone_number: '51911111111',
      role: Role.ADM,
      birth_date: new Date('1985-03-20'),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      full_name: 'Ana Souza',
      email: 'ana@email.com',
      password: '123456',
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
      password: '123456',
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
  const historia = await prisma.subject.create({ data: { name: 'História' } });
  const matematica = await prisma.subject.create({ data: { name: 'Matemática' } });
  const portugues = await prisma.subject.create({ data: { name: 'Português' } });
  const geografia = await prisma.subject.create({ data: { name: 'Geografia' } });
  const fisica = await prisma.subject.create({ data: { name: 'Física' } });
  const quimica = await prisma.subject.create({ data: { name: 'Química' } });
  const biologia = await prisma.subject.create({ data: { name: 'Biologia' } });
  const filosofia = await prisma.subject.create({ data: { name: 'Filosofia' } });
  const sociologia = await prisma.subject.create({ data: { name: 'Sociologia' } });
  const literatura = await prisma.subject.create({ data: { name: 'Literatura' } });
  const linguas = await prisma.subject.create({ data: { name: 'Línguas Estrangeiras' } });

  // =========================
  // pathS
  // =========================
  const historiapatho = await prisma.path.create({
    data: {
      name: 'Antiguidade',
      schedule_position: 1,
      trail_position: 1,
      subject_id: historia.id,
      text: 'Estude a história da antiguidade, incluindo as civilizações egípcia, grega e romana.',
    },
  });

  const matematicaBasica = await prisma.path.create({
    data: {
      name: 'Matemática Básica',
      schedule_position: 2,
      trail_position: 1,
      subject_id: matematica.id,
      text: 'Estude os conceitos básicos de matemática.',
    },
  });

  const testeDeQuestoes = await prisma.path.create({
    data: {
      name: 'Teste de Questões',
      schedule_position: 12,
      trail_position: 1,
      subject_id: matematica.id,
      text: 'Caminho usado para testes automatizados de entrega de questões.',
    },
  });

  const e2eOriginalSemImagem = await prisma.question.create({
    data: {
      text: 'E2E Questão ORIGINAL sem imagem',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Questão usada para testes de imagem nula.',
      path_id: testeDeQuestoes.id,
      alternatives: {
        create: [
          { text: 'A', letter: 'A', is_correct: false },
          { text: 'B', letter: 'B', is_correct: true },
          { text: 'C', letter: 'C', is_correct: false },
          { text: 'D', letter: 'D', is_correct: false },
          { text: 'E', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const e2eOriginalComImagem = await prisma.question.create({
    data: {
      text: 'E2E Questão ORIGINAL com imagem',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Questão usada para testes de imagem string.',
      path_id: testeDeQuestoes.id,
      image_url: 'https://example.com/e2e-question.png',
      alternatives: {
        create: [
          { text: 'A', letter: 'A', is_correct: false },
          { text: 'B', letter: 'B', is_correct: false },
          { text: 'C', letter: 'C', is_correct: true },
          { text: 'D', letter: 'D', is_correct: false },
          { text: 'E', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const e2eOriginalRespondida = await prisma.question.create({
    data: {
      text: 'E2E Questão ORIGINAL respondida',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Questão respondida para excluir em excludeAnswered=true.',
      path_id: testeDeQuestoes.id,
      alternatives: {
        create: [
          { text: 'A', letter: 'A', is_correct: true },
          { text: 'B', letter: 'B', is_correct: false },
          { text: 'C', letter: 'C', is_correct: false },
          { text: 'D', letter: 'D', is_correct: false },
          { text: 'E', letter: 'E', is_correct: false },
        ],
      },
    },
    include: { alternatives: true },
  });

  const e2eSimplifiedComImagem = await prisma.question.create({
    data: {
      text: 'E2E Questão SIMPLIFIED com imagem',
      origin: 'EXTERNAL',
      year: 2024,
      feedback: 'Questão simplificada com imagem.',
      path_id: testeDeQuestoes.id,
      image_url: 'https://example.com/e2e-simplified.png',
      alternatives: {
        create: [
          { text: 'A', letter: 'A', is_correct: false },
          { text: 'B', letter: 'B', is_correct: false },
          { text: 'C', letter: 'C', is_correct: true },
          { text: 'D', letter: 'D', is_correct: false },
          { text: 'E', letter: 'E', is_correct: false },
        ],
      },
    },
    include: { alternatives: true },
  });

  const e2eSimplifiedRespondida = await prisma.question.create({
    data: {
      text: 'E2E Questão SIMPLIFIED respondida',
      origin: 'EXTERNAL',
      year: 2024,
      feedback: 'Questão simplificada respondida.',
      path_id: testeDeQuestoes.id,
      alternatives: {
        create: [
          { text: 'A', letter: 'A', is_correct: true },
          { text: 'B', letter: 'B', is_correct: false },
          { text: 'C', letter: 'C', is_correct: false },
          { text: 'D', letter: 'D', is_correct: false },
          { text: 'E', letter: 'E', is_correct: false },
        ],
      },
    },
    include: { alternatives: true },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: e2eOriginalRespondida.id,
      alternative_id: e2eOriginalRespondida.alternatives.find((alt) => alt.is_correct)!.id,
      answer_date: new Date('2026-03-27T10:00:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: e2eSimplifiedComImagem.id,
      alternative_id: e2eSimplifiedComImagem.alternatives.find((alt) => alt.is_correct)!.id,
      answer_date: new Date('2026-03-27T10:00:00'),
    },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: e2eSimplifiedRespondida.id,
      alternative_id: e2eSimplifiedRespondida.alternatives.find((alt) => alt.is_correct)!.id,
      answer_date: new Date('2026-03-27T10:00:00'),
    },
  });

  const interpretacao = await prisma.path.create({
    data: {
      name: 'Interpretação de Texto',
      schedule_position: 3,
      trail_position: 1,
      subject_id: portugues.id,
      text: 'Estude como interpretar textos literários.',
    },
  });

  const cartografia = await prisma.path.create({
    data: {
      name: 'Cartografia',
      schedule_position: 4,
      trail_position: 1,
      subject_id: geografia.id,
      text: 'Estude os princípios da cartografia.',
    },
  });

  const mecanica = await prisma.path.create({
    data: {
      name: 'Mecânica',
      schedule_position: 5,
      trail_position: 1,
      subject_id: fisica.id,
      text: 'Estude os princípios da mecânica.',
    },
  });

  const modelosAtomicos = await prisma.path.create({
    data: {
      name: 'Modelos Atômicos',
      schedule_position: 6,
      trail_position: 1,
      subject_id: quimica.id,
      text: 'Estude os modelos atômicos.',
    },
  });

  const bioquimica = await prisma.path.create({
    data: {
      name: 'Bioquímica',
      schedule_position: 7,
      trail_position: 1,
      subject_id: biologia.id,
      text: 'Estude os princípios da bioquímica.',
    },
  });

  const filosofiaAntiga = await prisma.path.create({
    data: {
      name: 'Filosofia Antiga',
      schedule_position: 8,
      trail_position: 1,
      subject_id: filosofia.id,
      text: 'Estude os princípios da filosofia antiga.',
    },
  });

  const cultura = await prisma.path.create({
    data: {
      name: 'Cultura',
      schedule_position: 9,
      trail_position: 1,
      subject_id: sociologia.id,
      text: 'Estude os princípios da cultura.',
    },
  });

  const escolasLiterarias = await prisma.path.create({
    data: {
      name: 'Escolas Literárias',
      schedule_position: 10,
      trail_position: 1,
      subject_id: literatura.id,
      text: 'Estude as diferentes escolas literárias.',
    },
  });

  const linguaspatho = await prisma.path.create({
    data: {
      name: 'Gramática Básica',
      schedule_position: 11,
      trail_position: 1,
      subject_id: linguas.id,
      text: 'Estude os princípios da gramática.',
    },
  });

  // =========================
  // QUESTIONS
  // =========================

  await prisma.question.create({
    data: {
      text: 'Qual é o resultado de 2 + 2?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Revise este conteúdo.',
      path_id: matematicaBasica.id,
      alternatives: {
        create: [
          { text: '1', letter: 'A', is_correct: false },
          { text: '2', letter: 'B', is_correct: false },
          { text: '3', letter: 'C', is_correct: false },
          { text: '4', letter: 'D', is_correct: true },
          { text: '5', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      text: 'Qual é a capital do Brasil?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Revise este conteúdo.',
      path_id: cartografia.id,
      alternatives: {
        create: [
          { text: 'São Paulo', letter: 'A', is_correct: false },
          { text: 'Brasília', letter: 'B', is_correct: true },
          { text: 'Rio de Janeiro', letter: 'C', is_correct: false },
          { text: 'Salvador', letter: 'D', is_correct: false },
          { text: 'Belo Horizonte', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      text: 'Quem escreveu Dom Casmurro?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Revise este conteúdo.',
      path_id: interpretacao.id,
      alternatives: {
        create: [
          { text: 'Machado de Assis', letter: 'A', is_correct: true },
          { text: 'José de Alencar', letter: 'B', is_correct: false },
          { text: 'Clarice Lispector', letter: 'C', is_correct: false },
          { text: 'Carlos Drummond', letter: 'D', is_correct: false },
          { text: 'Graciliano Ramos', letter: 'E', is_correct: false },
        ],
      },
    },
  });

  const q3 = await prisma.question.create({
    data: {
      text: 'Qual é a fórmula da água?',
      origin: 'ORIGINAL',
      year: 2024,
      feedback: 'Revise este conteúdo.',
      day: 1,
      number: 1,
      path_id: modelosAtomicos.id,
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
      path_id: cartografia.id,
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

  const q1 = await prisma.question.findFirst({
    where: { text: 'Qual é o resultado de 2 + 2?' },
    include: { alternatives: true },
  });

  await prisma.answer.create({
    data: {
      user_id: user2.id,
      question_id: q1!.id,
      alternative_id: q1!.alternatives.find((a) => a.is_correct)!.id,
      answer_date: new Date('2026-03-27T10:00:00'),
    },
  });

  const q2 = await prisma.question.findFirst({
    where: { text: 'Qual é a capital do Brasil?' },
    include: { alternatives: true },
  });

  await prisma.answer.create({
    data: {
      user_id: user3.id,
      question_id: q2!.id,
      alternative_id: q2!.alternatives.find((a) => a.text === 'São Paulo')!.id,
      answer_date: new Date('2026-03-27T10:00:00'),
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
      path_id: cartografia.id,
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

  // =========================
  // 20 QUESTIONS FOR MATH
  // =========================
  const mathQuestions = [
    { text: 'Quanto é 5 + 3?', answer: '8' },
    { text: 'Quanto é 10 - 4?', answer: '6' },
    { text: 'Quanto é 6 × 7?', answer: '42' },
    { text: 'Quanto é 48 ÷ 6?', answer: '8' },
    { text: 'Quanto é 2³?', answer: '8' },
    { text: 'Qual é a raiz quadrada de 16?', answer: '4' },
    { text: 'Quanto é 15% de 200?', answer: '30' },
    { text: 'Quanto é 3,5 + 2,8?', answer: '6,3' },
    { text: 'Quanto é 9 × 9?', answer: '81' },
    { text: 'Quanto é 100 - 37?', answer: '63' },
    { text: 'Quanto é 4 × 25?', answer: '100' },
    { text: 'Quanto é 144 ÷ 12?', answer: '12' },
    { text: 'Quanto é 7²?', answer: '49' },
    { text: 'Quanto é 20% de 150?', answer: '30' },
    { text: 'Quanto é 8 + 15?', answer: '23' },
    { text: 'Quanto é 50 - 28?', answer: '22' },
    { text: 'Quanto é 6 × 8?', answer: '48' },
    { text: 'Quanto é 81 ÷ 9?', answer: '9' },
    { text: 'Quanto é 5³?', answer: '125' },
    { text: 'Quanto é 25% de 80?', answer: '20' },
  ];

  for (const [index, mathQ] of mathQuestions.entries()) {
    const qNum = index + 1;
    const alternatives = [
      { text: 'A', letter: 'A' },
      { text: 'B', letter: 'B' },
      { text: 'C', letter: 'C' },
      { text: 'D', letter: 'D' },
      { text: 'E', letter: 'E' },
    ];

    // Find the correct answer position and create alternatives
    const correctIndex = Math.floor(Math.random() * 5);
    const altsList = alternatives.map((alt, idx) => ({
      ...alt,
      is_correct: idx === correctIndex,
    }));

    // Insert correct answer first
    altsList[correctIndex].text = mathQ.answer;

    // Fill other alternatives with plausible wrong answers
    let altIdx = 0;
    for (let i = 0; i < 5; i++) {
      if (i !== correctIndex) {
        // Generate some wrong answers
        if (qNum <= 5) {
          altsList[i].text = String(
            (parseInt(mathQ.answer) || 0) + (i === 0 ? -1 : i === 1 ? 1 : i === 2 ? 2 : -2),
          );
        } else {
          altsList[i].text = String(
            (parseInt(mathQ.answer) || 0) + (altIdx + 1) * (i === 0 ? -1 : 1),
          );
          altIdx++;
        }
      }
    }

    await prisma.question.create({
      data: {
        text: mathQ.text,
        origin: 'ORIGINAL',
        year: 2024,
        feedback: `A resposta correta é ${mathQ.answer}.`,
        path_id: matematicaBasica.id,
        language: 'ENGLISH',
        alternatives: {
          create: altsList,
        },
      },
    });
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
