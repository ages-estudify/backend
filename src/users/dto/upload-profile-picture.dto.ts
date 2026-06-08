import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UploadProfilePictureDto {
  @ApiProperty({
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgAB...',
    description: 'Imagem em base64 ou data URI',
  })
  @IsString()
  @IsNotEmpty()
  image: string;
}
