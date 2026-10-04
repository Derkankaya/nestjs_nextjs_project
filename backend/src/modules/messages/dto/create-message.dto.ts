import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  recipientId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}