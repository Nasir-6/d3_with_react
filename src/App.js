import logo from './logo.svg';
import './App.css';
import React from 'react'
import ReactDom from 'react-dom'
import { Face } from './components/Face';
import { Colors } from './components/Colors';
import { Sunburst } from './components/Sunburst';
import { DataProcessor } from './components/EAIData/DataProcessor';
import { Icicle } from './components/Icicle';
import { Sunburst_unravel } from './components/Sunburst_unravel';


function App() {
  
  return (
    <div className="App" style={{display: "flex"}}>
      {/* <Face/> */}
      {/* <Colors/> */}
      {/* <Sunburst/> */}
      {/* <Icicle/> */}
      <Sunburst_unravel/>
      <DataProcessor/>


    </div>
  );
}

export default App;
