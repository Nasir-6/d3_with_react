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
    const RADIUS = WIDTH / 6    // Splits Width (Diameter) into 6 parts - so can have 3 levels (1-inner white, 2-First level, 3-Second level)

    var myArc = arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))    // Add some space again
    .padRadius(RADIUS * 1.5)    //Add padding/space inbetweeon sectors - bigger is more space between
    .innerRadius(d => d.y0 * RADIUS)    // Takes starting radius * RAD which is 1/6 of the width i.e 
    .outerRadius(d => Math.max(d.y0 * RADIUS, d.y1 * RADIUS - 1))

    var formatData = format(",d")

    var setColor = scaleOrdinal(quantize(interpolateRainbow, data.children.length + 1))

    var partitionData = data => {
        const root = hierarchy(data)
            .sum(d => d.value)  // sum the values - so can get total value and split
            .sort((a, b) => b.value - a.value);     // sort so first one starting at 12:00 is the largest module 

        return partition().size([2 * Math.PI, root.height + 1])(root);    //root.height - is how many levels it has 4 levels so gives each 
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
        .style("font", "18px sans-serif")
        // .style("height", "80vh")
        .style("width", "52vw");
    //   console.log("svg", svg);

      const g = svg
        .append("g")
        .attr("transform", `translate(${WIDTH / 2},${WIDTH / 2})`);

      const path = g
        .append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr("fill", (d) => {      // Give all the descendants same color as parent (which starts at depth 1)
          while (d.depth > 1) d = d.parent;
          return setColor(d.data.name);
        })      
        .attr("fill-opacity", (d) =>
          arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0      // is arcVisible - yes - Does it have children - yes (opdacity 0.6) - no children (0.4) If not visible (opacity 0)
          // Can replace the d.children ? with d.depth * value to give it opacity depending on depth!
        )
        .attr("pointer-events", (d) =>
          arcVisible(d.current) ? "auto" : "none"
        )

        .attr("d", (d) => myArc(d.current));

      path
        .filter((d) => d.children)    // if it has children give it clicked function - i.e all except LO's!!
        .style("cursor", "pointer")
        .on("click", clicked);


        // This gives you a breadcrumb sort of title for each path - Maybe useful for later?
        // Education AI Curriculum/Programming Fundamentals/Variables/Variables Data Types/
        // Demonstrate a String (or str or text) is one of four datatypes that is used for a combination of any characters that appear on a keyboard, such as letters, numbers and symbols. 18
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
        .attr("dy", "0.35em")     // pull in label (<1em) 
        .attr("fill-opacity", (d) => +labelVisible(d.current))
        .attr("transform", (d) => labelTransform(d.current))
        .text((d) => d.data.name)
        // ADD IN ??
        .call(wrap, 900);

        // This is the inner white circle 
      const parent = g
        .append("circle")
        .datum(root)
        .attr("r", RADIUS)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", clicked);            

      // FUNCTIONS NEEDED ABOVE
      function clicked(event, p) {
        parent.datum(p.parent || root); // put the parent.datum as it's parent - but if it has no parent i.e it is the root set it as root!
        // parent.datum is the datum of the inner white circle
        // If parent.datum(root); then clicking on the centre returns to the root! 

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

        const t = g.transition().duration(1000);

        // Transition the data on all arcs, even the ones that aren’t visible,
        // so that if this transition is interrupted, entering arcs will start
        // the next transition from the desired position.
        path
          .transition(t)
          .tween("data", (d) => {
            // console.log('d.current', d.current)
            // console.log('d.target', d.target)
            const i = interpolate(d.current, d.target);   // creates an interpolation function - this will allow smooth transitions
            // It is used in the last return statement - it is recursive function 
            // t is a value from 0 to 1 
            console.log('i', i)

            // NOTE: t here is a value [0 to 1] NOT TRANSITION t!!!
            return (t) => (d.current = i(t));
          })
          .filter(function (d) {
            return this.getAttribute("fill-opacity") || arcVisible(d.target);
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
            return this.getAttribute("fill-opacity") || labelVisible(d.target);
          })
          .transition(t)
          .attr("fill-opacity", (d) => +labelVisible(d.target))
          .attrTween("transform", (d) => () => labelTransform(d.current));
      }

      function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
      }

      function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.08;  //0.03
      }

      function labelTransform(d) {
        const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
        const y = ((d.y0 + d.y1) / 2) * (RADIUS);
        return `rotate(${x - 90}) translate(${y},0) rotate(${
          x < 180 ? 0 : 180
        })`;
      }


      // https://stackoverflow.com/questions/24784302/wrapping-text-in-d3
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
            if (tspan.text().length > 35) {     // If current length is more than 45 chars - turn it into a variable??
              line.pop();       // remove last word
              tspan.text(line.join(" "));   // Join the array of words by adding in space in between
            //   console.log('tspan.text()', tspan.text())
            //   console.log('line', line)
              line = [word];
            //   console.log('line After [word]', line)
              if (!hasMoved) {
                tspan.attr('dy', (dy - 0.5) + 'em');    // move it radially CW a bit so it can make space for new lines 
                hasMoved = true;                        // the text has now moved
              }
              // Keep adding any new words to the 
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
        <svg overflow="visible"></svg>
      </div>
    );
}
