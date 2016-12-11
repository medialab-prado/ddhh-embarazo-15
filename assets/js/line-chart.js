var isMobile = innerWidth <= 768

var es_ES = {
    "decimal": ",",
    "thousands": ".",
    "grouping": [3],
    "currency": ["€", ""],
    "dateTime": "%a %b %e %X %Y",
    "date": "%d/%m/%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    "shortDays": ["Dom", "Lun", "Mar", "Mi", "Jue", "Vie", "Sab"],
    "months": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    "shortMonths": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
}

var group = "Tasa de nacimientos",
    groups = ["Tasa de nacimientos", "Total de nacimientos"]

var buttonGroup = d3.select(".js-line-chart")
    .append("div")
    .attr("class", "btn-group")

var buttons = buttonGroup.selectAll("button")
    .data(groups)
    .enter()
    .append("a")
    .text(function(d) {return d})
    .attr("class", function(d) {
        return d === group ? "active button style2" : "button style2"
    })

var ES = d3.formatLocale(es_ES),
    format = ES.format(",")

var margin = {top: 40, right: 45, bottom: 30, left: 45},
    width = d3.select(".vis").node().clientWidth - margin.left - margin.right,
    height = isMobile ? 300 : 500 - margin.top - margin.bottom

var svg = d3.select('.vis').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    
var parseTime = d3.timeParse("%Y")

var x = d3.scaleTime()
    .rangeRound([0, width])
    
var y = d3.scaleLinear()
    .rangeRound([height, 0])
    
var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(8)
    .tickPadding(5)
    .tickSize(-width)
    .tickFormat(function(d) {
        return d > 0 ? format(d) : ""
    })
    
var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(isMobile ? 4 : 8)
    .tickPadding(10)
    // .tickSize(-height)
    
var line = d3.line()
    .x(function(d) {return x(d.year)})
    .y(function(d) {return y(d.value)})
    
var voronoi = d3.voronoi()
    .x(function(d) {return x(d.year)})
    .y(function(d) {return y(d.value)})
    .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]])

d3.csv("assets/data.csv", type, function(error, data) {
    var filter = data.filter(function(d) {return d.variable === group})
    
    x.domain(d3.extent(filter, function(d) {return d.year}))
    y.domain([0, 7.8])
    
    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis)
        
    var nest = d3.nest()
        .key(function(d) {return d.province})
        .entries(filter)
        
    svg.append("g")
        .attr("class", "lines")
        .selectAll("path")
        .data(nest, function(d) { return normalize(d.key)})
        .enter().append("path")
        .attr("class", function(d) { return "line " + normalize(d.key)})
        .attr("d", function(d) { d.line = this; return line(d.values) })
        
    svg.append("text")
        .attr("x", 0)
        .attr("y", y(7))
        .attr("dy", 5)
        .attr("class", "legend-text")
        .text("nacimientos / 1.000 hab.")
        
    svg.append("text")
        .attr("x", x(parseTime(2014)))
        .attr("text-anchor", "end")
        .attr("y", y(2.5))
        .attr("dy", 5)
        .attr("class", "legend-text legend-spain")
        .text("ESPAÑA")
        
    var focus = svg.append("g")
        .attr("transform", "translate(-100,-100)")
        .attr("class", "focus")
        
    focus.append("circle")
        .attr("r", 3.5)

    var text = focus.append("text")
    
    text.append("tspan")
        .attr("class", "province")
        .attr("y", -25)
        .attr("x", 0)
    
    text.append("tspan")
        .attr("class", "value")
        .attr("y", -10)
        .attr("x", 0)
        
    var voronoiGroup = svg.append("g")
        .attr("class", "voronoi")
        
    voronoiGroup.selectAll("path")
        .data(voronoi.polygons(d3.merge(nest.map(function(d) { return d.values; }))))
        .enter().append("path")
        .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)

    function mouseover(d) {
        d3.select(".line." + d.data.province.toLowerCase()).classed("line--hover", true)
        
        // Tooltip
        focus.attr("transform", "translate(" + x(d.data.year) + "," + y(d.data.value) + ")");
        focus.select(".province").text(d.data.province)
        focus.select(".value").text(format(d.data.value))
    }
    
    function mouseout(d) {
        d3.select(".line." + d.data.province.toLowerCase()).classed("line--hover", false)
        focus.attr("transform", "translate(-100,-100)")
    }
    
    buttons.on("click", update)
    
    function update(category) {
        var headline = d3.select(".chart-headline")
        
        d3.select(".active").classed("active", false)
        filter = data.filter(function(d) {return d.variable == category})
        
        nest = d3.nest()
            .key(function(d) {return d.province})
            .entries(filter)

        buttons
            .filter(function(d) { return d === category })
            .classed("active", true)
                
        if (category === "Total de nacimientos") {
            y.domain([0, 6500])
            
            headline.text("Nacimientos totales por provincia")
            
            svg.select(".legend-text")
                .transition()
                .duration(1000)
                .attr("y", y(6000))
                .text("nacimientos")
                
            svg.select(".legend-spain")
                .style("opacity", 0)
                
        } else {
            y.domain([0, 7.8])
            
            headline.text("Tasa de nacimientos por provincia")
            
            svg.select(".legend-text")
                .transition()
                .duration(1000)
                .attr("y", y(7))
                .text("nacimientos / 1000 hab.")
                
            svg.select(".legend-spain")
                .transition()
                .duration(1000)
                .style("opacity", 1)
        }
        
        svg.selectAll(".line")
            .data(nest, function(d) { return normalize(d.key)})
        
        svg.selectAll(".line")
            .transition()
            .duration(1000)
            .attr("d", function(d) { d.line = this; return line(d.values) })
            .on("end", function(d) {
                voronoiGroup.selectAll("path")
                    .data(voronoi.polygons(d3.merge(nest.map(function(d) { return d.values }))))
                    .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null })
            })
            
        svg.selectAll("g .axis--y")
            .transition()
            .duration(1000)
            .call(yAxis)
    }
    
    window.onresize = resize

    function resize() {
        // Update width
        width = d3.select(".vis").node().clientWidth - margin.left - margin.right,
        height = isMobile ? 300 : 500 - margin.top - margin.bottom

        d3.select(".vis svg")
            .attr("width", width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
        
        voronoi.extent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
        
        // Update scales
        y.rangeRound([height, 0])
        x.rangeRound([0, width])
        
        svg.selectAll(".lines path")
            .attr("d", function(d) { d.line = this; return line(d.values) })
            
        voronoiGroup.selectAll("path")
            .data(voronoi.polygons(d3.merge(nest.map(function(d) { return d.values }))))
            .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null })
            
        svg.select("legend-spain")
            .attr("x", x(parseTime(2014)))
            .attr("y", y(2.5))
        
        yAxis.tickSize(-width)

        d3.select(".axis--y")
            .call(yAxis)
        
        d3.select(".axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
    }
})

function type(d) {
    d.value = +d.value * 10
    d.year = parseTime(+d.year)
    
    return d
}

function normalize(str) {
   var from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç '/",
       to = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc___",
       mapping = {};

   for (var i = 0, j = from.length; i < j; i++) {
       mapping[from.charAt(i)] = to.charAt(i);
   }

   var ret = [];
   for (var i = 0, j = str.length; i < j; i++) {
       var c = str.charAt(i);
       if (mapping.hasOwnProperty(str.charAt(i))) {
           ret.push(mapping[c]);
       }
       else {
           ret.push(c);
       }
   }
   return ret.join('').toLowerCase();
}
