var svgWidth = 1000
var svgHeight = 600

var svg = d3.select("#vis")
	.append("svg")
	.attr("xmlns", "http://www.w3.org/2000/svg")
	.attr("viewBox", "0 0 "+svgWidth+" "+svgHeight)

var defs = svg.append("defs")
var lg = defs.append("linearGradient").attr("id", "chromaGradient")

// hand-made heated iron scale
var bezInterpolator = chroma.bezier(['1a003e', '9b00bb', 'fc6400', 'yellow', 'white'])
var numberOfStops = 15
for (var i=0; i<numberOfStops; i++) {
	var offset = i/(numberOfStops-1)
	lg.append("stop").style({"stop-color": bezInterpolator(offset).hex()}).attr("offset", offset)
}

defs.append("linearGradient")
	.attr("id", "chromaGradientVert")
	.attr("xlink:href", "#chromaGradient")
	.attr("gradientTransform", "rotate(90)")

svg.append("rect")
	.attr("x", 0).attr("y", 0).attr("width", "100%").attr("height", "100%")
	.style({"fill": "url(#chromaGradient)"})

