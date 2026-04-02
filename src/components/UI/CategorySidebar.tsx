import type { Category } from '../../types';

interface CategorySidebarProps {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategorySidebar({
  categories,
  selected,
  onSelect,
}: CategorySidebarProps) {
  return (
    <div
      className="w-28 flex-shrink-0 overflow-y-auto no-scrollbar h-full py-2"
      style={{
        background: 'rgba(0,0,0,0.3)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {categories.map((cat) => {
        const isActive = selected === cat.category_id;
        return (
          <button
            key={cat.category_id}
            onClick={() => onSelect(cat.category_id)}
            className="w-full text-left px-3 py-2.5 text-xs transition-all border-l-2"
            style={{
              borderLeftColor: isActive ? '#00d4ff' : 'transparent',
              background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
              color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.55)',
              fontWeight: isActive ? '600' : '400',
            }}
          >
            {cat.category_name}
          </button>
        );
      })}
    </div>
  );
}
