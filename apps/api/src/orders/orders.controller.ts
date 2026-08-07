import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common';
import { Observable, interval, startWith, switchMap } from 'rxjs';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateCourierLocationDto,
  UpdateOrderLocationDto,
} from './dto/create-order.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrackingEventsService } from './tracking-events.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly trackingEvents: TrackingEventsService,
  ) {}

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

  /** Flux temps réel (SSE) — GPS livreur + changements de statut */
  @Sse(':id/tracking/stream')
  trackingStream(@Param('id') id: string): Observable<MessageEvent> {
    const live$ = this.trackingEvents.stream(id);
    const heartbeat$ = interval(4000).pipe(
      startWith(0),
      switchMap(async () => {
        const payload = await this.ordersService.getTracking(id);
        return {
          data: {
            orderId: id,
            type: 'tracking',
            payload,
            at: new Date().toISOString(),
          },
        } as MessageEvent;
      }),
    );
    return new Observable<MessageEvent>((subscriber) => {
      const sub1 = live$.subscribe(subscriber);
      const sub2 = heartbeat$.subscribe(subscriber);
      return () => {
        sub1.unsubscribe();
        sub2.unsubscribe();
      };
    });
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
    @Query('token') token?: string,
  ) {
    return this.ordersService.updateCourierLocation(
      id,
      dto.courierLat,
      dto.courierLng,
      dto.token || token,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
