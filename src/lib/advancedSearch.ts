// ============================================================================
// ADVANCED SEARCH ENGINE WITH FILTERS AND FACETS
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/lib/cache';

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in' | 'is' | 'not_is';
  value: any;
  logic?: 'and' | 'or';
}

export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchFacet {
  field: string;
  label: string;
  type: 'terms' | 'range' | 'date_range' | 'boolean';
  values?: Array<{ value: any; label: string; count: number }>;
  min?: number;
  max?: number;
  dateMin?: string;
  dateMax?: string;
}

export interface AdvancedSearchQuery {
  table: string;
  query?: string; // Free text search
  filters: SearchFilter[];
  sorts: SearchSort[];
  facets: string[]; // Fields to generate facets for
  page: number;
  pageSize: number;
  includeDeleted?: boolean;
}

export interface SearchResult<T> {
  data: T[];
  totalCount: number;
  facets: SearchFacet[];
  searchTime: number;
  query: AdvancedSearchQuery;
}

class AdvancedSearchEngine {
  private searchableFields: Record<string, string[]> = {
    patients: [
      'name', 'labno', 'provisionaldiagnosis', 'referringphysician',
      'medical_history', 'allergies', 'medications'
    ],
    bookings: [
      'test_type', 'notes', 'status'
    ],
    enhanced_allergy_tests: [
      'interpretation', 'recommendations'
    ],
    test_sessions: [
      'test_type', 'allergen', 'notes'
    ]
  };

  private facetFields: Record<string, string[]> = {
    patients: ['sex', 'age', 'provisionaldiagnosis', 'referringphysician', 'dateoftesting'],
    bookings: ['status', 'test_type', 'appointment_date', 'duration_minutes'],
    enhanced_allergy_tests: ['is_completed', 'is_reviewed', 'test_date'],
    test_sessions: ['test_type', 'test_result', 'test_date']
  };

  async search<T>(query: AdvancedSearchQuery): Promise<SearchResult<T>> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(query);
    const cached = cacheManager.staticData.get(cacheKey);
    if (cached) {
      return cached as SearchResult<T>;
    }

