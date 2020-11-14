/**
 * Populate the scene-graph with nodes,
 * calling methods form the scenegraph module.
 * @namespace cog1
 * @module createScene
 */
define(["exports", "scenegraph"], function(exports, scenegraph) {
	/*
	 * 	Call methods form the scene-graph (tree) module to create the scene.
	 *
	 */
	function init() {
		//var teapotNode = scenegraph.createNodeWithModel("teapot", "teapot");
		//teapotNode.rotate([3.5,0,0]);
		
		var sphereNode = scenegraph.createNodeWithModel("sphere", "sphere");
		sphereNode.translate([-175,0,0]);
		
		var waltheadNode = scenegraph.createNodeWithModel("walthead", "walthead");
		waltheadNode.rotate([Math.PI,0,0]);
		waltheadNode.translate([175,0,0]);
		
		//var cubeNode = scenegraph.createNodeWithModel("cube", "cube");
		//cubeNode.translate([0,0,-10]);
		//cubeNode.rotate([1,1,1]);
		
		//var insideOutPolyNode = scenegraph.createNodeWithModel("insideOutPoly", "insideOutPoly");

		scenegraph.setLights(0.3,1,[400,0,-400],0.75,8);
	}

	// Public API.
	exports.init = init;
});