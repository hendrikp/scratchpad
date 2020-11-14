/**
 * Fragment shader for the light calculation.
 * Interpolation has to be done as well.
 *
 * Shader will be called from the scene and from raster.
 *
 * @namespace cog1.shader
 * @module shader
 */
define(["exports", "scenegraph"], function(exports, scenegraph) {

	// Function called from raster.scanline function.
	var shadingFuncton = noShading;

	// Store position and intensity of the light
	// from scenegraph for speedup. 
	// Scenegraph has to keep theses values up-to-date.
	var lightPositon = null;
	var pointLightIntensity = 0.0;
	var ambientLigthIntensity = 0.0;

	// Data of the model.
	var model = null;
	var polygonIndex = undefined;
	var modelData = null;
	var vertices = null;
	var polygons = null;
	var vertexNormals = null;
	var polygonNormals = null;

	// Index of the current polygon.
	var polygonIndex = undefined;
	// The current polygon.
	var polygon = undefined;
	// Normal of the current polygon.
	var polygonNormal = null;
	// Light intensities at the vertices of the current polygon.
	var intensities = [];

	// Single light intensity for the current polygon.
	var polygonLightIntensity;
	// Light intensity at the vertices corner-points of the current polygon.
	// Used for gourand shading.
	var polygonVertexLightIntensity = [];
	
	// Pointer/reference to the shading function.
	// The shadingFunction is called directly from raster to save the time for the lookup.
	// The name of the shading function is kept in the scene.
	var shadingFunction;	

	function init() {
	}

	/**
	 * Set position and intensities of the light.
	 */
	function setLights(ambientLI, pointLI, pointPos) {
		// Get parameters of the (single) light from scenegraph.
		ambientLigthIntensity = ambientLI;
		pointLigthIntensity = pointLI;
		lightPositon = [];
		vec3.set(pointPos, lightPositon);
	}
	
	/**
	 * Set a function to perform the shading (noneflat, phong, etc..).
	 * The default is no shading.
	 */
	function setShadingFunction(functiontName) {
		shadingFunction = this[functiontName];
	}
	
	/**
	 * Depending on the shading function, do some
	 * pre-calculation for the current polygon.
	 */
	function initShadingFunctionForPolygon() {
		switch(shadingFunction) {
			case(noShading):
				break;
			case(flat):
				flatInit();
				break;
			case(gouraud):
				gouraudInit();
				break;
			case(phong):
				phongInit();
				break;
		}
	}

	/**
	 * @returns a refenence to the current shading function
	 */
	function getShadingFunction() {
		return shadingFunction;
	}

	/**
	 * Prepare shader and interpolation with the data for one model.
	 * Function is called from scene.
	 */
	function setModel(_model) {
		model = _model;
		modelData = model.getData();
		vertices = model.getTransformedVertices();
		polygons = modelData.polygonVertices;
		vertexNormals = model.getTransformedVertexNormals();
		polygonNormals = model.getTransformedPolygonNormals();
	}

	/**
	 * Prepare shader and interpolation for polygon.
	 * Function is called from scene.
	 * @parameter polygonIndex is the index of the polygon to process.
	 * @return true if the normal points in positive z-direction.
	 */
	function setPolygon(_polygonIndex) {
		if(model == null) {
			console.error("Error in setPolygon: no model set.");
			return false;
		}
		polygonIndex = _polygonIndex;
		polygon = polygons[polygonIndex];
		polygonNormal = polygonNormals[polygonIndex];

		// BEGIN exercise back-face culling

		// Check if polygon is facing away from the camera.

		// END exercise back-face culling

		initShadingFunctionForPolygon();

		return true;
	}

	/**
	 * Light intensity for a 3D-Point, that we do not name vertex
	 * as it can be a 3D-position on a polygon, as well as a vertex of the model.
	 * @parameters point vec3 of 3D-Array
	 */
	function calcLightIntensity(point, normal) {
		var lightDirection = [];
		vec3.direction(lightPositon, point, lightDirection);
		var intensity = Math.max(0.0, vec3.dot(lightDirection, normal));
		return intensity * pointLightIntensity + ambientLigthIntensity;
	}


	/**
	 * Do no shading, just return the color.
	 * In general, calculate the light an the final color.
	 * Function is called from raster during scan-line.
	 * Functions setModle and setPolygon have to be called first.
	 * @parameter x, y, z, position of fragment in world coordinates.
	 * @parameter modify rgbaShaded field of color of the fragment.
	 * @return nothing
	 */
	function noShading(x, y, z, color) {
	}

	// BEGIN exercise Shading

	/**
	 * See function noShading.
	 */
	function flat(x, y, z, color) {
	}

	/**
	 * 	Calculate one light intensity for the current polygon.
	 */
	function flatInit() {
		// Calculate the center point of the polygon.

		// Calculate light intensity at polygon center..

	}

	/**
	 * See function noShading.
	 */
	function gouraud(x, y, z, color) {
	}

	function gouraudInit() {
		// Calculate light intensity at all vertices/corners.
	}

	/**
	 * See function noShading.
	 */
	function phong(x, y, z, color) {
	}

	function phongInit() {
	}

	/**
	 * Interpolate on the current polygon for the given position.
	 * @return weight/influence of the vertices/corners.
	 */
	function interpolate(x, y, z) {
		var weights = [];
		//todo Baricentric coordinates.

		return weights;
	}

	// END exercise Shading

	/**
	 * Do a check before the shading function is executed.
	 * The check may also be skipped for speed.
	 */
	function isEverytingSet() {
		if(model == null) {
			console.error("Error in shader: no model set.");
			return false;
		}
		if(polygonIndex == undefined) {
			console.error("Error in shader: no polygonIndex set.");
			return false;
		}
		return true;
	}

	// Public API.
	exports.init = init;
	exports.setLights = setLights;
	exports.setModel = setModel;
	exports.setPolygon = setPolygon;
	exports.setShadingFunction = setShadingFunction;
	exports.getShadingFunction = getShadingFunction;
	// Export shading function to pass them as direct reference to other modules for speed.
	exports.noShading = noShading;
	exports.flat = flat;
	exports.gouraud = gouraud;
	exports.phong = phong;
});
