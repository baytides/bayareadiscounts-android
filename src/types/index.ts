/**
 * TypeScript type definitions for Bay Area Discounts API
 * Matches the static JSON API structure from the main website
 */

export interface Program {
  id: string;
  name: string;
  category: string;
  description: string;
  eligibility: string[];
  areas: string[];
  website: string;
  cost: string | null;
  phone: string | null;
  email: string | null;
  requirements: string | null;
  howToApply: string | null;
  lastUpdated: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  programCount: number;
}

export interface Eligibility {
  id: string;
  name: string;
  description: string;
  icon: string;
  programCount: number;
}

export interface Area {
  id: string;
  name: string;
  type: 'county' | 'region' | 'state' | 'nationwide';
  programCount: number;
}

export interface ProgramsResponse {
  total: number;
  count: number;
  offset: number;
  programs: Program[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface EligibilityResponse {
  eligibility: Eligibility[];
}

export interface AreasResponse {
  areas: Area[];
}

export interface APIMetadata {
  version: string;
  generatedAt: string;
  totalPrograms: number;
  endpoints: {
    programs: string;
    categories: string;
    eligibility: string;
    areas: string;
    singleProgram: string;
  };
}

export interface FilterState {
  categories: string[];
  eligibility: string[];
  areas: string[];
  searchQuery: string;
}

export interface FavoriteProgram {
  id: string;
  savedAt: string;
}
