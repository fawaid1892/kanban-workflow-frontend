import React from 'react';
import { cn } from '@/lib/utils';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, left, right, children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'flex h-14 items-center justify-between border-b bg-white px-6',
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-2">{left}</div>
        <div className="flex items-center gap-2">{right}</div>
        {children}
      </nav>
    );
  },
);

Navbar.displayName = 'Navbar';

export { Navbar };
