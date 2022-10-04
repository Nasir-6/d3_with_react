import { arc, format, hierarchy, partition } from "d3";
// Color imports
import { scaleOrdinal, quantize, interpolateRainbow } from "d3";
// imports for chart
import { interpolate, select } from "d3";
import { useEffect, useRef, useState } from "react";

// read in data - Replace with some fetch request eventually!
// import data from '../data/d3Data.json'
// import data from '../data/tonyData.json'
// import data from "../data/myData.json";
import data from "../data/newCategoriesData.json";
// import data from "../data/newWeightedCategories.json";

export const Icicle = () => {
  const WIDTH = 975;
  const HEIGHT = 1500;

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
      .style("font", "15px sans-serif")
      .style("width", "50vw")
      .style("overflow", "auto");
    // .style("height", "100vh");

    console.log("svg", svg);

    const cell = svg
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.y0},${d.x0})`);

    const rect = cell
      .append("rect")
      .attr("width", (d) =>
        d.children ? d.y1 - d.y0 - 1 : 2 * (d.y1 - d.y0 - 1)
      ) // The last layer (LOs - no children) is double width so spans to the end when on 2nd to last layer! - use overflow-hidden prop
      .attr("height", (d) => rectHeight(d))
      .attr("fill-opacity", 0.6) // Target this to change the opacity!
      // .attr("fill-opacity", d => {
      //   // console.log('d', d)
      //   if(d.data.name.toLowerCase().includes(searchQuery.toLowerCase())){
      //     // console.log('d contains search', d)
      //   }

      // })

      .attr("fill", (d) => {
        if (!d.depth) return "#ccc";
        while (d.depth > 1) d = d.parent;
        return setColor(d.data.name);
      })
      .style("cursor", "pointer")
      .on("click", clicked);

    const text = cell
      .append("text")
      .style("user-select", "none")
      .attr("pointer-events", "none")
      .attr("x", 4)
      // .attr("y", 13)
      .attr("fill-opacity", (d) => +labelVisible(d))
      .attr(
        "transform",
        (d) => `translate(0,${Math.max((d.x1 - d.x0) / 2, 14)})`
      );

    text.append("tspan").text((d) => d.data.name);

    // const tspan = text.append("tspan")
    //     .attr("fill-opacity", d => labelVisible(d) * 0.7)
    //     .text(d => ` ${formatData(d.value)}`);
    // tSPAN - is the little number

    cell
      .append("title")
      // .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${formatData(d.value)}`);
      .text(
        (d) =>
          `${d
            .ancestors()
            .map((d) => d.data.name)
            .reverse()
            .join("/")}`
      ); // Remove the value at end of title - easier for tracking parents when highlighting searchQuery

    function clicked(event, p) {
      if (!p.children) {
        const learningObj = p.data.name; // stored here so can set different opacity
        setLearningObj(learningObj);
        console.log("p", p);
        p = p.parent; // set the reference/target to the parent - so doesn't zoom into LO
        focus = p;
      } else {
        // focus is the box that is expanded to full width
        // check if the one clicked on is focus or not
        // if it is focus being clicked - change focus to it's parent so can go backwards
        // Else change focus to new clicked element
        console.log("Not a learning objective");
        focus = focus === p ? (p = p.parent) : p;
      }

      // console.log('p', p)
      // console.log('Name', p.data.name)
      // console.log('p.x0', p.x0)
      // console.log('p.x1', p.x1)
      // console.log('p.y0', p.y0)
      // console.log('p.y1', p.y1)

      root.each(
        (d) =>
          (d.target = {
            // Calculate the fraction of total height you need
            x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * HEIGHT, //x is a height // Calculate the fraction the current nodes displacement from
            x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * HEIGHT,
            // y is going across - NOTE: only translate the in chunks of (WIDTH/3 = 975/3 = 325)
            y0: d.y0 - p.y0,
            y1: d.y1 - p.y0, // if clicked on the 2nd to last layer (leave y1)
          })
      );

      const t = cell
        .transition()
        .duration(750)
        .attr("transform", (d) => `translate(${d.target.y0},${d.target.x0})`);

      rect
        .transition(t)
        .attr("height", (d) => rectHeight(d.target))
        .attr("fill-opacity", (d) => (d.target.name === learningObj ? 1 : 0.5));
      text
        .transition(t)
        .attr("fill-opacity", (d) => +labelVisible(d.target))
        .attr(
          "transform",
          (d) => `translate(0,${Math.max((d.target.x1 - d.target.x0) / 2, 14)})`
        ); // centering in y-axis (14 incase very small number)

      // you are translating text but it also has deualt y position - so get rid of that!!!
      // tspan.transition(t).attr("fill-opacity", d => labelVisible(d.target) * 0.7)
    }

    function rectHeight(d) {
      // Min(bottom - top/2 OR 1)/2
      // x1-x0 is height
      // - min(1 OR  x1-x0/2)
      // console.log('d.x1-d.x0', d.x1-d.x0)
      // console.log('(d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2 ) ', (d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2 ) ))
      return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
    }

    function labelVisible(d) {
      return d.y1 <= WIDTH && d.y0 >= 0 && d.x1 - d.x0 > 19;
    }

    return svg.node();
  };

  // render chart - using the function! - useRef used to do only on first mount - react v18 mounts twice in dev mode!
  const effectRan = useRef(false);
  useEffect(() => {
    if (effectRan.current === false) chart();
    effectRan.current = true;
  }, []);

  const [learningObj, setLearningObj] = useState("Hello");
  const [searchQuery, setSearchQuery] = useState("");

  const highLightLearningObjectives = () => {
    console.log("searchQuery", searchQuery);

    console.log("Working");
    // grab all rectangles - use g and filter using the title!
    const boxes = document.querySelectorAll("g");


    // boxes.forEach((box) => {
    //   // console.log('box', box)

    //   if (searchQuery === "") {
    //     box.firstChild.style.setProperty("fill-opacity", "0.6", "");
    //   } else if (
    //     box.lastChild.textContent
    //       .toLowerCase()
    //       .includes(searchQuery.toLowerCase())
    //   ) {
    //     // console.log('box', box)
    //     // console.log('box.firstChild', box.firstChild)
    //     box.firstChild.style.setProperty("fill-opacity", "1", "");
    //   } else {
    //     box.firstChild.style.setProperty("fill-opacity", "0.6", "");
    //   }
    // });

    //     Loop through from end of array (so can grab parents along the way) - don't use foreach
    console.log("boxes", boxes);

    // initialise HashMap to store ancestor paths so can highlight them aswell
    const ancestorMap = new Map();
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      const boxDesign = box.children[0];
      const boxText = box.children[1].textContent;
      const boxTitle = box.children[2].textContent;

      // console.log("box", box);
      // console.log("boxDesign", boxDesign);
      // console.log("boxText", boxText.textContent);
      // console.log("boxTitle", boxTitle.textContent);


      if (searchQuery.trim() === "") {
        console.log("EMPTY SEARCH QUERY")
        boxDesign.style.setProperty("fill-opacity", "0.6", "");
      // If(matches searchQuery)
      } else if (boxText.toLowerCase().includes(searchQuery.toLowerCase())) {
        // 	Change opacity
        console.log("GOT A MATCH")
        boxDesign.style.setProperty("fill-opacity", "1", "");
        // 	Also Extract parent/ancestors i.e from the titles - extract, maybe split remove last array index and join again
        const ancestors = boxTitle.split('/')
        ancestors.pop();
        console.log('ancestors', ancestors)
        // 	Store in a hashMap with the key as the title
        const ancestorKey = ancestors.join("/") 
        console.log('ancestorKey', ancestorKey)
        console.log('ancestorMap', ancestorMap)
        if(!ancestorMap.has(ancestorKey)){
          ancestorMap.set(ancestorKey, 1);
        } else{
          console.log("Already in the Map!")
        }
      } else if (ancestorMap.has(boxTitle)){
        // Else if (title in ancestors hashMap)
        // 	ChangeOpacity
        console.log("This is a parent")
        boxDesign.style.setProperty("fill-opacity", "1", "");
        // 	Also extract its parent/ancestors

       // 	Also Extract parent/ancestors i.e from the titles - extract, maybe split remove last array index and join again
       const ancestors = boxTitle.split('/')
       ancestors.pop();
       console.log('ancestors', ancestors)
       // 	Store in a hashMap with the key as the title
       const ancestorKey = ancestors.join("/") 
       console.log('ancestorKey', ancestorKey)
       console.log('ancestorMap', ancestorMap)
       if(!ancestorMap.has(ancestorKey)){
        console.log("Inserting ancestorKey")
         ancestorMap.set(ancestorKey, 1);
       } else{
         console.log("Already in the Map!")
       }
        // 	Store in hashMap - so can track all the way upto the top!
      }else{
        // 	Just keep opacity as 0.6!
        boxDesign.style.setProperty("fill-opacity", "0.6", "");
      }

    }
  };

  useEffect(() => {
    highLightLearningObjectives();
  }, [searchQuery]);

  return (
    <div className="icicle-page" style={{ display: "flex" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h2>Icicle</h2>
        <input
          type="text"
          placeholder="Search"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg></svg>
      </div>
      <div>
        <h1>Selected LO information goes here!</h1>
        <h2>{learningObj}</h2>
      </div>
    </div>
  );
};
