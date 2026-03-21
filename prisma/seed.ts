import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client';
import { WeekDay } from '@prisma/client';

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
  await prisma.topic.deleteMany();
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
    },
  });

  const user2 = await prisma.user.create({
    data: {
      full_name: 'Ana Souza',
      email: 'ana@email.com',
      password: '123456',
      phone_number: '51911111111',
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
    // TOPICS 
    // =========================
    const historiaTopico = await prisma.topic.create({
      data: { name: 'Antiguidade', position: 1, subject_id: historia.id },
    });

    const matematicaBasica = await prisma.topic.create({
      data: { name: 'Matemática Básica', position: 2, subject_id: matematica.id },
    });

    const interpretacao = await prisma.topic.create({
      data: { name: 'Interpretação de Texto', position: 3, subject_id: portugues.id },
    });

    const cartografia = await prisma.topic.create({
      data: { name: 'Cartografia', position: 4, subject_id: geografia.id },
    });

    const mecanica = await prisma.topic.create({
      data: { name: 'Mecânica', position: 5, subject_id: fisica.id },
    });

    const modelosAtomicos = await prisma.topic.create({
      data: { name: 'Modelos Atômicos', position: 6, subject_id: quimica.id },
    });

    const bioquimica = await prisma.topic.create({
      data: { name: 'Bioquímica', position: 7, subject_id: biologia.id },
    });

    const filosofiaAntiga = await prisma.topic.create({
      data: { name: 'Filosofia Antiga', position: 8, subject_id: filosofia.id },
    });

    const cultura = await prisma.topic.create({
      data: { name: 'Cultura', position: 9, subject_id: sociologia.id },
    });

    const escolasLiterarias = await prisma.topic.create({
      data: { name: 'Escolas Literárias', position: 10, subject_id: literatura.id },
    });

    const linguasTopico = await prisma.topic.create({
      data: { name: 'Gramática Básica', position: 11, subject_id: linguas.id },
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
      topic_id: matematicaBasica.id,
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
      topic_id: cartografia.id,
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
      topic_id: interpretacao.id,
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
      day : 1,
      number :1,
      topic_id: modelosAtomicos.id,
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
      day:2,
      number:2,
      topic_id: cartografia.id,
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
    alternative_id: q1!.alternatives.find(a => a.is_correct)!.id,
  }
  });

  const q2 = await prisma.question.findFirst({
  where: { text: 'Qual é a capital do Brasil?'},
  include: { alternatives: true },
  });

   await prisma.answer.create({
  data: {
    user_id: user3.id,
    question_id: q2!.id,
    alternative_id: q2!.alternatives.find(a => a.text === 'São Paulo')!.id,
  }
  });


  const exam1 = await prisma.exam.create({
  data: {
    name: 'Simulado Geral 1',
    estimated_time_minutes: 60,
    origin: 'ORIGINAL',
    questions: {
      connect: [
        { id: q3!.id },
        { id: q4!.id },
      ],
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
  where: { text: 'Qual é a fórmula da água?'},
  include: { alternatives: true },
  });

    await prisma.answer.create({
    data: {
    user_id: user2.id,
    question_id: q!.id,
    alternative_id: q!.alternatives.find(a => a.text === 'CO2')!.id,
    attempt_id: attempt1.id,
  }
});

  await prisma.studyLog.create({
    data: {
     user_id: user2.id,
      topic_id:cartografia.id,
      date: new Date('2026-03-27T10:00:00'),
      done : false
    }
  });

  await prisma.studyLog.create({
    data: {
     user_id: user2.id,
      topic_id:matematicaBasica.id,
      date: new Date('2026-03-27T11:00:00'),
      done : false
    }
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
