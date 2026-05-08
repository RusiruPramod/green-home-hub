import React, { useState, useEffect } from 'react';

interface LiveBadgeProps {
  label?: string;
  isSyncing?: boolean;
  syncTime?: number;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ 
  label = 'Live', 
  isSyncing = false,
  syncTime = 0
}) => {
  const [isConnected, setIsConnected] = useState(!isSyncing);
  const [dotColor, setDotColor] = useState(isSyncing ? 'bg-red-500' : 'bg-green-500');
  const [displayLabel, setDisplayLabel] = useState(isSyncing ? 'Syncing...' : label);

  useEffect(() => {
    if (isSyncing) {
      setDotColor('bg-red-500');
      setDisplayLabel(`Syncing... ${syncTime}s`);
      setIsConnected(false);
    } else {
      setDotColor('bg-green-500');
      setDisplayLabel(label);
      setIsConnected(true);
    }
  }, [isSyncing, syncTime, label]);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full text-white ${
      isSyncing ? 'bg-gray-700' : 'bg-green-600'
    }`}>
      {/* Status Indicator Dot */}
      <div className={`flex items-center justify-center`}>
        <div className={`w-2 h-2 rounded-full ${dotColor} ${
          isConnected ? 'animate-pulse' : ''
        }`} />
      </div>
      {/* Label */}
      <span>{displayLabel}</span>
    </div>
  );
};

export default LiveBadge;
