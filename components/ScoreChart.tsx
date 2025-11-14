
import React from 'react';

interface ScoreChartProps {
  data: { date: string; score: number; fluencyScore: number }[];
}

export const ScoreChart: React.FC<ScoreChartProps> = ({ data }) => {
  if (!data || data.length < 2) {
    return <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-8">Need at least two sessions to show a trend.</div>;
  }

  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const x = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const y = (score: number) => padding.top + chartHeight - (score / 100) * chartHeight;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.score)}`).join(' ');
  const fluencyLinePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.fluencyScore)}`).join(' ');

  const areaPath = `${linePath} L${x(data.length - 1)},${height - padding.bottom} L${padding.left},${height - padding.bottom} Z`;
  const fluencyAreaPath = `${fluencyLinePath} L${x(data.length - 1)},${height - padding.bottom} L${padding.left},${height - padding.bottom} Z`;

  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-axis labels and grid lines */}
        {[0, 25, 50, 75, 100].map(score => (
          <g key={score}>
            <line x1={padding.left} y1={y(score)} x2={width - padding.right} y2={y(score)} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
            <text x={padding.left - 8} y={y(score)} dy="0.32em" textAnchor="end" className="text-xs fill-current text-gray-500 dark:text-gray-400">
              {score}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
            // Show fewer labels if there are many data points
            if (data.length > 10 && i % Math.floor(data.length / 5) !== 0 && i !== data.length - 1) {
                return null;
            }
            return (
                 <text key={i} x={x(i)} y={height - padding.bottom + 15} textAnchor="middle" className="text-xs fill-current text-gray-500 dark:text-gray-400">
                    {formatDate(d.date)}
                 </text>
            )
        })}

        {/* Gradients for areas */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fluencyAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Areas under the lines */}
        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={fluencyAreaPath} fill="url(#fluencyAreaGradient)" />

        {/* Lines */}
        <path d={linePath} stroke="#818CF8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={fluencyLinePath} stroke="#2DD4BF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <circle cx={x(i)} cy={y(d.score)} r="3" fill="#818CF8" className="cursor-pointer" />
            <circle cx={x(i)} cy={y(d.fluencyScore)} r="3" fill="#2DD4BF" className="cursor-pointer" />
          </React.Fragment>
        ))}
      </svg>
        <div className="flex justify-center items-center space-x-4 mt-2 text-xs">
            <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-indigo-400 mr-1.5"></span>
                <span className="text-gray-600 dark:text-gray-300">Accuracy</span>
            </div>
            <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-teal-400 mr-1.5"></span>
                <span className="text-gray-600 dark:text-gray-300">Fluency</span>
            </div>
        </div>
    </div>
  );
};