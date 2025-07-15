import React from 'react';

interface CategoryTabsProps {
  activeTab: string;
  onTabChange: (category: string) => void;
}

const categories = [
  "TUTTI I VINI",
  "BOLLICINE ITALIANE",
  "BOLLICINE FRANCESI", 
  "BIANCHI",
  "ROSSI",
  "ROSATI",
  "VINI DOLCI",
];

export default function CategoryTabs({ activeTab, onTabChange }: CategoryTabsProps) {
  // Rileva se siamo su mobile
  const isMobile = window.innerWidth <= 768;

  return (
    <div className={`bg-black/30 border-b border-red-900/30 ${isMobile ? 'px-1 py-1' : 'px-4 py-4'}`}>
      <div className="max-w-full mx-auto">
        <div className={`flex items-center justify-center ${isMobile ? 'gap-1' : 'flex-wrap gap-2'}`}>
          {categories.map((category) => {
            // Abbreviazioni per mobile
            const displayText = isMobile ? 
              (category === "TUTTI I VINI" ? "TUTTI" :
               category === "BOLLICINE ITALIANE" ? "BOLL IT" :
               category === "BOLLICINE FRANCESI" ? "BOLL FR" :
               category === "BIANCHI" ? "BIANCHI" :
               category === "ROSSI" ? "ROSSI" :
               category === "ROSATI" ? "ROSATI" :
               category === "VINI DOLCI" ? "DOLCI" : category) 
              : category;

            return (
              <button
                key={category}
                onClick={() => onTabChange(category)}
                className={`${isMobile ? 'px-1.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} font-semibold transition-all duration-200 border-2 ${
                  activeTab === category
                    ? "bg-amber-700 text-cream border-amber-500 shadow-lg"
                    : "bg-brown-800/60 text-cream/80 border-brown-600/40 hover:bg-brown-700/70 hover:border-brown-500/60"
                }`}
                style={{
                  backgroundColor: activeTab === category ? "#b45309" : "#5d2f0a80",
                  borderColor: activeTab === category ? "#f59e0b" : "#8b4513aa",
                  minWidth: isMobile ? '45px' : 'auto',
                  whiteSpace: 'nowrap',
                  borderRadius: '8px'
                }}
              >
                {displayText}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}