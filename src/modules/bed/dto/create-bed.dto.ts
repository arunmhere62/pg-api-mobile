import { IsString, IsInt, IsOptional, IsNumber, Min } from 'class-validator';

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

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  bed_price?: number;
}
