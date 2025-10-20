import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateBedDto {
  @IsInt()
  room_id: number;

  @IsString()
  bed_no: string;

  @IsOptional()
  @IsInt()
  pg_id?: number;

  @IsOptional()
  images?: any;
}
