import { IsString, IsInt, IsOptional, IsNumber } from 'class-validator';

export class CreateRoomDto {
  @IsInt()
  pg_id: number;

  @IsString()
  room_no: string;

  @IsOptional()
  @IsNumber()
  rent_price?: number;

  @IsOptional()
  images?: any;
}
