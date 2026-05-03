import { BadRequestException } from '@nestjs/common';

export interface CsvRow {
  exam_title?: string;
  bank?: string;
  exam_day?: string;
  discipline?: string;
  content?: string;
  question?: string;
  alternative_a?: string;
  alternative_b?: string;
  alternative_c?: string;
  alternative_d?: string;
  alternative_e?: string;
  correct_answer?: string;
  answer_explanation?: string;
  year?: string;
  [key: string]: any;
}

export interface ValidatedRow extends CsvRow {
  lineNumber: number;
  error?: string;
}

export interface ParsedRow {
  exam_day: string;
  question: string;
  alternative_a: string;
  alternative_b: string;
  alternative_c: string;
  alternative_d: string;
  alternative_e: string;
  correct_answer: string;
  answer_explanation?: string;
  year: string;
}

export class CsvUtils {
  static parseCsv(csv: string): ValidatedRow[] {
    const lines = csv.trim().split(/\r?\n/);

    if (lines.length < 2) {
      throw new BadRequestException('CSV must have header and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map((v) => v.trim());
      const row: ValidatedRow = { lineNumber: index + 2 };

      headers.forEach((h, i) => {
        row[h] = values[i];
      });

      return row;
    });
  }

  static validateStructure(
    rows: ValidatedRow[],
    requiredColumns: string[],
  ): {
    validRows: ValidatedRow[];
    errors: Array<{ line: number; error: string }>;
  } {
    const errors: Array<{ line: number; error: string }> = [];
    const validRows: ValidatedRow[] = [];

    if (!rows.length) {
      return { validRows, errors: [{ line: 1, error: 'CSV is empty' }] };
    }

    requiredColumns.forEach((col) => {
      if (!(col in rows[0])) {
        errors.push({ line: 1, error: `Missing required column: ${col}` });
      }
    });

    if (errors.length) return { validRows, errors };

    for (const row of rows) {
      const rowErrors = this.validateRow(row);

      if (rowErrors.length) {
        errors.push({ line: row.lineNumber, error: rowErrors.join('; ') });
      } else {
        validRows.push(row);
      }
    }

    return { validRows, errors };
  }

  private static validateRow(row: ValidatedRow): string[] {
    const errors: string[] = [];

    if (!row.exam_day || !/^\d+$/.test(row.exam_day)) {
      errors.push('exam_day must be a positive integer');
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes((row.correct_answer || '').toUpperCase())) {
      errors.push('Correct answer must be A-E');
    }

    if (!row.question) errors.push('Question text is required');

    if (!this.hasAllAlternatives(row)) {
      errors.push('All alternatives (A-E) are required');
    }

    if (!row.discipline) errors.push('Discipline is required');
    if (!row.content) errors.push('Content is required');
    if (!row.year) errors.push('Year is required');

    return errors;
  }

  private static hasAllAlternatives(row: ValidatedRow): boolean {
    return ['a', 'b', 'c', 'd', 'e'].every((l) => row[`alternative_${l}`]);
  }

  static validateMetadata(rows: ValidatedRow[]): {
    error?: string;
    examTitle?: string;
    bank?: string;
  } {
    if (!rows.length) return { error: 'No valid rows in CSV' };

    const { exam_title, bank } = rows[0];

    for (const row of rows) {
      if (row.exam_title !== exam_title) {
        return { error: 'exam_title must be consistent across all rows' };
      }
      if (row.bank !== bank) {
        return { error: 'bank must be consistent across all rows' };
      }
    }

    return { examTitle: exam_title, bank };
  }

  static parseRow(row: ValidatedRow): ParsedRow {
    return {
      exam_day: row.exam_day!,
      question: row.question!,
      alternative_a: row.alternative_a!,
      alternative_b: row.alternative_b!,
      alternative_c: row.alternative_c!,
      alternative_d: row.alternative_d!,
      alternative_e: row.alternative_e!,
      correct_answer: row.correct_answer!,
      answer_explanation: row.answer_explanation,
      year: row.year!,
    };
  }
}
