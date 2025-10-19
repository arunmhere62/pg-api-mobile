import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all countries
   */
  async getCountries() {
    try {
      const countries = await this.prisma.country.findMany({
        select: {
          s_no: true,
          name: true,
          iso_code: true,
          flag: true,
          phone_code: true,
          currency: true,
          latitude: true,
          longitude: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        message: 'Countries fetched successfully',
        data: countries,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch countries');
    }
  }

  /**
   * Get states by country code
   */
  async getStatesByCountry(countryCode: string) {
    if (!countryCode) {
      throw new BadRequestException('countryCode is required');
    }

    try {
      const states = await this.prisma.state.findMany({
        where: {
          country_code: countryCode,
        },
        select: {
          s_no: true,
          name: true,
          iso_code: true,
          country_code: true,
          latitude: true,
          longitude: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        message: 'States fetched successfully',
        data: states,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch states');
    }
  }

  /**
   * Get cities by state code
   */
  async getCitiesByState(stateCode: string) {
    if (!stateCode) {
      throw new BadRequestException('stateCode is required');
    }

    try {
      const cities = await this.prisma.city.findMany({
        where: {
          state_code: stateCode,
        },
        select: {
          s_no: true,
          name: true,
          country_code: true,
          state_code: true,
          latitude: true,
          longitude: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        message: 'Cities fetched successfully',
        data: cities,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch cities');
    }
  }

  /**
   * Get a specific country by ISO code
   */
  async getCountryByCode(isoCode: string) {
    if (!isoCode) {
      throw new BadRequestException('isoCode is required');
    }

    try {
      const country = await this.prisma.country.findUnique({
        where: {
          iso_code: isoCode,
        },
        select: {
          s_no: true,
          name: true,
          iso_code: true,
          flag: true,
          phone_code: true,
          currency: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!country) {
        throw new BadRequestException('Country not found');
      }

      return {
        success: true,
        message: 'Country fetched successfully',
        data: country,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch country');
    }
  }

  /**
   * Get a specific state by ID
   */
  async getStateById(stateId: number) {
    if (!stateId) {
      throw new BadRequestException('stateId is required');
    }

    try {
      const state = await this.prisma.state.findUnique({
        where: {
          s_no: stateId,
        },
        select: {
          s_no: true,
          name: true,
          iso_code: true,
          country_code: true,
          latitude: true,
          longitude: true,
          country: {
            select: {
              name: true,
              iso_code: true,
            },
          },
        },
      });

      if (!state) {
        throw new BadRequestException('State not found');
      }

      return {
        success: true,
        message: 'State fetched successfully',
        data: state,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch state');
    }
  }

  /**
   * Get a specific city by ID
   */
  async getCityById(cityId: number) {
    if (!cityId) {
      throw new BadRequestException('cityId is required');
    }

    try {
      const city = await this.prisma.city.findUnique({
        where: {
          s_no: cityId,
        },
        select: {
          s_no: true,
          name: true,
          country_code: true,
          state_code: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!city) {
        throw new BadRequestException('City not found');
      }

      return {
        success: true,
        message: 'City fetched successfully',
        data: city,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch city');
    }
  }
}
