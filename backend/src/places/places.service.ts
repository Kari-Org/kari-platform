import { Inject, Injectable } from '@nestjs/common';
import { MAPS_PROVIDER, type MapsProvider, type PlaceSuggestion } from '../providers/contracts';

@Injectable()
export class PlacesService {
  constructor(@Inject(MAPS_PROVIDER) private readonly maps: MapsProvider) {}

  autocomplete(query: string, lat?: number, lng?: number): Promise<PlaceSuggestion[]> {
    const near = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
    return this.maps.autocomplete(query, near);
  }

  async reverse(lat: number, lng: number): Promise<{ address: string | null }> {
    return { address: await this.maps.reverseGeocode(lat, lng) };
  }
}
