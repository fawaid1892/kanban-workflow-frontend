import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Table ─── */

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="w-full overflow-auto">
        <table
          ref={ref}
          className={cn('w-full border-collapse text-sm', className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
);

Table.displayName = 'Table';

/* ─── TableHeader ─── */

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('bg-gray-50', className)}
        {...props}
      >
        {children}
      </thead>
    );
  },
);

TableHeader.displayName = 'TableHeader';

/* ─── TableBody ─── */

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn('', className)}
        {...props}
      >
        {children}
      </tbody>
    );
  },
);

TableBody.displayName = 'TableBody';

/* ─── TableRow ─── */

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100',
          className,
        )}
        {...props}
      >
        {children}
      </tr>
    );
  },
);

TableRow.displayName = 'TableRow';

/* ─── TableHead ─── */

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'h-10 px-4 text-left align-middle font-medium text-gray-500',
          className,
        )}
        {...props}
      >
        {children}
      </th>
    );
  },
);

TableHead.displayName = 'TableHead';

/* ─── TableCell ─── */

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn('p-4 align-middle', className)}
        {...props}
      >
        {children}
      </td>
    );
  },
);

TableCell.displayName = 'TableCell';

/* ─── EmptyState (internal helper for Table when empty) ─── */

export interface TableEmptyProps {
  colSpan?: number;
  message?: string;
}

const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan = 1,
  message = 'No data',
}) => {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-gray-400"
      >
        {message}
      </TableCell>
    </TableRow>
  );
};

TableEmpty.displayName = 'TableEmpty';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty };
