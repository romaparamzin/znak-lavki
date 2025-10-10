import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const baseStyles = 'bg-white rounded-lg shadow';

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const styles = `${baseStyles} ${paddingStyles[padding]} ${className}`;

  return <div className={styles}>{children}</div>;
}


