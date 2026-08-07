import { IsEmail, IsString, MinLength } from 'class-validator';

export class GoogleAdminLoginDto {
  @IsString()
  @MinLength(20)
  credential!: string;
}

export class BootstrapAdminLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  secret!: string;
}

export class PasswordAdminLoginDto {
  /** Email ou nom d’utilisateur */
  @IsString()
  @MinLength(2)
  identifier!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
