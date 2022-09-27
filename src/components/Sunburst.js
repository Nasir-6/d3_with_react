import { arc, format, hierarchy, partition } from 'd3';
// color imports 
import { scaleOrdinal, quantize, interpolateRainbow } from 'd3';
// imports for chart 
import { create, interpolate, select } from 'd3';
import {useEffect, useRef} from 'react'
import data from '../data.json'

export const Sunburst = () => {

    const width = 932;
        const radius = width / 6

        var myArc = arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))
        console.log(myArc)

        var myFormat = format(",d")

        var myColor = scaleOrdinal(quantize(interpolateRainbow, data.children.length + 1))

        var myPartition = data => {
            console.log(data)
            const root = hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value);
            return partition()
                .size([2 * Math.PI, root.height + 1])
            (root);
        }

        // creating the actual chart
        var chart = () => {
            const root = myPartition(data);
        
            root.each(d => d.current = d);
        
            const svg = select("svg")
                .attr("viewBox", [0, 0, width, width])
                .style("font", "10px sans-serif");
                console.log('svg', svg);
            const g = svg.append("g")
                .attr("transform", `translate(${width / 2},${width / 2})`);
        
            const path = g.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1))
            .join("path")
                .attr("fill", d => { while (d.depth > 1) d = d.parent; return myColor(d.data.name); })
                .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
        
                .attr("d", d => myArc(d.current));
        
            path.filter(d => d.children)
                .style("cursor", "pointer")
                .on("click", clicked);
        
            path.append("title")
                .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${myFormat(d.value)}`);
        
            const label = g.append("g")
                .attr("pointer-events", "none")
                .attr("text-anchor", "middle")
                .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().slice(1))
            .join("text")
                .attr("dy", "0.35em")
                .attr("fill-opacity", d => +labelVisible(d.current))
                .attr("transform", d => labelTransform(d.current))
                .text(d => d.data.name);
        
            const parent = g.append("circle")
                .datum(root)
                .attr("r", radius)
                .attr("fill", "none")
                .attr("pointer-events", "all")
                .on("click", clicked);


            // FUNCTIONS NEEDED ABOVE
            function clicked(event, p) {
            parent.datum(p.parent || root);
        
            root.each(d => d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            });
        
            const t = g.transition().duration(750);
        
            // Transition the data on all arcs, even the ones that aren’t visible,
            // so that if this transition is interrupted, entering arcs will start
            // the next transition from the desired position.
            path.transition(t)
                .tween("data", d => {
                    const i = interpolate(d.current, d.target);
                    return t => d.current = i(t);
                })
                .filter(function(d) {
                return +this.getAttribute("fill-opacity") || arcVisible(d.target);
                })
                .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none") 
        
                .attrTween("d", d => () => myArc(d.current));
        
            label.filter(function(d) {
                return +this.getAttribute("fill-opacity") || labelVisible(d.target);
                }).transition(t)
                .attr("fill-opacity", d => +labelVisible(d.target))
                .attrTween("transform", d => () => labelTransform(d.current));
            }
            

            function arcVisible(d) {
            return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
            }
        
            function labelVisible(d) {
            return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
            }
        
            function labelTransform(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2 * radius;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            }
        
            return svg.node();
            // return "Hello";
      }


      const effectRan = useRef(false);
    useEffect(() => {
        if(effectRan.current === false) chart();

        effectRan.current = true;
    }, [])

      const test = "test";
  return (
    <div>
        <h1>Sunburst</h1>
        <svg></svg>
        <div>{test}</div>
    </div>
  )
}
