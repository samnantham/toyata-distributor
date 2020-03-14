// -----------------------------------------------------
// SVG AUTO-ZOOMING AND PANNING
// -----------------------------------------------------
var rtp;
var az;
var first;
var loop;
var nav_x;
var nav_y;
var nav_w;
var nav_h;
var width_vb_ratio;
var height_vb_ratio;
var doc_vb_ratio;
var disp_aspect;
var w_prop;
var area;
var Sides;
var wSide;
var hSide;
var Step;
var s;
var rect2sq_ratio;
var propW;
var propH;
var pan_boxX;
var pan_boxY;
var pan_boxW;
var pan_boxH;
var lens;
var offsetX;
var offsetY;
var z_dir;
var loopX;
var loopY;
var evtX;
var evtY;
var lensX;
var lensY;
var lensW;
var lensH;

// -----------------------------------------------------
// list of IDs in the SVG document used by this script:
// main,map,lens,zoom_value,pan,panload,doctoload,az,rtp
// -----------------------------------------------------

// create two arrays: one for regular and one for auto zoom
var zmArray = [1,2,3,4,6,10,20,50,100,180];
a_val = 1;
a_fac = 1.01;
var a_zmArray = [1];

// loop 67 times approximately 180x magnification
for(i = 1; i < 68; i ++) 
{
	a_fac += 0.0021;
	a_val = a_val * a_fac;
	a_zmArray[i] = Number(a_val.toFixed(2));
}

// use only integer part of last magnification
a_zmArray[a_zmArray.length - 1] = parseInt(a_zmArray[a_zmArray.length - 1]);

// initializes svg viewer
function init(evt) 
{
    // get parent document
	svgdoc = evt.target.ownerDocument;
	
	// get svg size
	var main_viewbox = svgdoc.getElementById("main").getAttributeNS(null,"viewBox").split(" ");
	propW = Number(main_viewbox[2]);
	propH = Number(main_viewbox[3]);
	pan_boxX = svgdoc.getElementById("pan").getAttributeNS(null, "x");
	pan_boxY = svgdoc.getElementById("pan").getAttributeNS(null, "y");
	pan_boxW = svgdoc.getElementById("pan").getAttributeNS(null, "width");
	pan_boxH = svgdoc.getElementById("pan").getAttributeNS(null, "height");
	
	// get lens object
	lens = svgdoc.getElementById("lens");
	
	// initialize zoom and pan flags
	rtp = true;
	az = true;
	first = true;
	Step = zmArray;
	reset();
}

// swaps svg file loaded in viewer
function load_svg(evt,url) 
{
    // ASV method
	if (window.getURL) 
	{
	    // get file url
		getURL(url, getURLCallback);
		function getURLCallback(data) 
		{
		    // check status
			if (data.success)
			{
			    // show file when loaded
			    var node = parseXML(data.content, document);
			    addDoc(evt, node.firstChild);
			}
		}
	}
	else
	{
	    // AJAX method
	    var xmlRequest = null;
		if (window.XMLHttpRequest) 
	    {
	        // check file if loaded
		    function XMLHttpRequestCallback() 
		    {
		        // check request state
			    if (xmlRequest.readyState == 4) 
			    {
				    if (xmlRequest.status == 200) { addDoc(evt,xmlRequest.responseXML.documentElement); }
                }
		    }
        }
		
		// create xmlhttp request
		if (window.XMLHttpRequest) 
		{
		    // mozilla, safari, etc..
            xmlRequest = new XMLHttpRequest();
            if (xmlRequest.overrideMimeType) 
            {
                // override content type
                xmlRequest.overrideMimeType('text/xml');
            }
        } 
        
        // internet explorer
        else if (window.ActiveXObject) 
        {
            // use ie activex object
            try { xmlRequest = new ActiveXObject("Msxml2.XMLHTTP"); } 
            catch (e) 
            {
                try { xmlRequest = new ActiveXObject("Microsoft.XMLHTTP"); } 
                catch (e) {}
            }
        }

        // check request if created
        if (!xmlRequest) 
        {
            alert('ERROR: Failed to create XMLHTTP instance.');
            return false;
        }
        
        // download file
		xmlRequest.open("GET",url,true);
		xmlRequest.onreadystatechange = XMLHttpRequestCallback;
		xmlRequest.send(null);
	}
}

