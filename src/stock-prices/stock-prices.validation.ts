import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class GetMovingAverageQuery {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  period: number;
}
