import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LocationService } from './location.service';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({
    status: 200,
    description: 'Countries fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Countries fetched successfully',
        data: [
          {
            s_no: 1,
            name: 'India',
            iso_code: 'IN',
            flag: '🇮🇳',
            phone_code: '+91',
            currency: 'INR',
            latitude: 20.5937,
            longitude: 78.9629,
          },
        ],
      },
    },
  })
  async getCountries() {
    return this.locationService.getCountries();
  }

  @Get('countries/:isoCode')
  @ApiOperation({ summary: 'Get country by ISO code' })
  @ApiParam({ name: 'isoCode', description: 'Country ISO code (e.g., IN, US)', example: 'IN' })
  @ApiResponse({
    status: 200,
    description: 'Country fetched successfully',
  })
  @ApiResponse({ status: 400, description: 'Country not found' })
  async getCountryByCode(@Param('isoCode') isoCode: string) {
    return this.locationService.getCountryByCode(isoCode);
  }

  @Get('states')
  @ApiOperation({ summary: 'Get states by country code' })
  @ApiQuery({ name: 'countryCode', description: 'Country ISO code', example: 'IN', required: true })
  @ApiResponse({
    status: 200,
    description: 'States fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'States fetched successfully',
        data: [
          {
            s_no: 1,
            name: 'Karnataka',
            iso_code: 'KA',
            country_code: 'IN',
            latitude: 15.3173,
            longitude: 75.7139,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'countryCode is required' })
  async getStatesByCountry(@Query('countryCode') countryCode: string) {
    return this.locationService.getStatesByCountry(countryCode);
  }

  @Get('states/:id')
  @ApiOperation({ summary: 'Get state by ID' })
  @ApiParam({ name: 'id', description: 'State ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'State fetched successfully',
  })
  @ApiResponse({ status: 400, description: 'State not found' })
  async getStateById(@Param('id', ParseIntPipe) id: number) {
    return this.locationService.getStateById(id);
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get cities by state code' })
  @ApiQuery({ name: 'stateCode', description: 'State ISO code', example: 'KA', required: true })
  @ApiResponse({
    status: 200,
    description: 'Cities fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Cities fetched successfully',
        data: [
          {
            s_no: 1,
            name: 'Bangalore',
            country_code: 'IN',
            state_code: 'KA',
            latitude: 12.9716,
            longitude: 77.5946,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'stateCode is required' })
  async getCitiesByState(@Query('stateCode') stateCode: string) {
    return this.locationService.getCitiesByState(stateCode);
  }

  @Get('cities/:id')
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiParam({ name: 'id', description: 'City ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'City fetched successfully',
  })
  @ApiResponse({ status: 400, description: 'City not found' })
  async getCityById(@Param('id', ParseIntPipe) id: number) {
    return this.locationService.getCityById(id);
  }
}
