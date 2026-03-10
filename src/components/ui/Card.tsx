import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg shadow p-6 transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}
