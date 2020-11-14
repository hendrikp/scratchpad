/**
* 3D Data Store for a model.
* Missing properties/arrays (commented out)
* are mixed in from data module.
* All given properties/arrays must be exported.
*
* Data-Source: http://learningwebgl.com
*
* @namespace cog1.data
* @module sphere
*/
define(["exports", "glMatrix"], function(exports) {
	//scale
	var vertexPositionData = [];
	var normalData = [];
	var textureCoordData = [];
	
	var latitudeBands = 20;
	var longitudeBands = 20;
	var radius = 200;
	
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		var theta = latNumber * Math.PI / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			var phi = longNumber * 2 * Math.PI / longitudeBands;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (longNumber / longitudeBands);
			var v = 1 - (latNumber / latitudeBands);
			
			var n = [x,y,z];
			//vec3.negate(n);
			normalData.push(n);
			textureCoordData.push([u,v]);
			vertexPositionData.push([radius * x, radius * y, radius * z]);
		}
	}
	exports.vertices = vertexPositionData;
	exports.textureCoord = textureCoordData;
	exports.vertexNormals = normalData;
	
	var indexData = [];
	for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
		for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
			var first = (latNumber * (longitudeBands + 1)) + longNumber;
			var second = first + longitudeBands + 1;
			
			// changed so normal direction is correct
			indexData.push([first+1, second, first]);
			indexData.push([first+1, second+1, second]);
		}
	}
	exports.polygonVertices = indexData;
	
	function poly2col (poly, col) {
		var ret = [];
		for (var i = 0; i < poly.length; ++i) ret.push(col);
		return ret;
	}
	exports.polygonColors = poly2col(exports.polygonVertices, 3);
	
	return;
});
