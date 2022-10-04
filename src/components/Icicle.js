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
      .style("font", "14px sans-serif")
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

  const isLabelVisible = (d) => {
    // return 1 = Visible Or 0 = NotVisible
    // x is in vertical direction and y in horizontal!!
    // y1 = RH-Edge, y0 = LH-Edge - BUT THEY DON'T CHANGE!! - d.target changes!!!!!
    return d.y1 <= WIDTH && d.y0 >= 0 && d.x1 - d.x0 > 20;
  }

  const createAndAppendTextContainersToCells = (cells) => {
    return cells
      .append("text")
      .style("user-select", "none")
      .attr("pointer-events", "none")
      .attr("x", 5)
      // .attr("y", 13)
      .attr("fill-opacity", (d) => +isLabelVisible(d))
      .attr(
        "transform",
        (d) => `translate(0,${Math.max((d.x1 - d.x0) / 2, 14)})`
      );
  }
  
  // https://stackoverflow.com/questions/24784302/wrapping-text-in-d3
  function wrap(text) {
    text.each(function () {

      var text = select(this),
        words = text.text().split(/\s+/).reverse(), //Splits and reverses - so can pop off the end!
        word,
        line = [],
        lineHeight = 1.2, // ems
        level = parseInt(text.attr("level")),
        tspan = text
        //   .text(text.text())
        //   .append("tspan")
        //   .attr("x", 5)


      word = words.pop();
      const maxCharLength = level < 4 ? 45 : 105 // Last level (4) has extended width/charLength!
      while (word) {
        // whilst you got words to pop - keep going! - ALSO Added hasMoved to make it stop
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.text().length > maxCharLength) {
          line.pop(); // remove last word
          tspan.text(line.join(" ")); // Join the array of words by adding in space in between
          line = [word];
          // Keep adding any new words to the
          tspan = text
            .append("tspan")
            .attr("x", 5)
            .attr("dy", lineHeight + "em")
            .text(word);
        }
        word = words.pop();
      }
    });
  }

  const createAndAppendTextToTextContainers = (textContainers) => {
    // Wrap text in the any layers except last layer
    console.log("I'm appending Text");

    return textContainers.append("tspan").text((d) => {
      // console.log('d', d)
      // console.log('d.data.name', d.data)
      return d.data.name;
    }).attr("level", (d) => {
      // console.log('d', d)
      return d.depth
    })
    .call(wrap);
  };


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
        .attr("fill-opacity", (d) => {
          console.log('d', d)
          // SPECIAL CASE FOR LAST LEVEL TO NOT SHOW UNTIL EXPANDED FULLY!!
          if(d.target.y1 >= WIDTH && d.depth === 4) return 0;
          if(d.target.y1 >= WIDTH && d.parent.data.name === "Programming" && d.value <= 7) return 0; // THIS IS TO Hide "Relational operations in a programming language" & "Programming/Arithmetic operations in a programming language" when in last layer so stops showing when they overflow into box below - NEED TO FIND A BETTER WAY !!!! 
          return +isLabelVisible(d.target)
        }
        )
        .attr(
          "transform",
          (d) => `translate(0,${Math.max((d.target.x1 - d.target.x0) / 2, 15)})`
        ); // centering in y-axis (15 incase very small number)
  }


  const [learningObj, setLearningObj] = useState("No learning objectives selected!");

  const createChart = () => {
    const root = partitionData(data);
    let currentFocus = root;

    const svg = createSvgViewBox();

    const cells = createCellsFromData(svg, root);

    const rect = createAndAppendBoxesToCells(cells, handleClickedCell);

    const textContainers = createAndAppendTextContainersToCells(cells);

    const text = createAndAppendTextToTextContainers(textContainers)

    const titles = createAndAppendTitlesToCells(cells)

    return svg.node();

    // clickhandler defined here as a function so can be hoisted whilst also having access to rect, root, currentFocus etc.
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
  };

  // render chart - using the function! - useRef used to do only on first mount - react v18 mounts twice in dev mode!
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current === false) createChart();
    hasMounted.current = true;
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const storeAncestors = (ancestorMap, boxTitle) =>{
    const ancestors = boxTitle.split('/')
        ancestors.pop();

        // 	Store in a hashMap with the key as the title
        const ancestorKey = ancestors.join("/") 

        if(!ancestorMap.has(ancestorKey)){
          ancestorMap.set(ancestorKey, 1);
        } else{
          console.log("Already in the Map!")
        }
        
  }
  const highlightSearchQueries = () => {
    const boxes = document.querySelectorAll("g");

    // initialise HashMap to store ancestor paths so can highlight them aswell
    const ancestorMap = new Map();

    // Loop through from end of array (so can grab parents along the way) - don't use foreach!
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      const boxDesign = box.children[0];
      const boxText = box.children[1].textContent; // TODO: TEST IF WORKS NOW WITH WRAP FUNCTION INTRODUCING EXTRA SPANS
      const boxTitle = box.children[2].textContent;


      const matchesQuery = boxText.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const isAncestorOfAMatch = ancestorMap.has(boxTitle);

      if (searchQuery.trim() === "") {
        boxDesign.style.setProperty("fill-opacity", "0.6", "");

      } else if (matchesQuery) {
        boxDesign.style.setProperty("fill-opacity", "1", "");
        storeAncestors(ancestorMap, boxTitle);

      } else if (isAncestorOfAMatch){
        boxDesign.style.setProperty("fill-opacity", "1", "");
        storeAncestors(ancestorMap, boxTitle);

      }else{
        boxDesign.style.setProperty("fill-opacity", "0.6", "");
      }

    }
  };

  useEffect(() => {
    highlightSearchQueries();
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
