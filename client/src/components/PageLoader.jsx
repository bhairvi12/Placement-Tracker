import React from 'react';

/**
 * Full page loading loader spinner.
 */
export const PageLoader = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      {/* Outer spinning border ring */}
      <div className="w-12 h-12 border-4 border-orange-100 border-t-primary rounded-full animate-spin"></div>
      {/* Label */}
      <p className="mt-4 text-sm font-medium text-text-secondary tracking-wide animate-pulse">
        Loading...
      </p>
    </div>
  );
};

export default PageLoader;
