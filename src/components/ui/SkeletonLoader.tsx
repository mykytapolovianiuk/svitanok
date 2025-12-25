import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}


export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
}


export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-sm border border-black overflow-hidden flex flex-col">
      {}
      <Skeleton className="w-full h-64" variant="rectangular" />
      
      {}
      <div className="p-4 space-y-3">
        {}
        <Skeleton className="h-5 w-3/4" variant="text" />
        
        {}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-20" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
        </div>
        
        {}
        <Skeleton className="h-10 w-full" variant="rectangular" />
      </div>
    </div>
  );
}


export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}


export function ProductPageSkeleton() {
  return (
    <div className="bg-[#FFF2E1] min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {}
          <div className="space-y-4">
            <Skeleton className="w-full h-96" variant="rectangular" />
            <div className="flex space-x-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20" variant="rectangular" />
              ))}
            </div>
          </div>
          
          {}
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" variant="text" />
            <Skeleton className="h-6 w-1/2" variant="text" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-3/4" variant="text" />
            </div>
            <Skeleton className="h-12 w-full" variant="rectangular" />
            <Skeleton className="h-12 w-full" variant="rectangular" />
          </div>
        </div>
      </div>
    </div>
  );
}


export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-24" variant="text" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton className="h-4 w-full" variant="text" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <Skeleton className="h-4 w-24 mb-2" variant="text" />
      <Skeleton className="h-8 w-32 mb-1" variant="text" />
      <Skeleton className="h-3 w-16" variant="text" />
    </div>
  );
}


export function OrderListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-5 w-32" variant="text" />
            <Skeleton className="h-6 w-20" variant="rectangular" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-4 w-1/2" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}


export function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-8 w-48" variant="text" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" variant="rectangular" />
          <Skeleton className="h-12 w-full" variant="rectangular" />
          <Skeleton className="h-12 w-full" variant="rectangular" />
          <Skeleton className="h-32 w-full" variant="rectangular" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" variant="text" />
        <Skeleton className="h-12 w-full" variant="rectangular" />
        <Skeleton className="h-12 w-full" variant="rectangular" />
      </div>
    </div>
  );
}

export default Skeleton;



