// Search Components Export
export { default as GlobalSearchEngine } from './GlobalSearchEngine';
export { default as AdvancedFilters } from './AdvancedFilters';
export { SearchAnalyticsDashboard, useSearchAnalytics, searchAnalytics } from './SearchAnalytics';

// Types
export type { FilterOptions } from './AdvancedFilters';

// Search Engine Interface
export interface SearchEngineConfig {
  enableAnalytics: boolean;
  enableAdvancedFilters: boolean;
  maxResults: number;
  debounceMs: number;
  highlightMatches: boolean;
  enableAutoComplete: boolean;
}

export const DEFAULT_SEARCH_CONFIG: SearchEngineConfig = {
  enableAnalytics: true,
  enableAdvancedFilters: true,
  maxResults: 12,
  debounceMs: 300,
  highlightMatches: true,
  enableAutoComplete: true
};