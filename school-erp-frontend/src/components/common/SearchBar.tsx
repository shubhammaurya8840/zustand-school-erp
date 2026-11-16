'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search students, classes, records...',
  className = '',
  onSearch,
}) => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearch) onSearch(val);
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) onSearch('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3.5 pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 bg-white/70 hover:bg-white/90 focus:bg-white/95 backdrop-blur-md border border-white/90 focus:border-indigo-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 shadow-2xs transition-all"
      />

      {query ? (
        <button
          onClick={handleClear}
          className="absolute right-3 p-0.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          type="button"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="hidden sm:flex absolute right-2.5 items-center gap-0.5 px-1.5 py-0.5 bg-slate-100/80 border border-slate-200/60 rounded text-[10px] text-slate-400 font-mono">
          <span>⌘K</span>
        </div>
      )}
    </div>
  );
};

