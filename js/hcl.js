const mainColorHeight = 0.6
const sliderWidth = 1
const sliderHeight = 0.1
const sliderX = 0
const knobSize = 30
// hits performance
const numberOfGradientStops = 15

var dragInProgress
var dragStart
var mousePos

// https://de.wikipedia.org/wiki/LCh-Farbraum
// hue, chroma, luminance
var color = {h: 130, c: 40, l: 80}

if (window.localStorage && window.localStorage.hcl) {
	try {
		var {h, c, l} = JSON.parse(window.localStorage.hcl)
		console.assert(h && c && l && h>0 && c>0 && l>0)
		color = {h, c, l}
	} catch(e) {}
}

var colorMax = {h: 360, c: 140, l: 100}

var viewBox = {
	x: 0, y: 0, w: 1000, h: 600,
	toString: function () {
		return this.x + " " + this.y + " " + this.w + " " + this.h
	},
	update: function() {
		svg.attr("viewBox", viewBox)
	}
}

var svg = d3.select("#vis")
	.append("svg")
	.attr("xmlns", "http://www.w3.org/2000/svg")
	.attr("viewBox", viewBox)
	// fully scale into container
	.attr("preserveAspectRatio", "none") // distort!
	.attr("width", "100%")
	.attr("height", "100%")

// this is not necessary. the svg will resize itself automatically. however, the font will be distorted. we do this only to get undistorted fonts
function updateScreenElemsSize() {
	var bb = document.querySelector("#vis svg").getBoundingClientRect()
	if (bb.width <= 0 || bb.height <= 0)
		return
	w = bb.width
	h = bb.height
	viewBox.h = viewBox.w*h/w
	viewBox.update()
}

window.onresize = e => updateScreenElemsSize()
window.onresize()

var defs = svg.append("defs")

var mainColor = svg.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", "100%")
	.attr("height", (mainColorHeight*100)+"%")

var rgbLabel = svg.append("text")
	.attr("class", "colorLabel")
	.attr("y", (mainColorHeight-0.08)*100+"%")
var hslLabel = svg.append("text")
	.attr("class", "colorLabel")
	.attr("y", (mainColorHeight-0.02)*100+"%")
var colorPickerText = svg.append("text")
	.attr("class", "colorPickerText")
	.attr("y", (mainColorHeight+0.08)*100+"%")
	.text("HCL (cylindrical CIELab)")

;[rgbLabel, hslLabel, colorPickerText].forEach(e => e.attr("x", 1+"%"))


var chromaGradient = {}
;[..."hcl"].forEach(e => {
	chromaGradient[e] = defs.append("linearGradient").attr("id", "chromaGradient_"+e)
	chromaGradient[e].stopArray = []
	new Array(numberOfGradientStops).fill(true).forEach(x =>
		chromaGradient[e].stopArray.push(chromaGradient[e].append("stop"))
	)
})

function adjustGradient(name) {
	for (var i=0; i<numberOfGradientStops; i++) {
		var offset = i/(numberOfGradientStops-1)
		
		var copy = {h: color.h, c: color.c, l: color.l}
		copy[name] = offset*colorMax[name]
		
		chromaGradient[name].stopArray[i]
			.style({"stop-color": chroma.hcl(copy.h, copy.c, copy.l).hex()})
			.attr("offset", offset)
	}
}

function updateKnobAndLabel(name) {
	// TODO I would want this X to be in percent, but transform seemingly only permits absolute values
	sliders[name].knob.attr("transform", "translate("+(color[name]/colorMax[name]*sliderWidth*viewBox.w)+",0)")
	var xRound = color[name].toFixed(0)
	sliders[name].label
		.attr("x", (color[name]/colorMax[name]*100)+"%")
		.text(xRound)
	
}

function updateColour({h, c, l} = color) {
	window.localStorage.hcl = JSON.stringify({h, c, l})
	
	var farbe = chroma.hcl(h, c, l)
	mainColor.style({"fill": farbe.hex()})
	rgbLabel.text("RGB "
		+farbe.get('rgb.r')+", "
		+farbe.get('rgb.g')+", "
		+farbe.get('rgb.b')
	)
	hslLabel.text("HSL  "
		+(farbe.get('hsl.h')).toFixed(0)+", "
		+(farbe.get('hsl.s')*100).toFixed(0)+"%, "
		+(farbe.get('hsl.l')*100).toFixed(0)+"%"
	)
}

var sliders = svg.append("g")

function slider(name, times) {
	// inner svg for relative positioning
	var s = sliders[name] = sliders.append("svg")
		.attr("x", sliderX*100+"%")
		.attr("y", (mainColorHeight+0.1+times*sliderHeight)*100+"%")
		.attr("width", sliderWidth*100+"%")
		.attr("height", sliderHeight*0.9*100+"%")
	
	s.append("rect")
		.attr("x", 0).attr("y", 0).attr("width", "100%").attr("height", "100%")
		.style({fill: "url(#chromaGradient_"+name+")"})
	
	s.knob = s.append("path")
		.attr("class", "sliderKnob")
		// triangle
		.attr("d", "M-"+knobSize+",-1 L"+knobSize+",-1 L0,"+knobSize+" Z")
		
	s.label = s.append("text")
		.attr("class", "sliderLabel")
		.attr("y", 14+"px")
		.text(color[name])
	
	function update() {
		var x = (mousePos[0]/viewBox.w - sliderX)/sliderWidth
		x = Math.max(0, Math.min(x, 1))
		color[name] = x * colorMax[name]
		updateColour()
		// adjust the OTHER gradients
		;[..."hcl"].filter(e => e !== name).forEach(e => adjustGradient(e))
		updateKnobAndLabel(name)
	}
	
	s.on("mousemove", function (d, i) {
		mousePos = d3.mouse(this)
	})
	.call(d3.behavior.drag()
		.on("dragstart", function (d) {
			dragStart = {x: mousePos[0], y: mousePos[1]}
			update()
		})
		.on("drag", function (d) {
			dragInProgress = true
			update()
		})
		.on("dragend", function (d) {
			dragInProgress = false
		})
	)
	
	return s
}

updateColour()
slider("h", 0)
slider("c", 1)
slider("l", 2)
;[..."hcl"].forEach(e => {
	adjustGradient(e)
	updateKnobAndLabel(e)
})

