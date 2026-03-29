
import { type CarouselRecipe} from '@/types/recipe'

interface Props {
  title: string;
  subtitle: string;
  recipes: CarouselRecipe[];
  isLoading: boolean;
onRecipeClick: (recipe: CarouselRecipe) => void;
}

export const RecipeCarousel = ({ title, subtitle, recipes, isLoading, onRecipeClick }: Props) => {

  if (isLoading) {
    return (
      <div className="mt-12 px-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="min-w-[260px] h-64 bg-gray-200 rounded-2xl shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (recipes.length === 0) return null; // Hide if no recipes

  return (
    <div className="mt-12 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-500 mb-6">{subtitle}</p>

      {/* Tailwind CSS Carousel */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 -mx-6 px-6 hide-scrollbar">
        {recipes.map((rec) => (
          <div 
            key={rec.id}
            onClick={() => onRecipeClick(rec)}
            className="snap-start shrink-0 w-[260px] sm:w-[280px] group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="relative h-48 overflow-hidden bg-slate-100">
              <img
                src={rec.image_url}
                alt={rec.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.currentTarget.src = "https://placehold.co/600x400?text=No+Image" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {rec.prediction_score && (
                <div className="absolute top-3 right-3 bg-purple-600 text-white flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                  Similarity: {rec.prediction_score.toFixed(2)}
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-display text-lg font-bold text-slate-800 line-clamp-2">
                {rec.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};