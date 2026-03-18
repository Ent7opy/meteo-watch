import { useState, useMemo } from 'react';

/**
 * Manages filter state and derives the filtered warning list.
 *
 * @param {Array} warnings - Full warning list from useWarnings
 * @returns Filter state, setters, and the computed filteredWarnings array
 */
export function useFilters(warnings) {
  const [filterType,     setFilterType]     = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');

  const filteredWarnings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return warnings.filter(w => {
      const matchesType     = filterType     === 'all' || w.type     === filterType;
      const matchesSeverity = filterSeverity === 'all' || w.severity === filterSeverity;
      const matchesSearch   = w.region.toLowerCase().includes(q) ||
                              w.country.toLowerCase().includes(q);
      return matchesType && matchesSeverity && matchesSearch;
    });
  }, [warnings, filterType, filterSeverity, searchQuery]);

  return {
    filterType,     setFilterType,
    filterSeverity, setFilterSeverity,
    searchQuery,    setSearchQuery,
    filteredWarnings,
  };
}
