import {useState, useEffect} from 'react'

export const SearchBar = () => {

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
    <input
    type="text"
    placeholder="Search"
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  )
}
