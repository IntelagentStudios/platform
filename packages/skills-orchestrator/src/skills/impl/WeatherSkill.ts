/**
 * Weather Skill
 * Provides weather information (mock implementation for now)
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';

export class WeatherSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'weather',
    name: 'Weather Information',
    description: 'Get current weather and forecasts',
    category: SkillCategory.UTILITY,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['weather', 'forecast', 'temperature'],
    examples: [
      {
        description: 'Get weather for a city',
        params: { city: 'London' }
      },
      {
        description: 'Get weather by coordinates',
        params: { lat: 51.5074, lon: -0.1278 }
      }
    ]
  };
  
  validate(params: SkillParams): boolean {
    return !!(params.city || (params.lat && params.lon));
  }
  
  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      this.log('Fetching weather information');
      
      if (!this.validate(params)) {
        return this.error('Please provide either a city name or coordinates (lat, lon)');
      }
      
      // Mock weather data for now
      // In production, this would call a weather API
      const location = params.city || `${params.lat}, ${params.lon}`;
      
      const mockWeather = {
        location,
        current: {
          temperature: Math.floor(Math.random() * 30) + 10,
          feels_like: Math.floor(Math.random() * 30) + 10,
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 40) + 40,
          wind_speed: Math.floor(Math.random() * 20) + 5,
          wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
        },
        forecast: [
          {
            day: 'Tomorrow',
            high: Math.floor(Math.random() * 30) + 15,
            low: Math.floor(Math.random() * 15) + 5,
            condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)]
          },
          {
            day: 'Day After',
            high: Math.floor(Math.random() * 30) + 15,
            low: Math.floor(Math.random() * 15) + 5,
            condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)]
          }
        ],
        unit: 'Celsius',
        timestamp: new Date().toISOString(),
        note: 'This is mock data. In production, real weather API will be used.'
      };
      
      return this.success(mockWeather, {
        source: 'mock',
        cached: false
      });
      
    } catch (error: any) {
      this.log(`Weather error: ${error.message}`, 'error');
      return this.error(`Failed to fetch weather: ${error.message}`);
    }
  }
}