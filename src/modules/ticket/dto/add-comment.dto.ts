import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({ example: 'I tried the suggested fix and it works!', description: 'Comment text' })
  @IsString()
  comment: string;

  @ApiProperty({ example: ['https://example.com/screenshot.png'], required: false })
  @IsArray()
  @IsOptional()
  attachments?: string[];
}
