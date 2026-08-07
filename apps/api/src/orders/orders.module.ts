import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DeliveryService } from './delivery.service';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [LoyaltyModule, forwardRef(() => AuthModule)],
  controllers: [OrdersController],
  providers: [OrdersService, DeliveryService],
  exports: [OrdersService, DeliveryService],
})
export class OrdersModule {}
