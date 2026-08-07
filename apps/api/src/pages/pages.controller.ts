import { Controller, Get } from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('home')
  getHome() {
    return this.pagesService.getHome();
  }

  @Get('shop')
  getShop() {
    return this.pagesService.getShop();
  }

  @Get('content')
  getContent() {
    return this.pagesService.getSiteContent();
  }
}
