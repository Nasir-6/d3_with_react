import logo from './logo.svg';
import './App.css';
import React from 'react'
import ReactDom from 'react-dom'
import { Face } from './components/pilot/Face';
import { Colors } from './components/pilot/Colors';
import { Sunburst } from './components/pilot/Sunburst';
import { DataProcessor } from './components/data/DataProcessor';
import { Icicle } from './components/Icicle';


function App() {
  
  return (
    <div className="App" style={{display: "flex"}}>
      {/* <Face/> */}
      {/* <Sunburst/> */}
      <Icicle/>
      {/* <DataProcessor> */}
    </div>
  );
}

export default App;
