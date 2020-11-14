/**
 * The user interface UI communicates with the app and with the scene.
 *
 * @namespace cog1
 * @module ui
 */
define(["exports", "app", "layout", "scene", "scenegraph", "shader", "raster", "framebuffer", "dojo", "dojo/html", "dojo/on", "dojo/dom", "dojo/dom-construct", "dojo/dom-style", "dojo/mouse", "dijit/form/Button", "dijit/form/ToggleButton", "dijit/form/Slider", "dijit/form/VerticalSlider", "dijit/form/HorizontalSlider", "dijit/form/TextBox", "dojo/domReady!", "glMatrix"],
// Local parameters for required modules.
function ui(exports, app, layout, scene, scenegraph, shader, raster, framebuffer, dojo, html, on, dom, domConstruct, domStyle, mouse) {

	// Transformation deltas for on step.
	var delta = {
		rotate : 0.1,
		translate : 10.0,
		scale : 0.1
	};
	// Rotationaxises.
	var axises = {
		X : [1, 0, 0],
		Y : [0, 1, 0],
		Z : [0, 0, 1]
	};
	var signs = {
		plus : "+",
		minus : "-"
	};

	// Variables to track mouse movement.
	var mousePosX;
	var mousePosY;
	var currMouseButton;

	// Connect keys with modifier keys to callbacks.
	var keyCallbacks = {
		none : {
			tranformation : "rotate"
		},
		altKey : {
			tranformation : "translate"
		},
		ctrlKey : {
			tranformation : "scale"
		}
	};

	// Some HTML help text on the UI.
	var helpText = "";

	// Layout container dom Nodes.
	var controlsContainer;
	var helpContainer;

	// Node to interactive with.
	var interactNode = null;

	/*
	 * Function for dynamic changes in the GUI,
	 * e.g., select a node to interact with.
	 * Called from the render loop in each frame,
	 * i.e. after each render-update.
	 */
	function update() {
		// Interact with the fist/root node.
		interactNode = scenegraph.getRootNode();
	}

	/**
	 * Initialize the UI callbacks. Display help text.
	 */
	function init() {
		controlsContainer = layout.getContorlsContainer();
		helpContainer = layout.getHelpContainer();

		// Create GUI elements and callbacks.
		//
		//initDebugButtons();
		initTransformationButtons();
		initEffectButtons();
		initLightControls();
		initMouseEvents();
		intiHelpText();
		// Do initial update.
		update();
	}

	/**
	 * Button for software debug.
	 */
	function initDebugButtons(){
		createButton("test", debugButtonCallback);
	}

	function debugButtonCallback(){
		var fkt = shader.getShadingFunction();
		console.log(fkt);
	}

	// Animation button stuff
	var minInterval = 5;
	var animationInterval;
	var animationRunning = false;
	
	function animateY()
	{
		animationRunning = true;
		
		getInteractNode()["rotate"]([0,0.05,0]);
		app.start(false); // Wake up the animation-loop in case it is not running continuously.
		
		if(animationInterval > minInterval) // don't allow under 10 ms
		{
			setTimeout(animateY, animationInterval);
		} else {
			animationRunning = false;
		}
	}
	
	function initTransformationButtons() {
		// Buttons for transformations: translate, rotate, scale.
		for(var transform in delta) {
			label(transform+":");
			br();
			for(var axis in axises) {
				for(var sign in signs) {
					var labeltext = signs[sign] + axis;
					var callback = callbackFactoryTransformNode(transform, signs[sign], delta[transform], axises[axis]);
					createButton(labeltext, callback, false); 
					initKey(callback, transform, axis, sign);
				}
			}
			br();
			
			if(transform == "rotate")
			{
				// animation
				createSlider("y-rot-anim timer: ",
					function(val)
					{
						animationInterval = val;
						
						if(!animationRunning)
							animateY();
					},
					0, 500, 1, 0);
			}
		}

		createButton("+zoom", function() {
			var node = getInteractNode();
			
			// Check if we have a node to interact with.
			if(node == null) {
				console.log("Button: No interactive node.");
				return;
			}
			
			// Transform node.
			node["scale"](vec3.create([0.1,0.1,0.1]));
			
			// Wake up the animation-loop in case it is not running continuously.
			app.start(false);
		}, false); 
		
		createButton("-zoom", function() {
			var node = getInteractNode();
			
			// Check if we have a node to interact with.
			if(node == null) {
				console.log("Button: No interactive node.");
				return;
			}
			
			// Transform node.
			node["scale"](vec3.create([-0.1,-0.1,-0.1]));
			
			// Wake up the animation-loop in case it is not running continuously.
			app.start(false);
		}, false); 
		
		br();
		p();
	}

	function initEffectButtons()
	{
		// Fullscreen
		createButton("fullscreen", function() {
			var elem = document.querySelector("#canvas");
			if (elem.webkitRequestFullscreen) { // chrome
				elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			} else {
				if (elem.mozRequestFullScreen) { // firefox
					elem.mozRequestFullScreen();
				} else { // opera
					elem.requestFullscreen();
				}
			}
		}, false);
		br();
		
		// Debug Infos
		createToggleButton("show debuginfos", scene.toggleShowDebugInfos, scene.getShowDebugInfos());
		// Set polygon fill.
		createToggleButton("wireframe", scene.toggleFill, ! scene.getFill());
		// Toggle z-buffer debug.
		createToggleButton("show z-buffer", scene.toggleDebugZBuffer, scene.getDebug_zBuffer());
		// Toggle z-buffer debug.
		createToggleButton("use plane equation", raster.togglePlaneEquation, raster.getPlaneEquation());
		// Toggle debug normals.
		createToggleButton("normals & edges", scene.toggleDebugNormals, scene.getDisplayNormals());
		// Toggle triangulation.
		createToggleButton("triangulation", scene.toggleTriangulation, scene.getDataIsTriangulated() );
		// Toggle backface culling
		createToggleButton("backface culling", shader.toggleBackFaceCulling, shader.getBackFaceCulling());
	}
	
	function initLightControls()
	{
		// Toggle light
		createToggleButton("pointlight", scenegraph.togglePointLight, scenegraph.getPointLightOn());
		
		// Light X-Position
		createSlider("light xpos: ", scenegraph.setLightPositionX, 0, 1000, 1, scenegraph.getLightPositionX());
		
		// Light Y-Position
		createSlider("light ypos: ", scenegraph.setLightPositionY, 0, 1000, 1, scenegraph.getLightPositionY());

		// Light Z-Position
		createSlider("light zpos: ", scenegraph.setLightPositionZ, -1000, 1000, 1, scenegraph.getLightPositionZ());
		
		// Light intensity
		createSlider("point light intensity: ", scenegraph.setPointLightIntensity, 0, 5, 1000, scenegraph.getPointLightIntensity());
		
		// Ambient light intensity
		createSlider("ambient light intensity: ", scenegraph.setAmbientLightIntensity, 0, 1, 1000, scenegraph.getAmbientLightIntensity());
		
		// specular light intensity
		createSlider("specular light intensity: ", scenegraph.setSpecularLightIntensity, 0, 1, 1000, scenegraph.getSpecularLightIntensity());
		
		// Shininess
		createSlider("shininess: ", scenegraph.setShininess, 1, 64, 1, scenegraph.getShininess());
	}
	
	/////////////////////// Controls helper functions ///////////////////////

	function createSlider(labelt, onChangeFct, min, max, vscale, val){
		p();
		var horizontalSliderNode = domConstruct.create('div', {}, controlsContainer);
		label(labelt, horizontalSliderNode);
			
		var startval = val;
		starval = startval.toFixed(2) / 1;
			
		var valX = text("" + starval, horizontalSliderNode);
		var horizontalSlider = new dijit.form.HorizontalSlider({
			value : val * vscale,
			minimum : min * vscale,
			maximum : max * vscale,
			discreteValues : 1000,
			intermediateChanges : true,
			intermediateChanges : true,
			style : "width:250px;",
			onChange: function(value)
			{
				value /= vscale;
				value = value.toFixed(2) / 1;
				
				valX.innerHTML = value;
				onChangeFct( value );
			}
		}, horizontalSliderNode).placeAt(controlsContainer);
		
		return horizontalSlider;
	}

	/**
	 * @parameter br adds a linebreak after the button, default is true
	 * @return the dom node for the button
	 */
	function createButton(label, onClickFct, _br) {

		var button = new dijit.form.Button({
			label : label,
			onClick : onClickFct
		}).placeAt(controlsContainer);

		if(_br == true || _br == undefined) {
			br();
		}
		return button;
	}

	/**
	 * @parameter br adds a linebreak after the button, default is true
	 * @parameter checked is per default false, if undefined
	 * @return the dom node for the button
	 */
	function createToggleButton(label, onClickFct, checked, _br) {
		// Start up of the widgets is done in layout
		// (automatically because of the hierarchy)
		if(checked == undefined) {
			checked = false;
		}
		var button = new dijit.form.ToggleButton({
			iconClass : "dijitCheckBoxIcon",
			label : label,
			checked : checked,
			onClick : onClickFct
		}).placeAt(controlsContainer);
		//dojo.place(toggleLightButton.domNode, controlsContainer);
		//toggleLightButton.startup();

		if(_br == true || _br == undefined) {
			br();
		}
		return button;
	}
	
	/**
	 * Adds span with text into the current flow of controls.
	 */
	function text(_text, container) {
		if(container == undefined) { container = controlsContainer; }
		var span = domConstruct.create("span", {}, container);
		html.set(span, _text);
		return span;
	}

	/**
	 * Adds label with text into the current flow of controls.
	 */
	function label(_text, container) {
		if(container == undefined) { container = controlsContainer; }
		var label = domConstruct.create("label", {innerHTML:_text}, container);
		return label;
	}

	/**
	 * Adds a linebreak into the current flow of controls.
	 */
	function br() {
		domConstruct.create("br", {}, controlsContainer);
	}

	/**
	 * Adds a paragraph into the current flow of controls.
	 */
	function p() {
		domConstruct.create("p", {}, controlsContainer);
	}

	function intiHelpText() {
		helpText = "";
		// Display the help text.
		helpText += "<strong>Mouse:</strong> left = rotate, middle = translate";
		helpText += " "
		helpText += "<strong>Keys:</strong> x,y,z  to rotate plus Shift = +-sign, Alt = translate, Ctrl = scale";
		domConstruct.create("label", {
			id : "helpText",
			innerHTML : helpText
		}, helpContainer);
	}

	function callbackFactoryTransformNode(transformation, sign, delta, axis) {

		// Scale the transformation.
		if(sign == "-") {
			delta *= -1;
		}
		var scaledAxis = [];
		vec3.scale(axis, delta, scaledAxis);

		return function() {
			var node = getInteractNode();
			// Check if we have a node to interact with.
			if(node == null) {
				console.log("Button: No interactive node.");
				return;
			}
			// Transform node.
			node[transformation](scaledAxis);
			// Wake up the animation-loop in case it is not running
			// continuously.
			app.start(false);
		};
	}

	// //////////////////// Key Events //////////////////////

	function handleKeyEvent(e) {
		// The key as a char.
		var key = "";
		var keyCode = e.keyCode;
		// If the keyCode is 0 it must be a special key.
		if(keyCode == 0) {
			key = "";
		} else {
			key = String.fromCharCode(keyCode);
			// key = keyCode.charCodeAt[0];
		}
		// Adjust the case as keycodes corresponds to capital letters.
		if(e.shiftKey == true) {
			key = key.toUpperCase();
		} else {
			key = key.toLowerCase();
		}
		// console.log("Keydown: " + key);
		// console.log("keyCode: " + keyCode);
		// console.log(e);
		var modifierKey = "none";
		if(e.altKey) {
			modifierKey = "altKey";
		}
		if(e.ctrlKey) {
			modifierKey = "ctrlKey";
		}
		// Set stored callback for the pressed key and call it.
		var callback = keyCallbacks[modifierKey][key];
		if(callback == undefined) {
			// console.log("Key not defined: " + key);
			return;
		}
		callback();
	}

	/*
	 * Assign keys for transformations to callbacks. Keys are x,y,z plus
	 * modifiers plus shift for sign. @parameter callback: Use the same callback
	 * as for the buttons.
	 */
	function initKey(callback, transform, axis, sign) {

		var key = "";
		var modifierKey = "";
		// Set the modifier keys for the transforms.
		switch(transform) {
			case("rotate"):
				modifierKey = "none";
				break;
			case("translate"):
				modifierKey = "altKey";
				break;
			case("scale"):
				modifierKey = "ctrlKey";
				break;
		}
		// Use shift to toggle the sign.
		if(sign == "plus") {
			key = axis.toLowerCase();
		} else {
			key = axis.toUpperCase();
		}

		keyCallbacks[modifierKey][key] = callback;
		// helpText += key + "+" + modifierKey + " : " + transform + " " +
		// signs[sign] + axis + "<br/>";
	}

	// //////////////////// Mouse Events //////////////////////

	function initMouseEvents() {

		var canvasDiv = layout.getCanvasContainer();
		//dom.byId("canvasDiv");

		on(canvasDiv, "mousedown", onMouseDown);
		on(canvasDiv, "mouseup", onMouseUp);
		on(canvasDiv, "mousemove", onMouseMove);
		// Register key event handler function.
		// Key events: keydown, keypress, keyup.
		on(dojo.body(), "keydown", handleKeyEvent);
	}

	function onMouseDown(e) {
		// console.log("onMouseDown "+e);
		mousePosX = e.clientX;
		mousePosY = e.clientY;
		currMouseButton = e.button;
		// console.log("currMouseButton "+currMouseButton);
	}

	function onMouseUp(e) {
		// console.log("onMouseUp "+e);
		mousePosX = undefined;
		mousePosY = undefined;
		currMouseButton = undefined;
		// console.log("currMouseButton "+currMouseButton);
	}

	function onMouseMove(e) {
		// Check if we have a node to interact with.
		if(interactNode == null) {
			return;
		}

		// console.log("onMouseMove "+e);
		// Consider only mouse dragged events.
		// console.log("currMouseButton "+currMouseButton);
		if(currMouseButton == undefined) {
			return;
		}

		// Calc movement.
		var mousePosXNew = e.clientX;
		var mousePosYNew = e.clientY;
		// currMouseButton = e.button;
		var diffX = mousePosXNew - mousePosX;
		var diffY = mousePosYNew - mousePosY;
		
		// only redraw if noticable difference
		if(Math.abs(diffX) > 2 || Math.abs(diffY) > 2)
		{
			mousePosX = mousePosXNew;
			mousePosY = mousePosYNew;

			// Some representation of Z dim with a 2D mouse :(
			var diffZ = (diffX + diffY) / (Math.abs(diffX - diffY) + 1.0);
			// console.log("diff XYZ:"+diffX+"\t "+diffY+"\t "+diffZ+"\t ");
			// Difference vector for the transformation.
			var diffVec = [0, 0, 0];
			// The type of transformation.
			var transformation = undefined;
			// Scale the stepsize.
			var factor = 1;

			// Rotate.
			if(currMouseButton == "0") {
				transformation = "rotate";
				factor = 0.01;
				diffVec[0] += diffX * factor;
				diffVec[1] += diffY * factor;
				diffVec[2] += diffZ * factor;
			}
			// Translate.
			if(currMouseButton == "1") {
				transformation = "translate";
				factor = 2;
				diffVec[0] += diffX * factor;
				diffVec[1] += diffY * factor;
				// diffVec[2] += diffZ * factor;
			}
			// Scale.
			if(currMouseButton == "2") {
				transformation = "scale";
				// Max scale limit per mouse move.
				var limit = 1.1;
				// Adjust sensibility.
				diffX *= 0.5;
				diffY *= 0.5;
				diffZ *= 0.5;
				diffVec[0] *= Math.min(limit, Math.max(1, diffX));
				diffVec[1] *= Math.min(limit, Math.max(1, diffY));
				diffVec[2] *= Math.min(limit, Math.max(1, diffZ));
				// Divide if negative.
				diffVec[0] /= -Math.max(-limit, Math.min(-1, diffX));
				diffVec[1] /= -Math.max(-limit, Math.min(-1, diffY));
				diffVec[2] /= -Math.max(-limit, Math.min(-1, diffZ));
			}

			// Execute the transformation.
			if(transformation == undefined) {
				return;
			}
			// console.log("diffVec: "+diffVec);
			interactNode[transformation](diffVec);
		}

		// Wake up the animation-loop in case it is not running continuously.
		app.start(false);
	}
	
	///////////////// API: Getter / Setter //////////////////

	/*
	 * The current interactive node might change,
	 * thus we cannot set a reference at startup,
	 * but need a dynamic answer from a functio.
	 */
	function getInteractNode() {
		return interactNode;
	}

	function setInteractNode(node) {
		interactNode = node;
	}

	// //////////////////// Event Debug //////////////////////

	function debugEventAlert(e) {
		console.log(e);
		alert("Event:" + e);
	}

	// Public API.
	exports.init = init;
	exports.update = update;
	exports.setInteractNode = setInteractNode;
});
