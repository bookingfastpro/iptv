interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export default function LoadingSpinner({
  size = 'md',
  color = '#00d4ff',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full animate-spin ${className}`}
      style={{
        borderColor: `${color}33`,
        borderTopColor: color,
        borderStyle: 'solid',
      }}
      role="status"
      aria-label="Chargement..."
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-white/50">Chargement...</p>
      </div>
    </div>
  );
}
