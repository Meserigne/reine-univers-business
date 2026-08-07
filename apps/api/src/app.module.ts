import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { PagesModule } from './pages/pages.module';
import { ContactModule } from './contact/contact.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductsModule,
    OrdersModule,
    LoyaltyModule,
    PagesModule,
    ContactModule,
    AdminModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
