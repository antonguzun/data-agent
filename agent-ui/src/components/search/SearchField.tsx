'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { useDataSources } from '@/hooks/useDataSources';
import { useConfig } from '@/hooks/useConfig';

interface Suggestion {
  id: string;
  name: string;
  index: number;
}

export const SearchField: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { dataSources } = useDataSources();
  const { config } = useConfig();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const pollHypothesisStatus = async (hypothesisId: string) => {
    try {
      const response = await fetch(`/api/hypothesis/${hypothesisId}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        setIsLoading(false);
        router.push(`/hypothesis/${hypothesisId}`);
      } else if (data.status === 'pending' || data.status === 'processing') {
        setTimeout(() => pollHypothesisStatus(hypothesisId), 500); // Poll every 0.5 seconds
      } else if (data.status === 'failed') {
        setIsLoading(false);
        message.error('Hypothesis generation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error polling hypothesis status:', error);
      setIsLoading(false);
      message.error('Error checking hypothesis status');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('Please enter a search query');
      return;
    }

    // Extract datasource names from query (words starting with @)
    const mentionedNames = searchQuery.match(/@(\w+)/g)?.map(name => name.slice(1)) || [];
    
    // Find matching datasource IDs from dataSources
    const datasourceIds = dataSources
      .filter(ds => mentionedNames.includes(ds.name))
      .map(ds => ds._id);

    if (mentionedNames.length > 0 && datasourceIds.length === 0) {
      message.warning('No valid datasources found in query');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/hypothesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          datasourceIds
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create hypothesis');
      }

      const data = await response.json();
      pollHypothesisStatus(data.hypothesisId);
    } catch (error) {
      console.error('Error during search:', error);
      setIsLoading(false);
      message.error('Search failed. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Check for @ symbol and show suggestions
    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const query = value.slice(lastAtSymbol + 1).toLowerCase();
      const filtered = dataSources
        .filter(ds => ds.name.toLowerCase().includes(query))
        .map((ds, index) => ({
          id: ds._id,
          name: ds.name,
          index
        }));
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const insertSuggestion = (suggestion: Suggestion) => {
    const lastAtSymbol = searchQuery.lastIndexOf('@');
    const newQuery = searchQuery.slice(0, lastAtSymbol) + '@' + suggestion.name + ' ';
    setSearchQuery(newQuery);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleGenerateQuery = async () => {
    // Extract datasource IDs from current query
    const mentionedNames = searchQuery.match(/@(\w+)/g)?.map(name => name.slice(1)) || [];
    const datasourceIds = dataSources
      .filter(ds => mentionedNames.includes(ds.name))
      .map(ds => ds._id);

    if (datasourceIds.length === 0) {
      message.warning('Please select at least one datasource using @');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await fetch(`${config.agentUrl}/generate-hypothesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ datasourceIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate query');
      }

      const data = await response.json();
      console.log('Generated query:', data);
      setSearchQuery(searchQuery + ' ' + data.hypothesis_main_idea || '');
    } catch (error) {
      console.error('Error generating query:', error);
      message.error('Failed to generate query. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if any datasources are mentioned in the query
  const hasDatasources = useMemo(() => {
    const mentionedNames = searchQuery.match(/@(\w+)/g)?.map(name => name.slice(1)) || [];
    return mentionedNames.length > 0;
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">General Agent Search</h1>
      <div className="mt-4 bg-white shadow-lg rounded-lg p-6">
        <div className="flex flex-col space-y-4 relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your search query... (Use @ to mention datasource)"
            className="w-full p-3 border border-gray-300 rounded-md text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`px-4 py-2 cursor-pointer text-gray-600 hover:bg-gray-100 ${
                    index === selectedIndex ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => insertSuggestion(suggestion)}
                >
                  {suggestion.name}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {hasDatasources && (
              <button
                onClick={handleGenerateQuery}
                disabled={isGenerating}
                className={`flex-1 bg-green-600 text-white py-3 px-6 rounded-md transition-colors duration-200 
                  ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
              >
                {isGenerating ? 'Generating...' : 'Generate Query'}
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className={`flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md transition-colors duration-200 
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
            >
              {isLoading ? 'Processing...' : 'Search'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
