import React from 'react';

/**
 * skeleton loading pulse animation component.
 * @param {number} lines - The number of text skeleton bars to render (default is 3)
 */
export const SkeletonCard = ({ lines = 3 }) => {
  return (
    <div className="bg-white border border-border-default rounded-xl p-6 shadow-sm w-full animate-pulse">
      {/* Title skeleton block */}
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
      
      {/* Dynamic line skeleton blocks */}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`h-3 bg-gray-200 rounded ${
              idx === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonCard;
