import React from 'react';

interface EdgeRayLoaderProps {
  /**
   * Color of the ray light
   * @default "rgb(59, 130, 246)" // blue-500
   */
  color?: string;
  
  /**
   * Duration of one complete cycle in seconds
   * @default 1.5
   */
  duration?: number;
  
  /**
   * Length of the ray as percentage of edge
   * @default 15
   */
  rayLength?: number;
  
  /**
   * Blur intensity of the glow effect
   * @default 8
   */
  blur?: number;

  /**
   * Thickness of the ray in pixels
   * @default 2
   */
  thickness?: number;
}

export default function EdgeRayLoader({
  color = "rgb(59, 130, 246)",
  duration = 1.5,
  rayLength = 15,
  blur = 8,
  thickness = 1
}: EdgeRayLoaderProps) {
  const gradientId = `rayGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
      <svg 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          
          <filter id={`glow-${gradientId}`}>
            <feGaussianBlur stdDeviation={blur} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Top edge */}
        <rect
          x="0"
          y="0"
          width={`${rayLength}%`}
          height={thickness}
          fill={`url(#${gradientId})`}
          filter={`url(#glow-${gradientId})`}
        >
          <animate
            attributeName="x"
            values="-15%;100%;100%;100%;100%"
            keyTimes="0;0.25;0.5;0.75;1"
            dur={`${duration}s`}
            repeatCount="indefinite"
          />
        </rect>
        
        {/* Right edge */}
        <rect
          x="100%"
          y="0"
          width={thickness}
          height={`${rayLength}%`}
          fill={`url(#${gradientId})`}
          filter={`url(#glow-${gradientId})`}
          transform="translate(-2, 0)"
        >
          <animate
            attributeName="y"
            values="100%;-15%;100%;100%;100%"
            keyTimes="0;0.25;0.5;0.75;1"
            dur={`${duration}s`}
            repeatCount="indefinite"
          />
        </rect>
        
        {/* Bottom edge */}
        <rect
          x="100%"
          y="100%"
          width={`${rayLength}%`}
          height={thickness}
          fill={`url(#${gradientId})`}
          filter={`url(#glow-${gradientId})`}
          transform="translate(0, -2)"
        >
          <animate
            attributeName="x"
            values="100%;100%;115%;-15%;100%"
            keyTimes="0;0.25;0.5;0.75;1"
            dur={`${duration}s`}
            repeatCount="indefinite"
          />
        </rect>
        
        {/* Left edge */}
        <rect
          x="0"
          y="100%"
          width={thickness}
          height={`${rayLength}%`}
          fill={`url(#${gradientId})`}
          filter={`url(#glow-${gradientId})`}
        >
          <animate
            attributeName="y"
            values="100%;100%;100%;115%;-15%"
            keyTimes="0;0.25;0.5;0.75;1"
            dur={`${duration}s`}
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  );
}
