import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DeliveryService } from './delivery.service';
import { TrackingEventsService } from './tracking-events.service';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    LoyaltyModule,
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, DeliveryService, TrackingEventsService],
  exports: [OrdersService, DeliveryService, TrackingEventsService],
})
export class OrdersModule {}
