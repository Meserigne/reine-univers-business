import { IsInt, Min } from 'class-validator';

export class EarnPointsDto {
  @IsInt()
  @Min(1)
  points!: number;
}
