import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { EarnPointsDto } from './dto/earn-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get(':phone')
  getByPhone(@Param('phone') phone: string) {
    return this.loyaltyService.getByPhone(phone);
  }

  @Post(':phone/earn')
  earn(@Param('phone') phone: string, @Body() dto: EarnPointsDto) {
    return this.loyaltyService.earn(phone, dto.points);
  }

  @Post(':phone/redeem')
  redeem(@Param('phone') phone: string, @Body() dto: RedeemPointsDto) {
    return this.loyaltyService.redeem(phone, dto.points);
  }
}
