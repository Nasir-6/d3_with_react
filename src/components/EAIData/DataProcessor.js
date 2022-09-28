import {useState} from 'react'
import {read, utils} from 'xlsx'
import { csvParse } from 'd3';
// import {createReadStream} from 'fs'

import { parse } from 'papaparse'




export const DataProcessor = () => {

    const csvToJson = (csvData) => {
        // initialise the JSON object 
        const data = {
            name: "Education AI Curriculum",
            children: []
        };

        for (const row of csvData) {

            const cat = data;
            if (!cat.children.find(a => a.name === row['Computational Concepts'])) {
                cat.children.push({
                    name: row['Computational Concepts'],
                    children: []
                })
            }
            const cat2 = cat.children.find(a => a.name === row['Computational Concepts']);
            if (!cat2.children.find(a => a.name === row['CS Category 3 Lesson'])) {
                cat2.children.push({
                    name: row['CS Category 3 Lesson'],
                    children: []
                    // value: 1,
                })
            }
        
            const cat3 = cat2.children.find(a => a.name === row['CS Category 3 Lesson']);
            if (!cat3.children.find(a => a.name === row['Learning Objectives'])) {
                let val = 1;
                cat3.children.push({
                    name: row['Learning Objectives'],
                    value: val
                })
            }

            console.log('cat', cat)
        }

        console.log('data', data)

        // save data as a json
        console.log('THIS IS JSON', JSON.stringify(data));

    }

    const changeHandler = (event) => {
        console.log(event.target.files[0])
        // Passing file data (event.target.files[0]) to parse using Papa.parse
        parse(event.target.files[0], {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            // console.log(results.data)

            const data = results.data

            console.log('data', data);
            csvToJson(data);




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
    

  )
}
