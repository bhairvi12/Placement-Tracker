import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * StatCard component with left-accent border.
 * @param {string} title - Card header label
 * @param {string|number} value - Primary statistic numeric value
 * @param {string} subtitle - Optional details below number
 * @param {React.ComponentType} icon - Optional top right icon
 * @param {string} trend - 'up' or 'down' trend indicator
 * @param {string|number} trendValue - Value of the trend (e.g. "12%")
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}) => {
  return (
    <div className="bg-white border-l-4 border-l-primary border-y border-r border-border-default rounded-r-xl rounded-l-md p-6 shadow-sm flex flex-col justify-between min-h-[140px] relative">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {title}
        </span>
        {Icon && <Icon className="w-5 h-5 text-text-secondary" />}
      </div>

      {/* Middle value row */}
      <div className="my-2">
        <span className="text-3xl font-semibold text-text-primary tracking-tight">
          {value}
        </span>
      </div>

      {/* Bottom details row */}
      <div className="flex items-center space-x-1.5 text-xs">
        {trend && trendValue && (
          <span
            className={`flex items-center font-medium ${
              trend === 'up' ? 'text-success' : 'text-danger'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trendValue}
          </span>
        )}
        {subtitle && <span className="text-text-secondary">{subtitle}</span>}
      </div>
    </div>
  );
};

export default StatCard;
