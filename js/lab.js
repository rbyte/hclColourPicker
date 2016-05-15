var svg

var viewBox = {
	x: 0, y: 0, w: 1000, h: 600,
	toString: function () {
		return this.x + " " + this.y + " " + this.w + " " + this.h
	},
	update: function() {
		svg.attr("viewBox", viewBox)
	}
}

svg = d3.select("#vis")
	.append("svg")
	.attr("xmlns", "http://www.w3.org/2000/svg")
	.attr("viewBox", viewBox)
	// fully scale into container
	.attr("preserveAspectRatio", "none") // distort!
	.attr("width", "100%")
	.attr("height", "100%")

var defs = svg.append("defs")

var bg = svg.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", "100%")
	.attr("height", "65%")

function createVerticalLinearGradient(id) {
	defs.append("linearGradient")
		.attr("id", id+"_vert")
		.attr("xlink:href", "#"+id)
		.attr("gradientTransform", "rotate(90)")
}

var chromaGradient = {}

chromaGradient.h = defs.append("linearGradient").attr("id", "chromaGradient_h")
chromaGradient.c = defs.append("linearGradient").attr("id", "chromaGradient_c")
chromaGradient.l = defs.append("linearGradient").attr("id", "chromaGradient_l")
createVerticalLinearGradient("chromaGradient_h")
createVerticalLinearGradient("chromaGradient_c")
createVerticalLinearGradient("chromaGradient_l")

function adjustGradient(name) {
	var numberOfStops = 5
	chromaGradient[name].selectAll("*").remove()
	for (var i=0; i<numberOfStops; i++) {
		var offset = i/(numberOfStops-1)
		
		var copy = {h: color.h, c: color.c, l: color.l}
		copy[name] = offset*colorMax[name]
		
		chromaGradient[name].append("stop")
			.style({"stop-color": chroma.hcl(copy.h, copy.c, copy.l).hex()})
			.attr("offset", offset)
	}
}

var dragInProgress
var dragStart
var mousePos

var sliders = svg.append("g")
var sliderWidth = 1.0
var sliderHeight = 0.1

// https://de.wikipedia.org/wiki/LCh-Farbraum
// Gelb, Grün, Blau und Rot (h=90, 180, 270, 360°)
var colorMax = {h: 360, c: 140, l: 100}
var color = {h: 130, c: 40, l: 80}
function setColor({h, c, l} = color) {
	bg.style({"fill": chroma.hcl(h, c, l).hex()})
}
setColor()


function slider(name, times) {
	sliders[name] = sliders.append("rect")
		.attr("x", "0")
		.attr("y", (70+times*sliderHeight*100)+"%")
		.attr("width", (sliderWidth*100)+"%")
		.attr("height", ((sliderHeight*0.9)*100)+"%")
		.style({fill: "url(#chromaGradient_"+name+")"})
		// .style({stroke: "black"})
	
	sliders[name].label = sliders.append("text")
		.attr("x", 50+"%")
		// +1 because bottom-left corner is origin
		.attr("y", (70+(times+1)*sliderHeight*100)+"%")
		.attr("text-anchor", "middle")
	sliders[name].label.text(color[name])
	
	sliders[name].knob = sliders.append("path")
		.attr("y", (70+(times+1)*sliderHeight*100)+"%")
		.attr("d", "M-10,0 L10,0 L0,18 Z") // triangle
		.style({fill: "white"})
	
	
	sliders[name].on("mousemove", function (d, i) {
		mousePos = d3.mouse(this)
	}).call(d3.behavior.drag()
		.on("dragstart", function (d) {
			dragStart = {x: mousePos[0], y: mousePos[1]}
		})
		.on("drag", function (d) {
			dragInProgress = true
			var x = mousePos[0]/viewBox.w/sliderWidth
			
			sliders[name].knob.attr("transform", "translate("+(x*viewBox.w)+",0)")
			
			color[name] = x * colorMax[name]
			setColor()
			// adjust the OTHER gradients
			;[..."hcl"].filter(e => e !== name).forEach(e => adjustGradient(e))
			
			var xRound = color[name].toPrecision(3)
			sliders[name].label.text(xRound)
		})
		.on("dragend", function (d) {
			dragInProgress = false
		})
	)
	
	return sliders[name]
}

slider("h", 0)
slider("c", 1)
slider("l", 2)
;[..."hcl"].forEach(e => adjustGradient(e))




