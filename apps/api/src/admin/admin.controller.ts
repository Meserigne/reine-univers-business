import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  CreateAdminAccountDto,
  CreateCategoryDto,
  CreateCourierDto,
  CreateProductDto,
  CreateZoneDto,
  UpdateAdminAccountDto,
  UpdateAdminAuthSettingsDto,
  UpdateCategoryDto,
  UpdateCourierDto,
  UpdateDeliverySettingsDto,
  UpdateOrderStatusDto,
  UpdateOrderTrackingDto,
  UpdateProductDto,
  UpdateSiteContentDto,
  UpdateZoneDto,
} from './dto/admin.dto';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';

@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('categories')
  listCategories() {
    return this.adminService.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  @Get('products')
  listProducts() {
    return this.adminService.listProducts();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Get('orders')
  listOrders() {
    return this.adminService.listOrders();
  }

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.adminService.createOrder(dto);
  }

  @Get('invoices')
  listInvoices() {
    return this.adminService.listInvoices();
  }

  @Get('invoices/:id')
  getInvoice(@Param('id') id: string) {
    return this.adminService.getInvoice(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto.status as OrderStatus);
  }

  @Get('content')
  getContent() {
    return this.adminService.getContent();
  }

  @Patch('content')
  updateContent(@Body() dto: UpdateSiteContentDto) {
    return this.adminService.updateContent(dto);
  }

  @Get('messages')
  listMessages() {
    return this.adminService.listMessages();
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string) {
    return this.adminService.deleteMessage(id);
  }

  @Get('loyalty')
  listLoyalty() {
    return this.adminService.listLoyalty();
  }

  @Get('customers')
  listCustomers() {
    return this.adminService.listCustomers();
  }

  @Get('couriers')
  listCouriers() {
    return this.adminService.listCouriers();
  }

  @Post('couriers')
  createCourier(@Body() dto: CreateCourierDto) {
    return this.adminService.createCourier(dto);
  }

  @Patch('couriers/:id')
  updateCourier(@Param('id') id: string, @Body() dto: UpdateCourierDto) {
    return this.adminService.updateCourier(id, dto);
  }

  @Delete('couriers/:id')
  deleteCourier(@Param('id') id: string) {
    return this.adminService.deleteCourier(id);
  }

  @Get('zones')
  listZones() {
    return this.adminService.listZones();
  }

  @Post('zones')
  createZone(@Body() dto: CreateZoneDto) {
    return this.adminService.createZone(dto);
  }

  @Patch('zones/:id')
  updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.adminService.updateZone(id, dto);
  }

  @Delete('zones/:id')
  deleteZone(@Param('id') id: string) {
    return this.adminService.deleteZone(id);
  }

  @Get('delivery-settings')
  getDeliverySettings() {
    return this.adminService.getDeliverySettings();
  }

  @Patch('delivery-settings')
  updateDeliverySettings(@Body() dto: UpdateDeliverySettingsDto) {
    return this.adminService.updateDeliverySettings(dto);
  }

  @Post('delivery/seed')
  seedDelivery() {
    return this.adminService.seedDeliveryDefaults();
  }

  @Patch('orders/:id/tracking')
  updateOrderTracking(
    @Param('id') id: string,
    @Body() dto: UpdateOrderTrackingDto,
  ) {
    return this.adminService.updateOrderTracking(id, dto);
  }

  @Get('accounts')
  listAdminAccounts() {
    return this.adminService.listAdminAccounts();
  }

  @Post('accounts')
  createAdminAccount(@Body() dto: CreateAdminAccountDto) {
    return this.adminService.createAdminAccount(dto);
  }

  @Patch('accounts/:id')
  updateAdminAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAdminAccountDto,
  ) {
    return this.adminService.updateAdminAccount(id, dto);
  }

  @Delete('accounts/:id')
  deleteAdminAccount(@Param('id') id: string) {
    return this.adminService.deleteAdminAccount(id);
  }

  @Get('auth-settings')
  getAdminAuthSettings() {
    return this.adminService.getAdminAuthSettings();
  }

  @Patch('auth-settings')
  updateAdminAuthSettings(@Body() dto: UpdateAdminAuthSettingsDto) {
    return this.adminService.updateAdminAuthSettings(dto);
  }
}
