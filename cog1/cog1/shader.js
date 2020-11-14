/** 
 * Fragment shader for the light calculation.
 * Interpolation has to be done as well.
 *
 * Shader will be called from the scene and from raster.
 *
 * @namespace cog1.shader
 * @module shader
 */
define(["exports", "scenegraph", "scene", "sampler"], function(exports, scenegraph, scene, sampler) {

	// Function called from raster.scanline function.
	var shadingFuncton = phong;

	// Store position and intensity of the light
	// from scenegraph for speedup. 
	// Scenegraph has to keep theses values up-to-date.
	var lightPositon = null;
	var pointLightIntensity = 0;
	var ambientLightIntensity = 0;

	// colored lights
	var ambientColor = [255,255,255];
	var diffuseColor = [255,255,255];

	// speedup
	var vec3scale = vec3.scale;
	var vec3set = vec3.set;
	var vec3direction = vec3.direction;
	var vec3dot = vec3.dot;
	var vec3cross = vec3.cross;
	var vec3add = vec3.add;
	var vec3subtract = vec3.subtract;
	var vec3scalevec3 = vec3.scalevec3;
	var vec3normalize = vec3.normalize;
	var Mathmax = Math.max;
	var Mathpow = Math.pow;
	
	var Math_sin = Math.sin;
	var Math_asin = Math.asin;
	var Math_cos = Math.cos;
	var Math_acos = Math.acos;
	var Math_tan = Math.tan;
	var Math_atan = Math.atan;
	var Math_abs = Math.abs;
	var Math_sqrt = Math.sqrt;
	var Math_pow = Math.pow;
	var Math_PI = Math.PI;

	// speedup
	vec3scale(ambientColor, 1/255);
	vec3scale(diffuseColor, 1/255);
	
	// colors for phong illumination
	var specColor = [255,255,255];
	
	var specularLightIntensity = 1;
	var shininess = 16;
	
	// Data of the model.
	var model = null;
	var polygonIndex = undefined;
	var modelData = null;
	var vertices = null;
	var polygons = null;
	var vertexNormals = null;
	var polygonNormals = null;
	var textureCoord = null;
	
	// Index of the current polygon.
	var polygonIndex = undefined;
	// The current polygon.
	var polygon = undefined;
	// Normal of the current polygon.
	var polygonNormal = null;
	// Light intensities at the vertices of the current polygon.
	var intensities = [];

	// Single light intensity for the current polygon.
	var polygonLightIntensity = [0, 0, 0];
	
	// Light intensity at the vertices corner-points of the current polygon.
	// Used for gourand shading.
	var polygonVertexLightIntensity = [];
	
	// Pointer/reference to the shading function.
	// The shadingFunction is called directly from raster to save the time for the lookup.
	// The name of the shading function is kept in the scene.
	var shadingFunction;	

	// for orthographic simply pointing down
	var cameraDirection = [0,0,-1];

	var backFaceCulling = true;
	
	function toggleBackFaceCulling()
	{
		backFaceCulling = !backFaceCulling;
		scene.setUpToDate(false);
	}
	exports.toggleBackFaceCulling = toggleBackFaceCulling;
	
	function getBackFaceCulling() {
		return backFaceCulling;
	}
	exports.getBackFaceCulling = getBackFaceCulling;
	
	function init() {
	}

	/**
	 * Set position and intensities of the light.
	 */
	function setLights(ambientLI, pointLI, pointPos, specLI, shine) {
		// Get parameters of the (single) light from scenegraph.
		ambientLightIntensity = ambientLI;
		pointLightIntensity = pointLI;
		specularLightIntensity = specLI;
		shininess = shine;
		
		lightPositon = [];
		vec3set(pointPos, lightPositon);
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
		textureCoord = modelData.textureCoord;
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
		if(backFaceCulling && (vec3dot(cameraDirection, polygonNormal) <= 0))
			return false;
		
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
		//var lightDirection = [];
		//vec3direction(lightPositon, point, lightDirection);
		var x = lightPositon[0] - point[0];
		var y = lightPositon[1] - point[1];
		var z = lightPositon[2] - point[2];
		var len = 1 / Math_sqrt(x*x + y*y + z*z);
		var lightDirection = [x * len, y * len, z * len];
	
		// Lambertian cosine law (diffuse intensity)
		//var intensityDiffuse = Mathmax(0.0, vec3dot(normal, lightDirection));
		var intensityDiffuse = normal[0]*lightDirection[0] + normal[1]*lightDirection[1] + normal[2]*lightDirection[2];
		var nlightdot2 = 2*intensityDiffuse; // remember for reflection speedup
		intensityDiffuse = intensityDiffuse > 0 ? intensityDiffuse : 0;
		
		// Phong Illumination
		
		// calculate reflection direction ( 2N (N dot L) - L )
		//var reflectionDirection = [0,0,0];
		//vec3scale(normal, 2, reflectionDirection);
		//vec3scale(reflectionDirection, vec3dot(normal, lightDirection));
		//vec3subtract(reflectionDirection, lightDirection);
		
		var reflectionDirection = [
			normal[0]*nlightdot2 - lightDirection[0],
			normal[1]*nlightdot2 - lightDirection[1],
			normal[2]*nlightdot2 - lightDirection[2]
			];
		
		// limiting the result of dot product to 0 is basically backface supression dot product is -1 for opposite direction, 0 for total difference and, 1 for same direction
		// important to limit it before shininess (pow)...
		
		// calculate specular intensity ( specularLightIntensity (R dot V)^shininess )
		//var intensitySpecular = Math_pow( Math_max(0.0, vec3dot(reflectionDirection, cameraDirection)), shininess );
		var intensitySpecular = reflectionDirection[0]*cameraDirection[0] + reflectionDirection[1]*cameraDirection[1] + reflectionDirection[2]*cameraDirection[2];
		intensitySpecular = Math_pow(intensitySpecular > 0 ? intensitySpecular : 0, shininess );
		
		return [pointLightIntensity * intensityDiffuse, ambientLightIntensity, specularLightIntensity * intensitySpecular];
	}

	/**
	 * Do no shading, just return the color.
	 * In general, calculate the light an the final color.
	 * Function is called from raster during scan-line.
	 * Functions setModle and setPolygon have to be called first.
	 * @parameter x, y, z, position of fragment in world coordinates.
	 * @parameter orginal color of the fragment.
	 * @return color
	 */
	function noShading(x, y, z, color) {
		
		return color;
	}

	// BEGIN exercise Shading

	/**
	 * See function noShading.
	 */
	function flat(x, y, z, color) {
		var resultColor = [color[0], color[1], color[2], color[3]];
		
		// colored lights with speedup
		
		// diffuse + ambient
		vec3scalevec3(resultColor, 
			[	diffuseColor[0] * polygonLightIntensity[0] + ambientColor[0] * polygonLightIntensity[1],
				diffuseColor[1] * polygonLightIntensity[0] + ambientColor[1] * polygonLightIntensity[1],
				diffuseColor[2] * polygonLightIntensity[0] + ambientColor[2] * polygonLightIntensity[1]
			]);
		
		// specular
		vec3add(	resultColor,
			[	specColor[0] * polygonLightIntensity[2],
				specColor[1] * polygonLightIntensity[2],
				specColor[2] * polygonLightIntensity[2]
			]);
		
		return resultColor;
		
		/*
		// for noncolored lights
		vec3scale(resultColor, polygonLightIntensity[0] + polygonLightIntensity[1]); // diffuse and ambient
		
		// calc phong specular
		var _specColor = [specColor[0], specColor[1], specColor[2]];
		vec3scale(_specColor, polygonLightIntensity[2]); // specular
		
		vec3add(resultColor, _specColor);
		
		return resultColor;

		// TODO: Where does the polygon color come in how does the mixing happen?
		
		// for colored lights
		
		// calculate ambient
		var _ambientIntensities = [ambientColor[0], ambientColor[1], ambientColor[2]];
		vec3scale(_ambientIntensities, 1 / 255);
		vec3scale(_ambientIntensities, polygonLightIntensity[1]); // ambient
		
		// calculate diffuse
		var _diffuseIntensities = [diffuseColor[0], diffuseColor[1], diffuseColor[2]];
		vec3scale(_diffuseIntensities, 1 / 255);
		vec3scale(_diffuseIntensities, polygonLightIntensity[0]); // diffuse
		
		var _Intensities = [0, 0, 0];
		vec3add(_Intensities, _ambientIntensities);
		vec3add(_Intensities, _diffuseIntensities);
		
		vec3scalevec3(resultColor, _Intensities); // all
		
		// calc phong specular
		var _specIntensities = [specColor[0], specColor[1], specColor[2]];
		//vec3scale(_specIntensities, 1 / 255);
		vec3scale(_specIntensities, polygonLightIntensity[2]); // specular
		
		vec3add(resultColor, _specIntensities);
		
		return resultColor;
		*/
	}

	/**
	 * 	Calculate one light intensity for the current polygon.
	 */
	function flatInit() {
		// Calculate the center point of the polygon.
		var center = [0,0,0];
		
		for(var i = 0; i < polygon.length; ++i)
		{
			vec3add(center, vertices[polygon[i]]);
		}
		vec3scale(center, 1/polygon.length);

		// Calculate light intensity at polygon center..
		polygonLightIntensity = calcLightIntensity(center, polygonNormal);
	}

	/**
	 * See function noShading.
	 */
	function gouraud(x, y, z, color) {
		
		return color;
	}

	function gouraudInit() {
		// Calculate light intensity at all vertices/corners.
	}

	/**
	 * See function noShading.
	 */
	var samplergetTextureData = sampler.getTextureData;
	function phong(x, y, z, color)
	{
		var point = [x,y,z];
		var uvw = interpolate(point);
		
		//var pointNormal = vec3scale( vec3set( vertexNormals[polygon[0]], []), uvw[0]);
		//vec3add( pointNormal, vec3scale( vec3set( vertexNormals[polygon[1]], []), uvw[1]) );
		//vec3add( pointNormal, vec3scale( vec3set( vertexNormals[polygon[2]], []), uvw[2]) );
		
		var pointNormal =
		[
			vertexNormals[polygon[0]][0] * uvw[0] + vertexNormals[polygon[1]][0] * uvw[1] + vertexNormals[polygon[2]][0] * uvw[2],
			vertexNormals[polygon[0]][1] * uvw[0] + vertexNormals[polygon[1]][1] * uvw[1] + vertexNormals[polygon[2]][1] * uvw[2],
			vertexNormals[polygon[0]][2] * uvw[0] + vertexNormals[polygon[1]][2] * uvw[1] + vertexNormals[polygon[2]][2] * uvw[2]
		];
		
		vec3normalize(pointNormal);
		
		// Calculate light intensity at polygon center..
		polygonLightIntensity = calcLightIntensity(point, pointNormal);

		var resultColor;
		if(textureCoord.length > 0 )
		{
			resultColor = samplergetTextureData(
				textureCoord[polygon[0]][0] * uvw[0] + textureCoord[polygon[1]][0] * uvw[1] + textureCoord[polygon[2]][0] * uvw[2],
				textureCoord[polygon[0]][1] * uvw[0] + textureCoord[polygon[1]][1] * uvw[1] + textureCoord[polygon[2]][1] * uvw[2]
			);
		} else {
			resultColor = [color[0], color[1], color[2], color[3]];
		}
		
		// colored lights with speedup

		// color(diffuse + ambient) +specular
		return [
				resultColor[0] * (diffuseColor[0] * polygonLightIntensity[0] + ambientColor[0] * polygonLightIntensity[1]) + specColor[0] * polygonLightIntensity[2],
				resultColor[1] * (diffuseColor[1] * polygonLightIntensity[0] + ambientColor[1] * polygonLightIntensity[1]) + specColor[1] * polygonLightIntensity[2],
				resultColor[2] * (diffuseColor[2] * polygonLightIntensity[0] + ambientColor[2] * polygonLightIntensity[1]) + specColor[2] * polygonLightIntensity[2],
				resultColor[3]
			];
	}

	//var AreaABC;
	function phongInit() {
		samplergetTextureData = sampler.getTextureData; // refresh sampler
		// Compute twice area of triangle ABC dot(N, cross(B-A, C-A))
		//AreaABC = vec3dot(polygonNormal, vec3cross( vec3subtract(vertices[polygon[1]], vertices[polygon[0]], []) , vec3subtract(vertices[polygon[2]], vertices[polygon[0]], []), []));
	}

	/**
	 * Interpolate on the current polygon for the given position.
	 * @return weight/influence of the vertices/corners.
	 */
	function interpolate(point) {
		// calculate Baricentric coordinates.
/*		
		// dot(N, cross(B-P,C-P))
		var CminusP =  vec3subtract(vertices[polygon[2]], point, []);
		var AreaPBC = vec3dot(polygonNormal, vec3cross( vec3subtract(vertices[polygon[1]], point, []) , CminusP, []));
		
		// dot(N, cross(C-P,A-P))
		var AreaPCA = vec3dot(polygonNormal, vec3cross( CminusP , vec3subtract(vertices[polygon[0]], point, [])));
		
		// uv
		var weights = [ AreaPBC / AreaABC,  AreaPCA / AreaABC, 0 ];
*/
		
		// faster alternative variant (has to be on XY plane)
		var axmcx = vertices[polygon[0]][0] - vertices[polygon[2]][0];//a.x - c.x;
		var cxmbx = vertices[polygon[2]][0] - vertices[polygon[1]][0];//c.x - b.x;
		var bymcy = vertices[polygon[1]][1] - vertices[polygon[2]][1];//b.y - c.y;
		var aymcy = vertices[polygon[0]][1] - vertices[polygon[2]][1];//a.y - c.y;

		var den = 1 / (bymcy * axmcx + cxmbx * aymcy);
		
		if(isFinite(den) && den != 0)
		{
			// uv
			var cymay = vertices[polygon[2]][1] - vertices[polygon[0]][1];//c.y - a.y;
			var vxmcx = point[0] - vertices[polygon[2]][0];//vec.x - c.x;
			var vymcy = point[1] - vertices[polygon[2]][1];//vec.y - c.y;
			
			var weights =
			[
				(bymcy * vxmcx + cxmbx * vymcy) * den, 
				(cymay * vxmcx + axmcx * vymcy) * den, 
				0
			];

			// w
			weights[2] = 1.0 - weights[0] - weights[1];
			
			return weights;
		}
		
		return [0.33,0.33,0.33];
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
