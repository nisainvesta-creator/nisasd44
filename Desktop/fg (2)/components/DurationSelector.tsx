
import React from 'react';

interface DurationSelectorProps {
  onDurationChange: (duration: string) => void;
  defaultDuration: string;
  className?: string;
  disabled?: boolean;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({ onDurationChange, defaultDuration, className, disabled }) => {
  const durations = ["24H", "7D", "30D"];

  return (
    <div className={`flex justify-center space-x-2 ${className}`}>
      {durations.map(duration => (
        <button
          key={duration}
          onClick={() => !disabled && onDurationChange(duration)}
          disabled={disabled}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
            defaultDuration === duration
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          {duration}
        </button>
      ))}
    </div>
  );
};
