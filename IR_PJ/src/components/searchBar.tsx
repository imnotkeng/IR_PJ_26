import React, { useState, useEffect, useRef } from 'react';
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useSearch } from '../hooks/useSearch';
import { useSearchStore } from '@/store/searchStore';
import { SearchSuggestion } from './SearchSuggestion';
import heroImage from "@/assets/hero-food.jpg";


export const SearchBar = () => {
  const [localQuery, setLocalQuery] = useState('');
  const { handleSearch, fetchSuggestion, acceptSuggestion } = useSearch();
  const { suggestion, query } = useSearchStore();
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuggestion = (
  (isFocused && localQuery.trim().length >= 2) ||
  (query && localQuery === query)  // หลัง search เสร็จ
) && !!suggestion;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (localQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestion(localQuery);
      }, 400);
    } else {
      // Clear old suggestion when query is too short
      useSearchStore.getState().setSuggestion(null);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localQuery]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFocused(false);
    handleSearch(localQuery);
  };

  const handleAccept = (text: string) => {
    setLocalQuery(text);
    setIsFocused(false);
    acceptSuggestion(text);
  };

  return (
    <section className="relative min-h-[75vh] md:min-h-[92vh] flex items-center justify-center overflow-hidden rounded-b-[3rem] mb-12 shadow-sm">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Delicious food background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/70 to-slate-900/80" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center text-center px-6 pt-16">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-6xl md:text-8xl font-bold text-white leading-tight mb-6"
        >
          Discover & Save
          <br />
          <span className="text-blue-400">Flavors</span> You Love
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-slate-200 text-xl md:text-2xl mb-10 max-w-2xl"
        >
          Search thousands of recipes, bookmark your favorites, and get
          personalized recommendations tailored to your taste.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative w-full max-w-2xl"  // ← relative here so dropdown positions correctly
        >
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-lg"
          >
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="w-6 h-6 text-white/70 shrink-0" />
              {/* ✅ Input only — no SearchSuggestion inside here */}
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                placeholder="Search dishes, ingredients, or process..."
                className="w-full bg-transparent text-white placeholder:text-white/60 outline-none text-base py-3"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-blue-600 transition-colors whitespace-nowrap shadow-md"
            >
              Search
            </button>
          </form>

          {/* ✅ Only ONE SearchSuggestion, outside the form, inside the relative wrapper */}
          <SearchSuggestion
            suggestion={suggestion}
            visible={showSuggestion}
            onAccept={handleAccept}
          />
        </motion.div>
      </div>
    </section>
  );
};