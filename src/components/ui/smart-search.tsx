import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, X, Clock, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartSearchProps {
  data: unknown[];
  searchFields: string[];
  onResults: (results: unknown[]) => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  className?: string;
}

interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greater' | 'less';
  value: string;
  label: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  data,
  searchFields,
  onResults,
  placeholder = "Search...",
  suggestions = [],
  recentSearches = [],
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(recentSearches);

  // Smart search with fuzzy matching
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() && activeFilters.length === 0) {
      return data;
    }

    return data.filter((item) => {
      // Text search across specified fields
      const textMatch = searchFields.some(field => {
        const value = (item as Record<string, unknown>)[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });

      // Apply active filters
      const filterMatch = activeFilters.every(filter => {
        const value = (item as Record<string, unknown>)[filter.field];
        if (typeof value === 'string') {
          switch (filter.operator) {
            case 'equals':
              return value.toLowerCase() === filter.value.toLowerCase();
            case 'contains':
              return value.toLowerCase().includes(filter.value.toLowerCase());
            case 'startsWith':
              return value.toLowerCase().startsWith(filter.value.toLowerCase());
            case 'endsWith':
              return value.toLowerCase().endsWith(filter.value.toLowerCase());
            default:
              return true;
          }
        }
        return true;
      });

      return textMatch && filterMatch;
    });
  }, [data, searchTerm, searchFields, activeFilters]);

  useEffect(() => {
    onResults(searchResults);
  }, [searchResults, onResults]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() && !searchHistory.includes(value.trim())) {
      setSearchHistory(prev => [value.trim(), ...prev.slice(0, 4)]);
    }
  };

  const addFilter = (filter: SearchFilter) => {
    setActiveFilters(prev => [...prev, filter]);
  };

  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSearchTerm('');
    setActiveFilters([]);
  };

  // Smart suggestions based on data
  const smartSuggestions = useMemo(() => {
    const fieldSuggestions = searchFields.flatMap(field => {
      const values = data.map(item => (item as Record<string, unknown>)[field])
        .filter(value => typeof value === 'string')
        .slice(0, 5);
      return values as string[];
    });
    
    return [...new Set([...suggestions, ...fieldSuggestions])].slice(0, 8);
  }, [data, searchFields, suggestions]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          onFocus={() => setShowSuggestions(true)}
        />
        
        {/* Quick Actions */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="font-medium">Quick Filters</h4>
                <div className="grid grid-cols-2 gap-2">
                  {searchFields.map(field => (
                    <Button
                      key={field}
                      variant="outline"
                      size="sm"
                      onClick={() => addFilter({
                        field,
                        operator: 'contains',
                        value: searchTerm || '',
                        label: `${field} contains "${searchTerm}"`
                      })}
                      disabled={!searchTerm}
                    >
                      {field}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {(searchTerm || activeFilters.length > 0) && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearAll}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Smart Suggestions Dropdown */}
        {showSuggestions && (smartSuggestions.length > 0 || searchHistory.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {searchHistory.length > 0 && (
              <div className="p-2 border-b">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
                <div className="flex flex-wrap gap-1">
                  {searchHistory.map((term, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        handleSearch(term);
                        setShowSuggestions(false);
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {smartSuggestions.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Zap className="h-3 w-3" />
                  Suggestions
                </div>
                <div className="space-y-1">
                  {smartSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 hover:bg-muted rounded cursor-pointer text-sm"
                      onClick={() => {
                        handleSearch(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {filter.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => removeFilter(index)}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Stats */}
      {(searchTerm || activeFilters.length > 0) && (
        <div className="text-sm text-muted-foreground flex items-center justify-between">
          <span>
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span className="text-xs">Smart search active</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Hook for using smart search
export const useSmartSearch = <T,>(
  data: T[],
  searchFields: (keyof T)[],
  initialTerm = ''
) => {
  const [results, setResults] = useState<T[]>(data);
  const [searchTerm, setSearchTerm] = useState(initialTerm);

  const SearchComponent = useMemo(() => (
    <SmartSearch
      data={data}
      searchFields={searchFields as string[]}
      onResults={(newResults) => setResults(newResults as T[])}
      placeholder={`Search ${searchFields.join(', ')}...`}
    />
  ), [data, searchFields]);

  return {
    results,
    searchTerm,
    setSearchTerm,
    SearchComponent
  };
};