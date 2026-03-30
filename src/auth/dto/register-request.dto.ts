import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'Pedro Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName!: string;

  @ApiProperty({ example: 'pedro@gmail.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: 'Str0ngP@ss', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: '51999999999' })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phone!: string;

  @ApiProperty({ example: '1999-05-15', description: 'YYYY-MM-DD' })
  @IsDateString({}, { message: 'birthDate must be a valid YYYY-MM-DD date' })
  birthDate!: string;
}
