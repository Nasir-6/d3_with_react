import { useState } from "react";
import { read, utils } from "xlsx";
import { csvParse } from "d3";
// import {createReadStream} from 'fs'

import { parse } from "papaparse";

export const DataProcessor = () => {
  const csvToJson = (csvData) => {
    // initialise the JSON object
    const data = {
      name: "Education AI Curriculum",
      children: [],
    };

    for (const row of csvData) {

      // This is the new Category - i.e the uppermost layer
      // if it is not found in the data object - create that and push it
      const newCategory = data;
      if (!newCategory.children.find((a) => a.name === row["Parent Category"])) {
        newCategory.children.push({
          name: row["Parent Category"],
          children: [],
        });
      }

      // do same for second layer
      const category = newCategory.children.find(
        (a) => a.name === row["Parent Category"]
      );
      if (!category.children.find((a) => a.name === row["Computational Concepts"])) {
        category.children.push({
          name: row["Computational Concepts"],
          children: [],
        });
      }

      // do same for third layer
      const category2 = category.children.find(
        (a) => a.name === row["Computational Concepts"]
      );
      if (!category2.children.find((a) => a.name === row["CS Category 3 Lesson"])) {
        category2.children.push({
          name: row["CS Category 3 Lesson"],
          children: [],
          // value: 1,
        });
      }

      // For 4th/final layer
      const category3 = category2.children.find(
        (a) => a.name === row["CS Category 3 Lesson"]
      );
      if (!category3.children.find((a) => a.name === row["Learning Objectives"])) {
        let val;
        if((row["Parent Category"] === "Software Engineering" || row["Parent Category"] === "Discrete Mathematics")){
          val = 2
        } else if(row["Learning Objectives"].length > 84){
          console.log('row["Learning Objectives"]', row["Learning Objectives"])
          val = 2
        } else {
          val = 1
        }   
        category3.children.push({
          name: row["Learning Objectives"],
          computational_concepts: row["Computational Concepts"],
          cs_category_3_lesson: row["CS Category 3 Lesson"],
          uid: row["uid"],
          essential_prereq_uid: row["Essential Prereq uid"],
          GCSE: row["GCSE"],
          KS3: row["JC"],
          KS2: row["MC"],
          KS1: row["TS"],
          value: val,
        });
      }
    }

    // Tony's value adjuster depending on string length

    // All of below is to set the value according to length of LO string

    // First find the max level
    // let max = 0;
    // for (const lv1 of data.children) {
    //   for (const lv2 of lv1.children) {
    //     for (const lv3 of lv2.children) {
    //       if (lv3.children.length > max) {
    //         max = lv3.children.length;
    //       }
    //     }
    //   }
    // }

    // for (const lv1 of data.children) {
    //   for (const lv2 of lv1.children) {
    //     for (const lv3 of lv2.children) {
    //       const num = lv3.children.length;
    //       const minWeight = Math.round(max / num); // This is like the defualt value for the LOs
    //       // const minWeight = 10;
    //       for (const lv4 of lv3.children) {
    //         const lenWeight = Math.round(lv4.name.length / 10); // This is the length of the LO string
    //         const weight = minWeight > lenWeight ? minWeight : lenWeight; // Set the weigh accordingly
    //         lv4.value = weight;
    //       }
    //     }
    //   }
    // }
    // save data as a json - THis is done by manually copy and paasting from the console -
    console.log("THIS IS JSON", JSON.stringify(data));
  };

  const changeHandler = (event) => {
    console.log(event.target.files[0]);
    // Passing file data (event.target.files[0]) to parse using Papa.parse
    parse(event.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        // console.log(results.data)

        const data = results.data;

        console.log("data", data);
        csvToJson(data); //
      },
    });
  };

  return (
    <>
      <div>DataProcessor</div>

      {/* File Uploader */}
      <input
        type="file"
        name="file"
        accept=".csv"
        onChange={changeHandler}
        style={{ display: "block", margin: "10px auto" }}
      />
    </>
  );
};