// replaces previously loaded file with new one
function addDoc(evt,node) 
{
    // get document handle
	var olddoc = svgdoc.getElementById("doctoload");
	var newdoc = node;
	while (newdoc != null && newdoc.nodeName != "svg") {
		newdoc = newdoc.nextSibling;
	}

    // check if svg tag was found
	if (newdoc == null) 
	{
		alert("ERROR: failed to find <svg> element in " + node.parent.nodeName);
		return;
	}
	
	// load map
	svgdoc.getElementById("map").removeChild(olddoc);
	svgdoc.getElementById("map").appendChild(newdoc);
	set_pan_viewbox(evt);
	zoom('org');
}

// updates the pan viewbox
function set_pan_viewbox(evt) 
{
    // set pan's viewbox based on main svg file's viewbox
	var map_doc = svgdoc.getElementById("doctoload");
	var map_viewbox = map_doc.getAttributeNS(null,"viewBox");
	svgdoc.getElementById("pan").setAttributeNS(null,"viewBox",map_viewbox);
	
    // get coordinates and dimensions from viewbox
	map_viewbox = map_viewbox.split(" ");
	nav_x = Number(map_viewbox[0]);
	nav_y = Number(map_viewbox[1]);
	nav_w = Number(map_viewbox[2]);
	nav_h = Number(map_viewbox[3]);
	
    // convert width-height units
	doc_vb_ratio = nav_w / map_doc.getAttributeNS(null,"width");
	set_scale("panload", doc_vb_ratio);
	set_scale("lensxf", doc_vb_ratio);
	nav_w /= doc_vb_ratio;
	nav_h /= doc_vb_ratio;
	doc_aspect = nav_w / nav_h;
	disp_aspect = svgdoc.getElementById("map").getAttributeNS(null,"width") / svgdoc.getElementById("map").getAttributeNS(null,"height");

    // get scale
	width_vb_ratio = nav_w / pan_boxW;
	height_vb_ratio = nav_h / pan_boxH;

    /*
    w_prop establishes the proportion of the lens width in respect to the rectangle's (lens) width+height (Sides[]). 
    Since we chose the zoom to take into account surface area for enlargment/reduction rather then width, to simulate 
    analog optical appliances, we convert the rectangle into a square of equivalent perimeter, then get the ratio 
    between rectangle's and square areas (rect2sq_ratio), and finally convert it back to a rectangle using w_prop.
    */
	w_prop = nav_w / (nav_w + nav_h);
	area = nav_w * nav_h;
	Sides = [nav_w + nav_h];
	wSide = [nav_w];
	hSide = [nav_h];
	rect2sq_ratio = area / Math.pow((Sides[0]) / 2,2);
	zoom_set(evt);
}

// toggles zooming and panning mode
function zoom_switch(evt,f) 
{
    // check if panning
	if (f == "rtp") 
	{
	    // toggle panning flag
		rtp ? rtp = false : rtp = true;
		var a = rtp;
	}
	
	// check if zooming
	else if (f == "az") 
	{
	    // toggle zooming flag
		az ? az = false : az = true;
		az ? Step = a_zmArray : Step = zmArray;
		s = 0;
		var a = az;	
		if (first == false) {
			zoom_set(evt);
		}
	}
	
	// update button state
	a ? op = 1 : op = 0;
	svgdoc.getElementById(f).setAttributeNS(null,"fill-opacity",op);
}

// calculates new lens area
function zoom_set(evt) 
{
	first = false;
	for(i = 1; i < Step.length; i ++) 
	{
        // calculate new lens area according to the value of the next magnitude Step, then convert into a square of eqivalent perimeter using rect2sq_ratio. 
        // get the square's two sides sum and store result into Sides[] array. then store the sides values.
		Sides[i] = Math.sqrt((area * (Step[0] / Step[i])) / rect2sq_ratio) * 2;
		wSide[i] = Sides[i] * w_prop;
		hSide[i] = Sides[i] - wSide[i];

        // adjust zoom to reflect aspect ratio differences
		if (wSide[i] / hSide[i] < disp_aspect) { wSide[i] = Math.min(nav_w, hSide[i]*disp_aspect); } 
		else if (wSide[i] / hSide[i] > disp_aspect) { hSide[i] = Math.min(nav_h, wSide[i]/disp_aspect); }
	}
	
    // reset the zoom lens rect attributes on switching from regular to auto and viceversa
	setCoor(nav_x,nav_y,nav_w,nav_h);
	svgdoc.getElementById("zoom_value").firstChild.data = Step[0];
}

