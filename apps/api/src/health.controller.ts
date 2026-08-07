import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      name: 'Reine Univers Business API',
      status: 'ok',
      docs: {
        home: 'GET /pages/home',
        shop: 'GET /pages/shop',
        content: 'GET /pages/content',
        products: 'GET /products',
        product: 'GET /products/:id',
        createOrder: 'POST /orders',
        order: 'GET /orders/:id',
        loyalty: 'GET /loyalty/:phone',
        earnLoyalty: 'POST /loyalty/:phone/earn',
        contact: 'POST /contact',
      },
    };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
