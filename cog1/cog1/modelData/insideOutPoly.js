/**
 * 
 * Polygon to test scan-line algorithm.
 * 
 * @namespace cog1.data
 * @module insideOutPoly
 */
define(["exports"], function(exports) {

	// Edge length.
	var a = 100;
	// xOffset
	var x0 = -300;

	exports.vertices = [
		[+x0,0, 0],
		[ 7*a+x0,0, 0],
		[ 7*a+x0,2*a, 0],
		[ 6*a+x0,2*a, 0],
		[ 5*a+x0,1*a, 0],
		[ 4*a+x0,2*a, 0],
		[ 3*a+x0,2*a, 0],
		[ 2*a+x0,3*a, 0],
		[ 1*a+x0,2*a, 0],
		[ +x0,2*a, 0]
	];
	exports.polygonVertices = [
		[0,1,2,3,4,5,6,7,8,9]
	];	
	exports.polygonColors = [6];
});