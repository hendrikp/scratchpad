/**
 * 3D Data Store for a model.
 * Missing properties/arrays (commented out)
 * are mixed in from data module.
 * All given properties/arrays must be exported.
 * 
 * @namespace cog1.data
 * @module cube
 */
define(["exports"], function(exports) {

	// Edge length of the cube.
	var a = 200;

	exports.vertices = [
		// bottom
		[-a,-a, a],
		[ a,-a, a],
		[ a,-a,-a],
		[-a,-a,-a],
		// top		
		[-a,a, a],
		[ a,a, a],
		[ a,a,-a],
		[-a,a,-a],
	];
	// Use default colors, implicitly.
	// exports.colors = data.colors;
	// exports.textureCoord = [];	
	exports.polygonVertices = [
		[3,2,1,0],
		[4,5,6,7],
		[0,1,5,4],
		[1,2,6,5],
		[2,3,7,6],
		[3,0,4,7]
	];	
	exports.polygonColors = [0,1,2,3,4,5];
	//exports.vertexNormals = [];
	//exports.polygonNormals = [];
	//exports.polygonTextureCoord = [];
	
});