-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'SPANISH');

-- CreateEnum
CREATE TYPE "Origin" AS ENUM ('ORIGINAL', 'EXTERNAL');

-- CreateTable
CREATE TABLE "Exam" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "estimated_time_minutes" INTEGER NOT NULL,
    "origin" TEXT NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" UUID NOT NULL,
    "time_spent_minutes" INTEGER NOT NULL,
    "score" INTEGER,
    "current_question" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "init_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "exam_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "origin" "Origin" NOT NULL,
    "year" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "number" INTEGER,
    "language" "Language",
    "image_url" TEXT,
    "topic_id" UUID NOT NULL,
    "exam_id" UUID,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternative" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "letter" CHAR(1) NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "question_id" UUID NOT NULL,

    CONSTRAINT "Alternative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "alternative_id" UUID NOT NULL,
    "attempt_id" UUID,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD CONSTRAINT "Alternative_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_alternative_id_fkey" FOREIGN KEY ("alternative_id") REFERENCES "Alternative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "Attempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
