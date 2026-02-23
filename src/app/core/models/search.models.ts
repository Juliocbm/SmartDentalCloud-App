/**
 * Modelos para búsqueda global
 */

export interface GlobalSearchResult {
  term: string;
  totalResults: number;
  categories: SearchCategory[];
}

export interface SearchCategory {
  category: string;
  icon: string;
  route: string;
  count: number;
  items: SearchResultItem[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  extra?: string;
  route: string;
}
