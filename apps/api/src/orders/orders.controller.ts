import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateCourierLocationDto,
  UpdateOrderLocationDto,
} from './dto/create-order.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @Req() req: { user?: { id: string } },
  ) {
    if (req.user?.id) {
      dto.customerId = req.user.id;
    }
    return this.ordersService.create(dto);
  }

  @Get(':id/invoice')
  invoice(@Param('id') id: string) {
    return this.ordersService.getInvoice(id);
  }

  @Get(':id/tracking')
  tracking(@Param('id') id: string) {
    return this.ordersService.getTracking(id);
  }

  @Patch(':id/location')
  updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateOrderLocationDto,
  ) {
    return this.ordersService.updateClientLocation(
      id,
      dto.destLat,
      dto.destLng,
    );
  }

  @Patch(':id/courier-location')
  updateCourierLocation(
    @Param('id') id: string,
    @Body() dto: UpdateCourierLocationDto,
  ) {
    return this.ordersService.updateCourierLocation(
      id,
      dto.courierLat,
      dto.courierLng,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
