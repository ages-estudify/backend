import { randomInt } from 'crypto';

export class OtpGenerator {
  static generate(length = 6): string {
    return Array.from({ length }, () => randomInt(10)).join('');
  }
}
