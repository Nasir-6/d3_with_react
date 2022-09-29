import { arc, format, hierarchy, partition } from 'd3';
// color imports 
import { scaleOrdinal, quantize, interpolateRainbow } from 'd3';
// imports for chart 
import { interpolate, select } from 'd3';
import {useEffect, useRef} from 'react'

// read in data - Replace with some fetch request eventually!
// import data from '../data.json'
// import data from '../Originaldata-Tony.json'
// import data from '../myData.json'
// import data from '../newCategoriesData.json'
import data from '../newWeightedCategories.json'

export const Sunburst = () => {

    const WIDTH = 1730;      // seems to adjust the text-container/text size - smaller value - larger text etc.
    const RADIUS = WIDTH / 6    // Sets radius of circle - /6 seems to fit perfect - why?

    var myArc = arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(RADIUS * 1.5)
    .innerRadius(d => d.y0 * RADIUS)
    .outerRadius(d => Math.max(d.y0 * RADIUS, d.y1 * RADIUS - 1))

    var formatData = format(",d")

    var setColor = scaleOrdinal(quantize(interpolateRainbow, data.children.length + 1))

    var partitionData = data => {
        const root = hierarchy(data)
            .sum(d => d.value)  // sum the values - so can get total value and split
            .sort((a, b) => b.value - a.value);     // sort so first one starting at 12:00 is the largest module 

        return partition().size([2 * Math.PI, root.height + 1])(root);
    }

    // creating the actual chart - REMEMBER TO CALL IT
    var chart = () => {

      const root = partitionData(data);
    //   console.log('root', root)
    //   console.log('root.descendants().slice(1)', root.descendants().slice(1))

      root.each((d) => (d.current = d));

      // select svg tag and set attributes - note in Observe D3 example they use create - can try it later
      const svg = select("svg")
        .attr("viewBox", [0, 0, WIDTH, WIDTH])
        .style("font", "20px sans-serif")
        // .style("height", "80vh")
        .style("width", "50vw");
    //   console.log("svg", svg);

      const g = svg
        .append("g")
        .attr("transform", `translate(${WIDTH / 2},${WIDTH / 2})`);

      const path = g
        .append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr("fill", (d) => {
          while (d.depth > 1) d = d.parent;
          return setColor(d.data.name);
        })
        .attr("fill-opacity", (d) =>
          arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
        )
        .attr("pointer-events", (d) =>
          arcVisible(d.current) ? "auto" : "none"
        )

        .attr("d", (d) => myArc(d.current));

      path
        .filter((d) => d.children)
        .style("cursor", "pointer")
        .on("click", clicked);

      path.append("title").text(
        (d) =>
          `${d
            .ancestors()
            .map((d) => d.data.name)
            .reverse()
            .join("/")}\n${formatData(d.value)}`
      );

      const label = g
        .append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))      // sets data to all the array elements ignoring first one which is EAI curriculum which is not on the chart!
        .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", (d) => +labelVisible(d.current))
        .attr("transform", (d) => labelTransform(d.current))
        .text((d) => d.data.name)
        // ADD IN ??
        .call(wrap, 900);

      const parent = g
        .append("circle")
        .datum(root)
        .attr("r", RADIUS)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", clicked);

      // FUNCTIONS NEEDED ABOVE
      function clicked(event, p) {
        parent.datum(p.parent || root);
        // ADD IN ??
        // window.parent.postMessage(p, '*');

        root.each(
          (d) =>
            (d.target = {
              x0:
                Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
              x1:
                Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
              y0: Math.max(0, d.y0 - p.depth),
              y1: Math.max(0, d.y1 - p.depth),
            })
        );

        const t = g.transition().duration(750);

        // Transition the data on all arcs, even the ones that aren’t visible,
        // so that if this transition is interrupted, entering arcs will start
        // the next transition from the desired position.
        path
          .transition(t)
          .tween("data", (d) => {
            const i = interpolate(d.current, d.target);
            return (t) => (d.current = i(t));
          })
          .filter(function (d) {
            return +this.getAttribute("fill-opacity") || arcVisible(d.target);
          })
          .attr("fill-opacity", (d) =>
            arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
          )
          .attr("pointer-events", (d) =>
            arcVisible(d.target) ? "auto" : "none"
          )

          .attrTween("d", (d) => () => myArc(d.current));

        label
          .filter(function (d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
          })
          .transition(t)
          .attr("fill-opacity", (d) => +labelVisible(d.target))
          .attrTween("transform", (d) => () => labelTransform(d.current));
      }

      function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
      }

      function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
      }

      function labelTransform(d) {
        const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
        const y = ((d.y0 + d.y1) / 2) * (RADIUS);
        return `rotate(${x - 90}) translate(${y},0) rotate(${
          x < 180 ? 0 : 180
        })`;
      }


      function wrap(text, width) {
        text.each(function() {
          var text = select(this),
              words = text.text().split(/\s+/).reverse(),       //Splits and reverses - so can pop off the end!
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 0.8, // ems
              y = text.attr("y"),
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em"),
              hasMoved = false;

              word = words.pop();
          while ((word)) {  // whilst you got words to pop - keep going! - ALSO Added hasMoved to make it stop
            line.push(word);
            tspan.text(line.join(" "));
            // if (tspan.node().getComputedTextLength() > width) {
            // console.log('tspan.text()', tspan.text())
            // console.log('tspan.text().length > 45', tspan.text().length > 45)
            if (tspan.text().length > 40) {     // If current length is more than 45 chars - turn it into a variable??
              line.pop();       // remove last word
              tspan.text(line.join(" "));   // Join the array of words by adding in space in between
            //   console.log('tspan.text()', tspan.text())
            //   console.log('line', line)
              line = [word];
            //   console.log('line After [word]', line)
              if (!hasMoved) {
                tspan.attr('dy', (dy - 0.5) + 'em');    // move it down a bit?? what is dy
                hasMoved = true;                        // the text has now moved
              }
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineHeight + "em").text(word);
              // TO ADD EPLISES MAKE SURE WHILE STATEMENT HAS && !hasMoved
            //   tspan.append("tspan").text("...")
            }
            word = words.pop();
          }
          
        });
      }
      

      return svg.node();
      // return "Hello";
    };

    // render chart - using the function! - useRef used to do only on first mount - react v18 mounts twice in dev mode!
    const effectRan = useRef(false);
    useEffect(() => {
      if (effectRan.current === false) chart();
      effectRan.current = true;
    }, []);

    return (
      <div>
        <h1>Sunburst</h1>
        <svg></svg>
      </div>
    );
}
