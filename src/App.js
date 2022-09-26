import logo from './logo.svg';
import './App.css';
import React from 'react'
import ReactDom from 'react-dom'
import {arc} from 'd3'

console.log(arc)
function App() {

  const width = 960;
  const height = 500;
  const centerX = width/2;
  const centerY = height/2;
  const strokeWidth = 10;
  const eyeOffsetX = 90;
  const eyeOffsetY = 100;
  const eyeRadius = 50;
  
  return (
    <div className="App">
     <svg width={width} height={height}>
      <circle
      cx={centerX}
      cy={centerY}
      r={centerY-strokeWidth/2}
      fill="yellow"
      stroke='black'
      stroke-width={strokeWidth}
      />
      <circle
      cx={centerX - eyeOffsetX}
      cy={centerY - eyeOffsetY}
      r={eyeRadius}
      />
       <circle
      cx={centerX + eyeOffsetX}
      cy={centerY - eyeOffsetY}
      r={eyeRadius}
      />
     </svg>
    </div>
  );
}

export default App;
