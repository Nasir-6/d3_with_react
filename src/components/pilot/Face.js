import React from 'react'
import { arc } from 'd3'

export const Face = () => {

    const width = 960;
  const height = 500;
  const centerX = width/2;
  const centerY = height/2;
  const strokeWidth = 10;
  const eyeOffsetX = 90;
  const eyeOffsetY = 100;
  const eyeRadius = 50;
  const mouthWidth = 20;
  const mouthRadius = 140;

  const mouthArc = arc()
    .innerRadius(mouthRadius)
    .outerRadius(mouthRadius + mouthWidth)
    .startAngle(Math.PI / 2)
    .endAngle(Math.PI * 3 / 2);

  return (
    <>
        <svg width={width} height={height}>
      <g transform={`translate(${centerX}, ${centerY})`}>
        <circle
        r={centerY-strokeWidth/2}
        fill="yellow"
        stroke='black'
        strokeWidth={strokeWidth}
        />
        <circle
        cx={- eyeOffsetX}
        cy={- eyeOffsetY}
        r={eyeRadius}
        />
        <circle
        cx={eyeOffsetX}
        cy={- eyeOffsetY}
        r={eyeRadius}
        />
        <path d={mouthArc()}/>
      </g>
     </svg>

     <svg height="100rem" width="20rem">
      {/* NO units is px */}
      <rect height="100" width="300"></rect>
     </svg>
    </>


  )
}
