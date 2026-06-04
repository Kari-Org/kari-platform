import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { CarCategory } from '@kari/types';
import { PHONE_REGEX } from '../../common/constants/validation';

export class CreateDedicatedDriverDto {
  @ApiProperty({ example: 'dedicated@kari.test' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2348090000000' })
  @Matches(PHONE_REGEX, { message: 'phone must be 7–15 digits, optionally prefixed with +' })
  phone: string;

  @ApiProperty({ example: 'TempPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Emeka' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Nwosu' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ example: 'Toyota Hiace' })
  @IsString()
  @MinLength(1)
  vehicleModel: string;

  @ApiProperty({ example: 'LAG-555-DD' })
  @IsString()
  @MinLength(1)
  plateNumber: string;

  @ApiPropertyOptional({ enum: CarCategory, default: CarCategory.COMFORT })
  @IsOptional()
  @IsEnum(CarCategory)
  category?: CarCategory;
}
