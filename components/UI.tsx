
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = "rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    outline: "bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

// Fixed: Card now correctly extends React.HTMLAttributes<HTMLDivElement> to support event handlers and other standard props
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => {
  const displayMessage = React.useMemo(() => {
    try {
      const parsed = JSON.parse(message);
      return parsed.error?.message || parsed.message || message;
    } catch (e) {
      return message;
    }
  }, [message]);

  return (
    <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs font-medium">{displayMessage}</span>
    </div>
  );
};
