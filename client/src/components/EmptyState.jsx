import React from 'react';

/**
 * EmptyState component displayed when there is no data to show.
 * @param {React.ComponentType} icon - Lucide-react icon component
 * @param {string} title - Main header message
 * @param {string} description - Brief message clarifying how to resolve
 * @param {string} actionLabel - Text of the action button
 * @param {Function} onAction - Click handler for the action button
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-border-default rounded-xl p-12 shadow-sm text-center max-w-xl mx-auto w-full">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-text-secondary mb-4">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-md">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors duration-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
