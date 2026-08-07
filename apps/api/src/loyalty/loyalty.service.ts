import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { POINT_VALUE_FCFA, pointsFromAmount } from './loyalty.constants';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  readonly pointValue = POINT_VALUE_FCFA;

  async getByPhone(phone: string) {
    const normalized = phone.replace(/\s+/g, '').trim();
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { phone: normalized },
    });
    const points = account?.points ?? 0;
    return {
      phone: normalized,
      points,
      pointValue: POINT_VALUE_FCFA,
      valueFcfa: points * POINT_VALUE_FCFA,
    };
  }

  async earn(phone: string, points: number) {
    const normalized = phone.replace(/\s+/g, '').trim();
    if (points <= 0) return this.getByPhone(normalized);
    return this.prisma.loyaltyAccount.upsert({
      where: { phone: normalized },
      update: { points: { increment: points } },
      create: { phone: normalized, points },
    });
  }

  async redeem(phone: string, points: number) {
    const normalized = phone.replace(/\s+/g, '').trim();
    if (points <= 0) {
      throw new BadRequestException('Nombre de points invalide');
    }

    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { phone: normalized },
    });
    if (!account || account.points < points) {
      throw new BadRequestException('Solde de points insuffisant');
    }

    const updated = await this.prisma.loyaltyAccount.update({
      where: { phone: normalized },
      data: { points: { decrement: points } },
    });

    return {
      phone: normalized,
      points: updated.points,
      redeemed: points,
      discountFcfa: points * POINT_VALUE_FCFA,
      pointValue: POINT_VALUE_FCFA,
      valueFcfa: updated.points * POINT_VALUE_FCFA,
    };
  }

  /** Max points usable against a cart total (FCFA) */
  maxRedeemable(availablePoints: number, totalFcfa: number) {
    return Math.min(availablePoints, pointsFromAmount(totalFcfa));
  }
}