// zooms in or out the svg file
function zoom(in_out) 
{
    // check if user clicked zoom before anything is loaded
	if (first) return;
	
	// check zoom level
	z_dir = in_out;
	if (in_out == "org") s = 0;
	else 
	{
        // increments or decrements array index and prevents overflow
		(in_out == "in") ? s += 1 * (s < Step.length - 1) : s -= 1 * (s > 0);
	}
	
	// get current coordinates and dimensions
	getCoor();
	lensX += ((lensW - wSide[s]) / 2);
	lensY += ((lensH - hSide[s]) / 2);
	if (s == 0) 
	{
		lensX = nav_x;
		lensY = nav_y;
	}
	
	// update zoom value
	setCoor(lensX,lensY,wSide[s],hSide[s]);
	svgdoc.getElementById("zoom_value").firstChild.data = Step[s];
	if(az && in_out != "org") loop = setTimeout('zoom(z_dir)',40);
}

// enables lens to be dragged by user
function enable_drag(evt,grab) 
{
    // check if grabbing
	getCoor();
	if (grab) 
	{
	    // start moving lens
		svgdoc.getElementById("dragbox").setAttributeNS(null,"pointer-events","all");
		getEvt(evt);
		offsetX = (evtX * ratio - pan_boxX) * width_vb_ratio - lensX;
		offsetY = (evtY * ratio - pan_boxY) * height_vb_ratio - lensY;
	}
	else 
	{
	    // stop moving lens
		svgdoc.getElementById("dragbox").setAttributeNS(null,"pointer-events","none");
		setCoor(lensX,lensY,lensW,lensH);
	}
}

// moves the lens when panning
function pan(evt) 
{
    // get lens position
	getEvt(evt);
	lensX = (evtX * ratio - pan_boxX) * width_vb_ratio - offsetX;
	lensY = (evtY * ratio - pan_boxY) * height_vb_ratio - offsetY;
	
	// check limits
	if (lensX < nav_x) { lensX = nav_x; }
	else if ((lensX) > (nav_w - lensW)) { lensX = nav_w - lensW; }
	if (lensY < nav_y) { lensY = nav_y; }
	else if ((lensY) > (nav_h - lensH)) { lensY = nav_h - lensH; }
	
	// move lens to new position
	lens.setAttributeNS(null,"x",lensX);
	lens.setAttributeNS(null,"y",lensY);
	
	// update main image's viewbox
	if (rtp) svgdoc.getElementById("map").setAttributeNS(null,"viewBox",lensX + " " + lensY + " " + lensW + " " + lensH);
}

// moves the lens when arrow panning
function arrowPan(x,y) 
{
    // get current lens position
	getCoor();
	lensX += x;
	lensY += y;
	
	// check limits
	if (lensX < nav_x) { lensX = nav_x; }
	else if ((lensX) > (nav_w - lensW)) { lensX = nav_w - lensW; }
	if (lensY < nav_y) { lensY = nav_y; }
	else if ((lensY) > (nav_h - lensH)) { lensY = nav_h - lensH; }
	
	// move lens to new position
	setCoor(lensX,lensY,lensW,lensH);
	loopX = x;
	loopY = y;
	loop = setTimeout('arrowPan(loopX,loopY)', 40);
}

// reverts viewbox to default
function reset() 
{
    // get window dimensions
	var w = window.innerWidth;
	var h = window.innerHeight;
	
	// get aspect ratio
	win_ratio = w / h;
	vBox_ratio = propW / propH;
	
	// update aspect ratio
	if(win_ratio >= vBox_ratio) ratio = propH / h;
	else ratio = propW / w;
}

// gets the event coordinates
function getEvt(evt) {
	evtX = parseFloat(evt.clientX);
	evtY = parseFloat(evt.clientY);
}

// gets the lens' position and dimension
function getCoor() 
{
	lensX = parseFloat(lens.getAttributeNS(null,"x"));
	lensY = parseFloat(lens.getAttributeNS(null,"y"));
	lensW = parseFloat(lens.getAttributeNS(null,"width"));
	lensH = parseFloat(lens.getAttributeNS(null,"height"));
}

// sets the lens' position and dimension
function setCoor(a,b,c,d) 
{
	lens.setAttributeNS(null,"x",a);
	lens.setAttributeNS(null,"y",b);
	lens.setAttributeNS(null,"width",c);
	lens.setAttributeNS(null,"height",d);
	svgdoc.getElementById("map").setAttributeNS(null,"viewBox",a + " " + b + " " + c + " " + d);
}

// stops auto-zooming
function stopauto() { if(loop != null) clearTimeout (loop); }
function set_scale(id,scale) 
{
    // updates the object's scale
	var elm = svgdoc.getElementById(id);
	elm.setAttributeNS(null, "transform", "scale(" + scale + ")");
}