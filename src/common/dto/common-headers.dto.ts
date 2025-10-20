import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CommonHeadersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pg_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  organization_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  user_id?: number;
}
