/**
 * The application controller
 * @namespace cog1
 * @module app
 */
define(["exports", "layout", "ui", "scene"], function(exports, layout, ui, scene) {
	// Animation loop is running and scene is rendered continuously.
	var running = false;
	// Start date of the last animation loop frame.
	var startDate = null;
	// Time between calls to animation loop in milliseconds.
	var timeSinceLastFrame = 0;
	// The initialization process must finish before we can start the rendering loop.
	// But it should also not be called two times, thus to be sure.
	var initDone = false;

	/**
	 * This is the entry point.
	 * Load all external resources,
	 * then initialize own modules.
	 * Optionally create or augment the HTML-page.
	 * Finally start to rendering an animation loop.
	 */
	function load() {
		// Load external resources then proceed with init.
		//require(["cog1/ext/glMatrix.js","cog1/exercise.js"], init(createSceneFkt););
		//require(["cog1/ext/glMatrix.js"], function() { init(createSceneFkt); });
		init();
	}


	/**
	 * Initialize all modules from here.
	 * @ parameter createSceneFkt is executed from scenegraph.
	 */
	function init() {
		//console.log("app.init()");
		if(initDone) {
			//console.log("init already done.");
			return;
		} else {
			initDone = true;
		}

		// Init HTML layout and from there the GUI/UI with interaction.
		layout.init();
		scene.init();
		//ui.init();
		// Proceed directly to startup of the loop.
		//start();
	}

	/**
	 * Start the animation and interaction in the scene/on the canvas.
	 * @ parameter running if loop should run continuously, default, if not given is true.
	 * @ returns true if loop has been started.
	 */
	function start(_running) {
		//console.log("cog1.app.start()");

		if(!initDone) {
			init();
		}
		if(running) {
			//console.log("Animation loop is already running.");
			return;
		}
		// Run per default if no parameter is given.
		if( typeof _running != "boolean") {
			running = true;
		} else {
			running = _running;
		}
		startDate = Date.now();
		animLoop();
		return true;
	}

	/**
	 * Stop the animation of the scene.
	 */
	function stop() {
		running = false;
	}

	/**
	 * @returns a setTimeout function that stops when browser-tab is not visible.
	 */
	var requestAnimFrame = (function() {
		return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
		function(/* function */callback, /* DOMElement */element) {
			window.setTimeout(callback, 1000 / 60);
		};
	})();

	/*
	 * The animation loop is only run when something 
	 * changed in the scene.
	 * The scene is dirty (changed) as long as not all
	 * modules have finish loading their required data.
	 * We do not use the finished loading callback, because
	 * the do not want to track how many modes load.
	 * Instead we try continuously until the scene is clean. 
	 */
	function animLoop() {
		// Calculate the time since last call.
		var curDate = Date.now();
		timeSinceLastFrame = curDate - startDate;
		startDate = curDate;
		//console.log("animLoop " + timeSinceLastFrame);
		// Render. Scene return when it is up to date.
		var sceneIsUpToDate = scene.render();
		// Restart render loop.
		if(! sceneIsUpToDate || running) {
			requestAnimFrame(animLoop);
		} else {
			// The scene is up-to-date.
			// Update the GUI.
			ui.update();
			running = false;
			//console.log("animLoop stoped running");			
		}
	}

	// Public API.
	exports.load = load;
	exports.start = start;
	exports.stop = stop;
});
