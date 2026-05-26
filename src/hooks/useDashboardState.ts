import { useCallback, useEffect, useState } from 'react'
import type { ApiConnection, ApiNode, TopologyFilterOptions } from '../types/topology'

export const useDashboardState = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedElement, setSelectedElement] = useState<ApiNode | ApiConnection | null>(null);
  const [filters, setFilters] = useState<TopologyFilterOptions>({
    searchQuery: '',
    states: [],
    types: [],
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleFilterChange = useCallback((newFilters: TopologyFilterOptions) => {
    setFilters(newFilters);
    setSelectedElement(null); 
  }, []);

  return {
    theme,
    toggleTheme,
    selectedElement,
    setSelectedElement,
    filters,
    handleFilterChange,
  };
};