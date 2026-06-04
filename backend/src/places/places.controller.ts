import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { PlacesService } from './places.service';

@ApiTags('places')
@ApiBearerAuth()
@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get('autocomplete')
  @ApiOperation({ summary: 'Address autocomplete suggestions (Nigeria)' })
  @ResponseMessage('Suggestions')
  autocomplete(
    @Query('q') q?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.places.autocomplete(q ?? '', lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse-geocode a point to an address' })
  @ResponseMessage('Address')
  reverse(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.places.reverse(Number(lat), Number(lng));
  }
}
