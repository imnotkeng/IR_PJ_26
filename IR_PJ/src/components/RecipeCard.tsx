import React from 'react';
import { Bookmark, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { Recipe } from '../types/recipe';

interface Props {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
  index?: number;
}

const formatDuration = (duration: string | number) => {
  if (typeof duration === 'number') return `${duration} mins`;
  if (!duration || !duration.toString().startsWith('PT')) return duration;

  const str = duration.toString();
  let hours = 0;
  let minutes = 0;

  const hourMatch = str.match(/(\d+)H/);
  const minuteMatch = str.match(/(\d+)M/);

  if (hourMatch) hours = parseInt(hourMatch[1], 10);
  if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);

  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(' ') : '0 mins';
};

export const RecipeCard = ({ recipe, onClick, index = 0 }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      onClick={() => onClick(recipe)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
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
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white"
          onClick={(e) => {
            e.stopPropagation(); // กันไม่ให้คลิกปุ่มนี้แล้วไปเปิด Modal
            // ใส่ logic save bookmark ตรงนี้
          }}
        >
          <Bookmark className="w-4 h-4" />
        </button>

        {/* Category badge (ถ้า API ไม่มีข้อมูลหมวดหมู่ สามารถลบออกได้) */}
        <span className="absolute top-3 left-3 px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-sm">
          Recipe
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-slate-800 mb-3 line-clamp-1">
          {recipe.name}
        </h3>
        
        {/* โชว์ Snippet สั้นๆ */}
        {recipe.steps && (
          <p 
            className="text-sm text-slate-500 mb-4 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: recipe.steps }} 
          />
        )}

        <div className="flex items-center justify-between text-slate-500 text-sm font-medium border-t border-slate-50 pt-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>4.5</span> {/* ฮาร์ดโค้ดไว้ก่อน หรือเปลี่ยนใช้ข้อมูลจาก API */}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{formatDuration(recipe.minutes)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};