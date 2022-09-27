import logo from './logo.svg';
import './App.css';
import React from 'react'
import ReactDom from 'react-dom'
import { Face } from './components/Face';
import { Colors } from './components/Colors';
import { Sunburst } from './components/Sunburst';


function App() {
  
  return (
    <div className="App">
      {/* <Face/> */}
      {/* <Colors/> */}
      <Sunburst/>


    </div>
  );
}

export default App;
