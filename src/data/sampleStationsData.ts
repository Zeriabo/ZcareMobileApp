import { CarWashingProgram, Station } from '../redux/types/stationsActionTypes';

// Unsplash image URLs for car wash stations and programs
const STATION_IMAGES = {
  hero1: 'https://images.unsplash.com/photo-1601584942197-04bbb2f9a0fe?w=800&h=300&fit=crop',
  hero2: 'https://images.unsplash.com/photo-1612521534857-11452d16a336?w=800&h=300&fit=crop',
  hero3: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=800&h=300&fit=crop',
  logo1: 'https://images.unsplash.com/photo-1599198339316-8a3efcda8e8f?w=200&h=200&fit=crop',
  logo2: 'https://images.unsplash.com/photo-1584820927082-4f5cbb70a9ac?w=200&h=200&fit=crop',
  logo3: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=200&fit=crop',
};

const PROGRAM_IMAGES = {
  basic: 'https://images.unsplash.com/photo-1601584942197-04bbb2f9a0fe?w=400&h=300&fit=crop',
  standard: 'https://images.unsplash.com/photo-1612521534857-11452d16a336?w=400&h=300&fit=crop',
  premium: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=400&h=300&fit=crop',
  deluxe: 'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=400&h=300&fit=crop',
  interior: 'https://images.unsplash.com/photo-1485286893118-76a27e88c96c?w=400&h=300&fit=crop',
};

export const SAMPLE_STATIONS: Station[] = [
  {
    id: 'station_1',
    name: 'Downtown Wash Center',
    address: '123 Main St, Downtown',
    latitude: 40.7128,
    longitude: -74.006,
    programs: [],
    media: {
      picture: STATION_IMAGES.hero1,
      logo: STATION_IMAGES.logo1,
    },
  },
  {
    id: 'station_2',
    name: 'Premium Auto Spa',
    address: '456 Park Ave, Midtown',
    latitude: 40.768,
    longitude: -73.9804,
    programs: [],
    media: {
      picture: STATION_IMAGES.hero2,
      logo: STATION_IMAGES.logo2,
    },
  },
  {
    id: 'station_3',
    name: 'Quick Wash Express',
    address: '789 Broadway, Uptown',
    latitude: 40.8088,
    longitude: -73.9282,
    programs: [],
    media: {
      picture: STATION_IMAGES.hero3,
      logo: STATION_IMAGES.logo3,
    },
  },
];

export const SAMPLE_PROGRAMS: CarWashingProgram[] = [
  {
    id: 1,
    name: 'Basic Wash',
    price: 15,
    programType: 'BASIC',
    media: {
      picture: PROGRAM_IMAGES.basic,
    },
  },
  {
    id: 2,
    name: 'Standard Wash',
    price: 25,
    programType: 'STANDARD',
    media: {
      picture: PROGRAM_IMAGES.standard,
    },
  },
  {
    id: 3,
    name: 'Premium Wash',
    price: 35,
    programType: 'PREMIUM',
    media: {
      picture: PROGRAM_IMAGES.premium,
    },
  },
  {
    id: 4,
    name: 'Deluxe Package',
    price: 50,
    programType: 'DELUXE',
    media: {
      picture: PROGRAM_IMAGES.deluxe,
    },
  },
  {
    id: 5,
    name: 'Interior Vacuum',
    price: 20,
    programType: 'INTERIOR',
    media: {
      picture: PROGRAM_IMAGES.interior,
    },
  },
];

/**
 * Get sample stations with their associated programs
 * Useful for testing UI without backend connectivity
 */
export const getSampleStationsWithPrograms = (): Station[] => {
  return SAMPLE_STATIONS.map(station => ({
    ...station,
    programs: SAMPLE_PROGRAMS,
  }));
};

/**
 * Merge backend stations with demo images for missing media
 * If a station doesn't have pictures, use demo images
 */
export const enrichStationsWithDemoImages = (stations: any[]): Station[] => {
  const demoImages = [STATION_IMAGES.hero1, STATION_IMAGES.hero2, STATION_IMAGES.hero3];
  const demoLogos = [STATION_IMAGES.logo1, STATION_IMAGES.logo2, STATION_IMAGES.logo3];

  return stations.map((station, index) => ({
    ...station,
    media: {
      picture: station.media?.picture || demoImages[index % demoImages.length],
      logo: station.media?.logo || demoLogos[index % demoLogos.length],
    },
  }));
};

/**
 * Merge backend programs with demo images for missing media
 * If a program doesn't have a picture, use a demo image
 */
export const enrichProgramsWithDemoImages = (programs: any[]): CarWashingProgram[] => {
  const demoImages = Object.values(PROGRAM_IMAGES);

  return programs.map((program, index) => ({
    ...program,
    media: {
      picture: program.media?.picture || demoImages[index % demoImages.length],
    },
  }));
};
