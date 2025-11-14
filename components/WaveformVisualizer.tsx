
import React from 'react';

interface WaveformVisualizerProps {
  userData: number[];
  nativeData: number[];
}

const generatePath = (data: number[], width: number, height: number): string => {
  if (!data || data.length === 0) {
    return "M 0,0";
  }

  const step = width / (data.length - 1);
  const maxVal = 100; // The data is expected to be between 0 and 100

  let path = `M 0,${height - (data[0] / maxVal) * height}`;
  data.forEach((point, i) => {
    if (i > 0) {
      const x = i * step;
      const y = height - (point / maxVal) * height;
      path += ` L ${x},${y}`;
    }
  });

  return path;
};

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ userData, nativeData }) => {
  const width = 200;
  const height = 60;

  const userPath = generatePath(userData, width, height);
  const nativePath = generatePath(nativeData, width, height);

  return (
    <div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <path d={nativePath} stroke="#34D399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={userPath} stroke="#818CF8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex justify-center items-center space-x-4 mt-2 text-xs">
            <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-indigo-400 mr-1.5"></span>
                <span className="text-gray-600 dark:text-gray-300">You</span>
            </div>
            <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-emerald-400 mr-1.5"></span>
                 <span className="text-gray-600 dark:text-gray-300">Native</span>
            </div>
        </div>
    </div>

  );
};