    try {
      // Build the base query
      let supabaseQuery = supabase
        .from(query.table)
        .select('*', { count: 'exact' });

      // Apply filters
      supabaseQuery = this.applyFilters(supabaseQuery, query.filters);

      // Apply free text search
      if (query.query) {
        supabaseQuery = this.applyTextSearch(supabaseQuery, query.table, query.query);
      }

      // Apply sorting
      query.sorts.forEach(sort => {
        supabaseQuery = supabaseQuery.order(sort.field, { ascending: sort.direction === 'asc' });
      });

      // Apply pagination
      const from = (query.page - 1) * query.pageSize;
      const to = from + query.pageSize - 1;
      supabaseQuery = supabaseQuery.range(from, to);

      // Execute main query
      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      // Generate facets
      const facets = await this.generateFacets(query);

      const result: SearchResult<T> = {
        data: data || [],
        totalCount: count || 0,
        facets,
        searchTime: Date.now() - startTime,
        query
      };

      // Cache the result
      cacheManager.staticData.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes

      return result;
    } catch (error) {
      throw new Error(`Advanced search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private applyFilters(query: any, filters: SearchFilter[]): any {
    let result = query;
    
    filters.forEach((filter, index) => {
      const { field, operator, value, logic = 'and' } = filter;
      
      switch (operator) {
        case 'eq':
          result = result.eq(field, value);
          break;
        case 'neq':
          result = result.neq(field, value);
          break;
        case 'gt':
          result = result.gt(field, value);
          break;
        case 'gte':
          result = result.gte(field, value);
          break;
        case 'lt':
          result = result.lt(field, value);
          break;
        case 'lte':
          result = result.lte(field, value);
          break;
        case 'like':
          result = result.like(field, value);
          break;
        case 'ilike':
          result = result.ilike(field, `%${value}%`);
          break;
        case 'in':
          result = result.in(field, Array.isArray(value) ? value : [value]);
          break;
        case 'not_in':
          result = result.not(field, 'in', Array.isArray(value) ? value : [value]);
          break;
        case 'is':
          result = result.is(field, value);
          break;
        case 'not_is':
          result = result.not(field, 'is', value);
          break;
      }
    });

    return result;
  }

  private applyTextSearch(query: any, table: string, searchText: string): any {
    const searchableFields = this.searchableFields[table] || [];
    
    if (searchableFields.length === 0) {
      return query;
    }

    // Create OR condition for all searchable fields
    const orConditions = searchableFields.map(field => `${field}.ilike.%${searchText}%`);
    return query.or(orConditions.join(','));
  }

  private async generateFacets(query: AdvancedSearchQuery): Promise<SearchFacet[]> {
    const facetFields = this.facetFields[query.table] || [];
    const requestedFacets = query.facets.filter(f => facetFields.includes(f));
    
    const facets: SearchFacet[] = [];

    for (const facetField of requestedFacets) {
      try {
        const facet = await this.generateSingleFacet(query.table, facetField, query.filters);
        if (facet) {
          facets.push(facet);
        }
      } catch (error) {
        console.warn(`Failed to generate facet for ${facetField}:`, error);
      }
    }

    return facets;
  }

  private async generateSingleFacet(
    table: string,
    field: string,
    existingFilters: SearchFilter[]
  ): Promise<SearchFacet | null> {
    // Remove filters for the current facet field to get all possible values
    const otherFilters = existingFilters.filter(f => f.field !== field);
    
    let query = supabase
      .from(table)
      .select(field, { count: 'exact' });

    query = this.applyFilters(query, otherFilters);

    const { data, error } = await query;

    if (error || !data) {
      return null;
    }

    // Determine facet type based on field and data
    const facetType = this.determineFacetType(field, data);
    
    switch (facetType) {
      case 'terms':
        return this.generateTermsFacet(field, data);
      
      case 'range':
        return this.generateRangeFacet(field, data);
      
      case 'date_range':
        return this.generateDateRangeFacet(field, data);
      
      case 'boolean':
        return this.generateBooleanFacet(field, data);
      
      default:
        return null;
    }
  }

  private determineFacetType(field: string, data: any[]): 'terms' | 'range' | 'date_range' | 'boolean' {
    // Check if field contains dates
    if (field.includes('date') || field.includes('_at')) {
      return 'date_range';
    }

    // Check if field is boolean
    const firstValue = data.find(item => item[field] !== null)?.[field];
    if (typeof firstValue === 'boolean') {
      return 'boolean';
    }

    // Check if field is numeric and has wide range
    if (typeof firstValue === 'number') {
      const values = data.map(item => item[field]).filter(v => v !== null);
      const uniqueValues = new Set(values);
      
      if (uniqueValues.size > 10) {
        return 'range';
      }
    }

    return 'terms';
  }

  private generateTermsFacet(field: string, data: any[]): SearchFacet {
    const valueCounts = new Map<any, number>();
    
    data.forEach(item => {
      const value = item[field];
      if (value !== null && value !== undefined) {
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
      }
    });

    const values = Array.from(valueCounts.entries())
      .map(([value, count]) => ({ value, label: String(value), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Limit to top 20 values

    return {
      field,
      label: this.getFieldLabel(field),
      type: 'terms',
      values
    };
  }

  private generateRangeFacet(field: string, data: any[]): SearchFacet {
    const values = data
      .map(item => item[field])
      .filter(v => v !== null && v !== undefined && typeof v === 'number');

    if (values.length === 0) {
      return {
        field,
        label: this.getFieldLabel(field),
        type: 'range',
        min: 0,
        max: 0
      };
    }

    return {
      field,
      label: this.getFieldLabel(field),
      type: 'range',
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  private generateDateRangeFacet(field: string, data: any[]): SearchFacet {
    const dates = data
      .map(item => item[field])
      .filter(v => v !== null && v !== undefined)
      .map(v => new Date(v))
      .filter(d => !isNaN(d.getTime()));

    if (dates.length === 0) {
      return {
        field,
        label: this.getFieldLabel(field),
        type: 'date_range',
        dateMin: new Date().toISOString().split('T')[0],
        dateMax: new Date().toISOString().split('T')[0]
      };
    }

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());

    return {
      field,
      label: this.getFieldLabel(field),
      type: 'date_range',
      dateMin: sortedDates[0].toISOString().split('T')[0],
      dateMax: sortedDates[sortedDates.length - 1].toISOString().split('T')[0]
    };
  }

  private generateBooleanFacet(field: string, data: any[]): SearchFacet {
    const trueCount = data.filter(item => item[field] === true).length;
    const falseCount = data.filter(item => item[field] === false).length;

    return {
      field,
      label: this.getFieldLabel(field),
      type: 'boolean',
      values: [
        { value: true, label: 'Yes', count: trueCount },
        { value: false, label: 'No', count: falseCount }
      ]
    };
  }

  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      // Patient fields
      name: 'Patient Name',
      age: 'Age',
      sex: 'Gender',
      labno: 'Lab Number',
      dateoftesting: 'Test Date',
      provisionaldiagnosis: 'Diagnosis',
      referringphysician: 'Referring Physician',
      
      // Booking fields
      status: 'Status',
      test_type: 'Test Type',
      appointment_date: 'Appointment Date',
      duration_minutes: 'Duration (minutes)',
      
      // Test fields
      is_completed: 'Completed',
      is_reviewed: 'Reviewed',
      test_date: 'Test Date',
      test_result: 'Result'
    };

    return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateCacheKey(query: AdvancedSearchQuery): string {
    return `search_${query.table}_${JSON.stringify(query)}`;
  }

  // Get suggestions for autocomplete
  async getSuggestions(table: string, field: string, query: string, limit: number = 10): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(field)
        .ilike(field, `%${query}%`)
        .not(field, 'is', null)
        .limit(limit);

      if (error || !data) {
        return [];
      }

      const suggestions = data
        .map(item => item[field])
        .filter((value, index, array) => array.indexOf(value) === index) // Remove duplicates
        .filter(value => value && typeof value === 'string')
        .sort();

      return suggestions;
    } catch (error) {
      console.warn(`Failed to get suggestions for ${field}:`, error);
      return [];
    }
  }

  // Get search history
  getSearchHistory(): AdvancedSearchQuery[] {
    try {
      const history = localStorage.getItem('search_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  // Save search to history
  saveSearchToHistory(query: AdvancedSearchQuery): void {
    try {
      const history = this.getSearchHistory();
      const newHistory = [query, ...history.filter(h => 
        JSON.stringify(h) !== JSON.stringify(query)
      )].slice(0, 20); // Keep last 20 searches

      localStorage.setItem('search_history', JSON.stringify(newHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }
}

// Export singleton instance
export const advancedSearchEngine = new AdvancedSearchEngine();

// React hook for advanced search
export function useAdvancedSearch<T>(initialQuery: AdvancedSearchQuery) {
  const [query, setQuery] = React.useState<AdvancedSearchQuery>(initialQuery);
  const [result, setResult] = React.useState<SearchResult<T> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const search = React.useCallback(async (searchQuery?: AdvancedSearchQuery) => {
    const queryToUse = searchQuery || query;
    setLoading(true);
    setError(null);

    try {
      const searchResult = await advancedSearchEngine.search<T>(queryToUse);
      setResult(searchResult);
      advancedSearchEngine.saveSearchToHistory(queryToUse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const updateQuery = React.useCallback((updates: Partial<AdvancedSearchQuery>) => {
    setQuery(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    query,
    result,
    loading,
    error,
    search,
    updateQuery,
    setQuery
  };
}

export default advancedSearchEngine;