import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";

interface Props {
  suggestion: string | null;
  visible: boolean;
  onAccept: (text: string) => void;
}

export const SearchSuggestion = ({ suggestion, visible, onAccept }: Props) => {
  return (
    <AnimatePresence>
      {visible && suggestion && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 mt-2 z-50"
        >
          <div className="bg-white/90 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => onAccept(suggestion)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50/80 transition-colors text-left group"
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500 text-sm">Did you mean:</span>
              <span className="text-slate-800 font-semibold text-sm">{suggestion}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};