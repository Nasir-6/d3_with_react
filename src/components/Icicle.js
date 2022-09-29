import { arc, format, hierarchy, partition } from "d3";
// Color imports
import { scaleOrdinal, quantize, interpolateRainbow } from "d3";
// imports for chart
import { interpolate, select } from "d3";
import { useEffect, useRef } from "react";

// read in data - Replace with some fetch request eventually!
// import data from '../data.json'
// import data from '../Originaldata-Tony.json'
// import data from "../myData.json";
// import data from "../newCategoriesData.json";
import data from "../newWeightedCategories.json";

export const Icicle = () => {
  const WIDTH = 975;
  const HEIGHT = 1000;

  var formatData = format(",d");

  var setColor = scaleOrdinal(
    quantize(interpolateRainbow, data.children.length + 1)
  );

  var partitionData = (data) => {
    const root = hierarchy(data)
    .sum((d) => d.value) // sum the values - so can get total value and split
    .sort((a, b) => b.height - a.height || b.value - a.value); // sort so first one starting at 12:00 is the largest module

    return partition().size([HEIGHT, ((root.height + 1) * WIDTH) / 3])(root);
  };

  // creating the actual chart - REMEMBER TO CALL IT
  var chart = () => {
    const root = partitionData(data);
    let focus = root;

  const svg = select("svg")
      .attr("viewBox", [0, 0, WIDTH, HEIGHT])
      .style("font", "8px sans-serif")
      .style("width", "50vw")
      // .style("height", "100vh");

  const cell = svg
    .selectAll("g")
    .data(root.descendants())
    .join("g")
      .attr("transform", d => `translate(${d.y0},${d.x0})`);

  const rect = cell.append("rect")
      .attr("width", d => d.y1 - d.y0 - 1)
      .attr("height", d => rectHeight(d))
      .attr("fill-opacity", 0.6)
      .attr("fill", d => {
        if (!d.depth) return "#ccc";
        while (d.depth > 1) d = d.parent;
        return setColor(d.data.name);
      })
      .style("cursor", "pointer")
      .on("click", clicked);

  const text = cell.append("text")
      .style("user-select", "none")
      .attr("pointer-events", "none")
      .attr("x", 4)
      .attr("y", 13)
      .attr("fill-opacity", d => +labelVisible(d));

  text.append("tspan")
      .text(d => d.data.name);

  const tspan = text.append("tspan")
      .attr("fill-opacity", d => labelVisible(d) * 0.7)
      .text(d => ` ${formatData(d.value)}`);

  cell.append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${formatData(d.value)}`);

  function clicked(event, p) {
    focus = focus === p ? p = p.parent : p;

    root.each(d => d.target = {
      x0: (d.x0 - p.x0) / (p.x1 - p.x0) * HEIGHT,
      x1: (d.x1 - p.x0) / (p.x1 - p.x0) * HEIGHT,
      y0: d.y0 - p.y0,
      y1: d.y1 - p.y0
    });

    const t = cell.transition().duration(750)
        .attr("transform", d => `translate(${d.target.y0},${d.target.x0})`);

    rect.transition(t).attr("height", d => rectHeight(d.target));
    text.transition(t).attr("fill-opacity", d => +labelVisible(d.target));
    tspan.transition(t).attr("fill-opacity", d => labelVisible(d.target) * 0.7);
  }
  
  function rectHeight(d) {
    return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
  }

  function labelVisible(d) {
    return d.y1 <= WIDTH && d.y0 >= 0 && d.x1 - d.x0 > 16;
  }
  
  return svg.node();
  };

  // render chart - using the function! - useRef used to do only on first mount - react v18 mounts twice in dev mode!
  const effectRan = useRef(false);
  useEffect(() => {
    if (effectRan.current === false) chart();
    effectRan.current = true;
  }, []);

  return (
    <div>
      <h1>Icicle</h1>
      
        <svg></svg>
      
    </div>
  );
};
