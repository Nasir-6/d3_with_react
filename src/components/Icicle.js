import { format, hierarchy, partition } from "d3";
// Color imports
import { scaleOrdinal, quantize, interpolateRainbow } from "d3";
// imports for chart
import { interpolate, select } from "d3";
import { useEffect, useRef, useState } from "react";

// read in data - Replace with some fetch request eventually!
// import data from '../d3Data.json'
// import data from '../tonyData.json'
// import data from "../myData.json";
import data from "../newCategoriesData.json";
// import data from "../newWeightedCategories.json";

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

  const createSvgViewBox = () => {
    return select("svg")
      .attr("viewBox", [0, 0, WIDTH, HEIGHT])
      .style("font", "15px sans-serif")
      .style("width", "50vw")
      .style("overflow", "auto")
      // .style("overflow", "visible");
    // .style("height", "100vh");
  }


  const createCellsFromData = (svg, root) => {
    return svg
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.y0},${d.x0})`)
  }

  const createAndAppendBoxesToCells = (cells, clicked) => {
    return cells
    .append("rect")
    .attr("width", (d) =>
      d.children ? d.y1 - d.y0 - 1 : 2 * (d.y1 - d.y0 - 1)
    ) // The last layer (LOs - no children) is double width so spans to the end when on 2nd to last layer! - use overflow-hidden prop
    .attr("height", (d) => getRectangleHeight(d))
    .attr("fill-opacity", 0.6) // Target this to change the opacity!
    .attr("fill", (d) => {
      if (!d.depth) return "#ccc";
      while (d.depth > 1) d = d.parent;
      return setColor(d.data.name);
    })
    .style("cursor", "pointer")
    .on("click", clicked);
  }

  const getRectangleHeight = (d) => {
    // Min(bottom - top/2 OR 1)/2
    // x1-x0 is height
    // - min(1 OR  x1-x0/2)
    return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
  }

  const isLabelVisibile = (d) => {
    // return 1 = Visible Or 0 = NotVisible
    return d.y1 <= WIDTH && d.y0 >= 0 && d.x1 - d.x0 > 19;
  }

  const createAndAppendTextContainersToCells = (cells) => {
    return cells
      .append("text")
      .style("user-select", "none")
      .attr("pointer-events", "none")
      .attr("x", 4)
      // .attr("y", 13)
      .attr("fill-opacity", (d) => +isLabelVisibile(d))
      .attr(
        "transform",
        (d) => `translate(0,${Math.max((d.x1 - d.x0) / 2, 14)})`
      );
  }

  const createAndAppendTextToTextContainers = (text) => {
    return text.append("tspan").text((d) => d.data.name);
  }

  const createAndAppendTitlesToCells = (cells) => {
    return cells
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
  }


  const updateTargetPositionOfNodes = (root, focusedRectangle) => {
    root.each(
      (d) =>
        (d.target = {
          // Calculate the fraction of total height you need
          x0:
            ((d.x0 - focusedRectangle.x0) /
              (focusedRectangle.x1 - focusedRectangle.x0)) *
            HEIGHT, //x is a height // Calculate the fraction the current nodes displacement from
          x1:
            ((d.x1 - focusedRectangle.x0) /
              (focusedRectangle.x1 - focusedRectangle.x0)) *
            HEIGHT,
          // y is going across - NOTE: only translate the in chunks of (WIDTH/3 = 975/3 = 325)
          y0: d.y0 - focusedRectangle.y0,
          y1: d.y1 - focusedRectangle.y0, // if clicked on the 2nd to last layer (leave y1)
        })
    );
  }

  const translateCellsAndReturnTranslationTransition = (cells) => {
    return cells
        .transition()
        .duration(750)
        .attr("transform", (d) => `translate(${d.target.y0},${d.target.x0})`);
  }

  const translateAndTransformRectangles = (rect, translation, learningObj) => {
    return rect
        .transition(translation)
        .attr("height", (d) => getRectangleHeight(d.target))
        .attr("fill-opacity", (d) => (d.target.name === learningObj ? 1 : 0.5));
        // TODO: Figure out how to show selected one!!
  }

  const translateAndTransformTextContainers = (textContainers, translation) => {
    return textContainers
        .transition(translation)
        .attr("fill-opacity", (d) => +isLabelVisibile(d.target))
        .attr(
          "transform",
          (d) => `translate(0,${Math.max((d.target.x1 - d.target.x0) / 2, 14)})`
        ); // centering in y-axis (14 incase very small number)
  }


  // creating the actual chart - REMEMBER TO CALL IT
  var chart = () => {
    const root = partitionData(data);
    let currentFocus = root;

    const svg = createSvgViewBox();

    const cells = createCellsFromData(svg, root);

    const rect = createAndAppendBoxesToCells(cells, handleClickedCell);

    const textContainers = createAndAppendTextContainersToCells(cells);

    const text = createAndAppendTextToTextContainers(textContainers)
    // const tspan = text.append("tspan")
    //     .attr("fill-opacity", d => labelVisible(d) * 0.7)
    //     .text(d => ` ${formatData(d.value)}`);
    // tSPAN - is the little number
    const titles = createAndAppendTitlesToCells(cells)


    function handleClickedCell(event, clickedRectangle){
      const clickedLearningObjective = !clickedRectangle.children;
      if (clickedLearningObjective) {
        // const learningObj = clickedRectangle.data.name; // stored here so can set different opacity
        setLearningObj(clickedRectangle.data.name);
        if(currentFocus === clickedRectangle.parent) return;
      }
      
      let focusedRectangle;
      if(clickedRectangle === currentFocus || clickedLearningObjective){
        focusedRectangle = clickedRectangle.parent
      } else{
        focusedRectangle = clickedRectangle;
      }
      currentFocus = focusedRectangle

      updateTargetPositionOfNodes(root, focusedRectangle);

      const translation = translateCellsAndReturnTranslationTransition(cells);
      
      translateAndTransformRectangles(rect, translation, learningObj)

      translateAndTransformTextContainers(textContainers, translation)
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
    
    // grab all rectangles - use g and filter using the title!
    const boxes = document.querySelectorAll("g");

    //     Loop through from end of array (so can grab parents along the way) - don't use foreach
    // console.log("boxes", boxes);

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
