import React, { useState, useEffect, useRef } from 'react';
import { candidateApi } from '../../services/candidateApi';

interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
}

interface Suggestion {
  suggestion: string;
  type: 'job_title' | 'company' | 'skill' | 'location';
  frequency: number;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  isVisible,
  onSuggestionClick,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2 && isVisible) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query, isVisible]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      // Temporarily disable suggestions to fix search issue
      setSuggestions([]);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isVisible || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          onSuggestionClick(suggestions[selectedIndex].suggestion);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job_title':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
          </svg>
        );
      case 'company':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'skill':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'location':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'job_title': return 'Job';
      case 'company': return 'Company';
      case 'skill': return 'Skill';
      case 'location': return 'Location';
      default: return 'Search';
    }
  };

  if (!isVisible || (query.length < 2 && suggestions.length === 0)) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
    >
      {loading ? (
        <div className="p-4 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="py-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.suggestion}-${index}`}
              onClick={() => onSuggestionClick(suggestion.suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              {getTypeIcon(suggestion.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.suggestion}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {suggestion.frequency} jobs
                  </span>
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {getTypeLabel(suggestion.type)}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : query.length >= 2 ? (
        <div className="p-4 text-center text-sm text-gray-500">
          No suggestions found for "{query}"
        </div>
      ) : null}
    </div>
  );
};

export default SearchSuggestions;
