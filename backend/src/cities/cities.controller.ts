import { Controller, Get, Query } from '@nestjs/common';
import { CitiesService } from './cities.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async getCities(@Query('q') query?: string) {
    if (query) {
      return this.citiesService.search(query);
    }
    return this.citiesService.findAll();
  }
}

