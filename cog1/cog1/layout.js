/**
 * The application layout
 * HTML und div containers
 * @namespace cog1
 * @module layout
 */
define(["exports", "ui", "dojo", "dojo/dom", "dojo/dom-construct", "dojo/dom-style", "dijit/layout/BorderContainer", "dijit/layout/ContentPane"],
// Local parameters for required modules.
function(exports, ui, dojo, dom, domConstruct, domStyle, BorderContainer, ContentPane) {

	// Layout container for the canvas.
	var canvasPane, controlsPane, helpPane, infoPane;

	/**
	 * Initialize HTML skeleton with dijit layout widgets.
	 * @ parameter createSceneFkt is executed from scene-graph.
	 */
	function init() {

		// Create the top div container and append it to the HTML body.
		var body = dojo.body();
		var appLayoutDiv = domConstruct.create("div", {id : "appLayout", "class":"appLayout"}, body);

		// Create a BorderContainer and attach it to the top appLayout div.
		var appLayout = new BorderContainer({
			design : "headline"
		}, "appLayout");
		
		// Create content panes within the border container.
		var headerPane = new ContentPane({
        region: "top",
        "class": "edgePanel",
        content: "COG1 Rendering Pipeline"
    	});
    	appLayout.addChild(headerPane);

		// infoPane = new ContentPane({
        // region: "left",
        // "class": "edgePanel",
        // //content: "help"
    	// });		
    	// appLayout.addChild(infoPane);

		helpPane = new ContentPane({
        region: "bottom",
        "class": "edgePanel"
        //content: "help"
    	});		
    	appLayout.addChild(helpPane);

		controlsPane = new ContentPane({
        region: "right",
        "class": "edgePanel"
        //content: "controls"
    	});		
    	appLayout.addChild(controlsPane);

		canvasPane = new ContentPane({
        region: "center",
        "class": "centerPanel",
		//style: "overflow:hidden",
		doLayout : true
        //content: "canvas"
    	});		
    	appLayout.addChild(canvasPane);
    	// Give the canvas a pane a custom resize.
    	
		// Now that the basic layout exists, init the GUI.
		ui.init();
		
		// start up widgets and do layout.
		appLayout.startup();
		
		//debugger;
		
		// Create a canvas for the scene.
		// Resize canvas to size of center region.
		// Deduce some small value to avoid scroll bars.
		// The sizes are set directly in the pane and its domNode and its containerNode:
		// .domNode.scrollWidth;//w ;//containerNode//domNode.style.width//clientHeight;//.containerNode.clientWidth;
		// .domNode.scrollHeight;//h ;//domNode.style.height;//.containerNode.clientHeight;
		//var canvasWidth = canvasPane.w - 25;
		//var canvasHeight = canvasPane.h - 25 ;
		//console.log("canvas width x height:"+canvasWidth+" x "+canvasHeight);
		var canvas = domConstruct.create("canvas", {
			id : "canvas",
			// use dynamic canvas size from center container.
			//Úwidth : canvasWidth,//800,
			//height : canvasHeight,//500
			className : "canvas"
		}, canvasPane.domNode, "first");
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
		
	}
	
	function getCanvasContainer(){
		return canvasPane.domNode;
	}

	function getContorlsContainer(){
		return controlsPane.domNode;
	}

	function getHelpContainer(){
		return helpPane.domNode;
	}

	function getInfoContainer(){
		return infoPane.domNode;
	}

	// Public API.
	exports.init = init;
	exports.getCanvasContainer = getCanvasContainer;
	exports.getContorlsContainer = getContorlsContainer;
	exports.getHelpContainer = getHelpContainer;
	exports.getInfoContainer = getInfoContainer;
});
