import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  id!: string;

  @IsString()
  @MinLength(2)
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  id!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @IsString()
  unit!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  cut!: string;

  @IsString()
  image!: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  cut?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateOrderStatusDto {
  @IsString()
  status!: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
}

export class UpdateSiteContentDto {
  @IsOptional() @IsString() brandName?: string;
  @IsOptional() @IsString() heroTitle?: string;
  @IsOptional() @IsString() heroSubtitle?: string;
  @IsOptional() @IsString() ctaLabel?: string;
  @IsOptional() @IsString() deliveryEyebrow?: string;
  @IsOptional() @IsString() deliveryTitle?: string;
  @IsOptional() @IsString() deliveryText?: string;
  @IsOptional() @IsString() deliveryFast?: string;
  @IsOptional() @IsString() deliveryHours?: string;
  @IsOptional() @IsString() deliveryZones?: string;
  @IsOptional() @IsString() loyaltyEyebrow?: string;
  @IsOptional() @IsString() loyaltyTitle?: string;
  @IsOptional() @IsString() loyaltyText?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() email?: string;
}

export class CreateCourierDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(8) phone!: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

export class UpdateCourierDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(8) phone?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

export class CreateZoneDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) keywords!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) fee?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) prepMinutes?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

export class UpdateZoneDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(2) keywords?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) fee?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) prepMinutes?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

export class UpdateDeliverySettingsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) defaultPrepMinutes?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) defaultDurationMinutes?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) defaultFee?: number;
  @IsOptional() @IsBoolean() useMapsEstimate?: boolean;
}

export class UpdateOrderTrackingDto {
  @IsOptional() @IsString() courierId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) prepSeconds?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) durationSeconds?: number;
  @IsOptional() @Type(() => Number) @IsInt() addMinutes?: number;
  @IsOptional() @IsString() estimatedArrivalAt?: string;
  @IsOptional() @IsString() status?: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  @IsOptional() @IsBoolean() markDeparted?: boolean;
  @IsOptional() @IsBoolean() markArrived?: boolean;
}

export class CreateAdminAccountDto {
  @IsString() @MinLength(3) email!: string;
  @IsString() @MinLength(2) username!: string;
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(6) password!: string;
}

export class UpdateAdminAccountDto {
  @IsOptional() @IsString() @MinLength(3) email?: string;
  @IsOptional() @IsString() @MinLength(2) username?: string;
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateAdminAuthSettingsDto {
  @IsOptional() @IsString() googleClientId?: string;
  @IsOptional() @IsString() googleClientSecret?: string;
  @IsOptional() @IsString() googleAllowedEmails?: string;
}
