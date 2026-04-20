import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateAttemptDto {
    @ApiProperty({
        description: 'Selected language for the exam',
        example: 'ENG',
    })
    @IsString()
    @IsNotEmpty()
    language!: string;
}
