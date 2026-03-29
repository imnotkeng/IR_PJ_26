import React from 'react';
import { Bookmark, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { Recipe } from '../types/recipe';
import { formatDuration } from '@/lib/utils';

interface Props {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
  onBookmarkClick: (recipe: Recipe) => void; 
  index?: number;
}



export const RecipeCard = ({ recipe, onClick, onBookmarkClick, index = 0 }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      onClick={() => onClick(recipe)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 shrink-0">
        <img
          src={recipe.image_url}
          alt={recipe.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = "https://placehold.co/600x600?text=No+Image" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Bookmark button */}
        <button 
          className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white hover:scale-110 shadow-sm z-10"
          onClick={(e) => {
            e.stopPropagation(); // Prevents opening the RecipeModal
            onBookmarkClick(recipe); 
          }}
          title="Save Recipe"
        >
          <Bookmark className="w-5 h-5" />
        </button>

        <span className="absolute top-3 left-3 px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-sm">
          Recipe
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-display text-lg font-bold text-slate-800 mb-3 line-clamp-2">
          {recipe.name}
        </h3>
        
        {recipe.steps && (
          <p 
            className="text-sm text-slate-500 mb-4 line-clamp-2 flex-grow"
            dangerouslySetInnerHTML={{ __html: recipe.steps }} 
          />
        )}

        <div className="flex items-center justify-between text-slate-500 text-sm font-medium border-t border-slate-50 pt-4 mt-auto">

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{formatDuration(recipe.minutes)}</span>
          </div>

                     <span>Score: {recipe.score.toFixed(2)}</span>
       
        </div>
      </div>
    </motion.div>
  );
};