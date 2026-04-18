import React from 'react';

interface LiveBadgeProps {
  label?: string;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ label = 'Live' }) => {
  return (
    <div className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs bg-green-500 text-white font-medium rounded-full">
      {label}
    </div>
  );
};

export default LiveBadge;
