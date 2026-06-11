import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePasswordDto {

    @ApiProperty({ example: 'Str0ngP@ss', minLength: 8 })
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    newPassword: string;
}