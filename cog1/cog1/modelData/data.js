/**
 * 3D Data Store for a model.
 * 
 * This is an empty data template 
 * that explains the format.
 * See cube.js as an example.
 * 
 * It also defines some default colors.
 * 
 * Data requires a reference to itself to mix its own properties
 * into the model data.
 * 
 *  *  Coordinate System:
 *        y
 *        |
 *        |____
 *       /     x
 *     z/
 * 
 * @namespace cog1.data
 * @module cube
 */
define(["exports", "data", "glMatrix"], function(data, exports) {

	// Array with data for one model.
	//
	// Vertices with x,y,z. Coordinate system as in OpenGL.
	var vertices = [];
	// Color array  with default colors "red", "green".
	// The color array contains objects of the form:
	// {colorname : [r,g,b,a]}, the name can be accessed 
	// via the Object.keys() function.
	// But this is not necessary as the color object get
	// augmented with the fields name and rgba during initialization.
	var colors = [
		{red : [255, 0, 0, 255]},
		{green : [0, 255, 0, 255]},
		{blue : [0, 0, 255, 255]},
		{cyan : [0, 255, 255, 255]},
		{magenta : [255, 0, 255, 255]},
		{yellow : [255, 255,0, 255]},
		{black : [0, 0, 0, 255]},
		{white : [255, 255, 255, 255]},
		{grey : [128, 128, 128, 255]},
		{light_blue : [128, 255, 255, 255]}
	];
		
	// Texture coordinates. (for each vertex)
	var textureCoord = [];
	
	// All of the above array-data can be combined to polygons
	// referencing the indices of the arrays above.
	//
	// 2D-Array that specifies faces/polygons and its vertex reference number,
	// i.e. the index in the vertices array.
	// The last vertex is assumed to form an edge with the first one to close the polygon.
	// The sign of the normal is calculated from the order of the vertices
	// according to the right hand rule.
	var polygonVertices = [];
	// Color for each polygon as index in color array.
	// There can be only one color per polygon (not one for each vertex).
	var polygonColors = [];	
	// One normal for each vertex (with the same index).
	// One vertex may occur in several polygons, but it cannot
	// have different normals for each occurrence.
	// Given or calculated from the mesh or from polygonNormals.
	var vertexNormals = [];
	// One normal for each polygon (with the same index).
	// Given or calculated from the mesh or from vertexNormals.
	var polygonNormals = [];

	/////////////////////////////////////////////////////////////////
	// Variable that do not refer to the model-data.
	/////////////////////////////////////////////////////////////////
	
	// If the some data/model is uses several times in the 
	// scene init should be run only for the fist instance.
	var intiDone = false;
	var epsilon  = 0.001;
	
	/////////////////////////////////////////////////////////////////
	// Functions that work on the data.
	/////////////////////////////////////////////////////////////////
	/**
	 * Calculate normals, if not given.
	 * Init is applied to model data.
	 */
	function init(){		
	
	 	if(this.initDone == true){
	 		return;
	 	}
	 				
		// Mix in mission members from data template the are missing in model data.
		// As this is applied to the model data this is it.
		for(prop in data) {
			if(data.hasOwnProperty(prop)){
				// Only array, for the data.
				if(Array.isArray(data[prop])){
					if( ! this.hasOwnProperty(prop)){
						// Create empty arrays for the missing props
						// or link to the array in data if not empty.
						this[prop] = (data[prop].length > 0) ? data[prop] : [];
						//this.exports[prop] = data[prop];
					} 
				}
			}			 
		}
		
		// merge doubled vertices
		//mergeVertices.apply(this);
		
		if(this.polygonNormals.length == 0) {
			calcuatePolygonNormalsFromMesh.apply(this);
		}
		
		if(this.vertexNormals.length == 0) {
			calcuateVertexNormalsFromPolygonNormals.apply(this);
		}
		
		// Triangulate data and keep results,
		triangulate.apply(this);
	
		augmentColorObjecstWithColornameAndRgba.apply(this);
		
		// If the some data/modle is uses severl times in the 
		// scene init should be run only for the fist instance.
		this.intiDone = true;
	}

	/**
	 * Augment all color objects with color-name, rgba  for speed
	 * and with rgbaShaded, which is modified by the shader.
	 * Called during initialization.
	 */				
	function augmentColorObjecstWithColornameAndRgba(){
		for(var i = 0, len = this.colors.length; i < len; i++) {
			var color = this.colors[i];
			color.colorname = Object.keys(color)[0];
			color.rgba = color[color.colorname];
			color.rgbaShaded = [];
			vec3.set(color.rgba, color.rgbaShaded );
			// set Alpha.
			color.rgbaShaded[3] = color.rgba[3]; 
		}
	}
	
	/**
	 * Compare two vectors element-wise.
	 */
	function vectorsEqual(vec1, vec2) {
		for(var i = 0, len = vec1.length; i < len; i++) {
			if(Math.abs(vec1[i]-vec2[i]) > epsilon){ return false; }
		}
		return true;
	}
	
	/**
	 * Use the cross product of the edge vectors.
	 * The order of the vertices determines the sign of the normal.
	 */
	function calcuatePolygonNormalsFromMesh(){		
		// Loop over polygons.
		for(var p = 0; p < this.polygonVertices.length; p++) {
			var polygon = this.polygonVertices[p];
			this.polygonNormals[p] = [0,0,0];
			var normal = this.polygonNormals[p]
			calculateNormalForPolygon(this.vertices, polygon, normal);
		}
	}
	
	/**
	 * Calculate a separate normal for each vertex, but not for each
	 * corner of each polygon. 
	 * For a vertex normal averages over all polygon normals
	 * the vertex is part of.
	 * The weight of the angle at the vertex is used as weight.
	 * No check if calculation has been already done.
	 */
	function calcuateVertexNormalsFromPolygonNormals()
	{
		// Polygon normals must be calculated first.
		if(this.polygonNormals.length == 0) {
			calcuatePolygonNormalsFromMesh.apply(this);
		}
		
		// BEGIN exercise vertex-normals
		
		// Initialize normal array.
		for(var v = 0; v < this.vertices.length; v++) {
			this.vertexNormals[v] = [0,0,0];
		}
		
		// Loop over polygons.
		for(var p = 0; p < this.polygonVertices.length; p++) {
			var polygon = this.polygonVertices[p];
			
			// Loop over vertices of polygon.
			for(var v = 0; v < polygon.length; v++) {
				// Accumulate/add all polygon normals.
				if(polygon[v] < this.vertexNormals.length)
					vec3.add(this.vertexNormals[polygon[v]], this.polygonNormals[p]);
				else
					console.log('Error: calcuateVertexNormalsFromPolygonNormals invalid index', polygon[v]);
			}
		}
		
		// smooth verices (cleanData)
		var vdone = [];
		for(var v = 0; v < this.vertexNormals.length; v++) {
			
			if(vdone[v] != true)
			{
				var fequals = [];
				var vresult = vec3.set(this.vertexNormals[v], []);
				
				// find equal verts
				for(var vf = v+1; vf < this.vertexNormals.length; vf++)
				{
					if(vectorsEqual(this.vertices[vf], this.vertices[v]))
					{
						vec3.add(vresult, this.vertexNormals[vf]);
						vdone[vf] = true;
						fequals.push(vf);
					}
				}
				
				// set results
				this.vertexNormals[v] = vresult;
				for(var vf = 0; vf < fequals.length; vf++)
				{
					this.vertexNormals[fequals[vf]] = vresult;
				}
			}
		}
		
		// Normalize normals.
		for(var v = 0; v < this.vertexNormals.length; v++) {
			vec3.normalize(this.vertexNormals[v]);
		}

		// END exercise vertex-normals
	}
	
	function isZero(val)
	{
		return epsilon > Math.abs(val);
	}
	
	/**
	 * Assume that all vertices of the polygon are in one plane.
	 * Calculate two (non parallel) vectors inside the plane of the polygon.
	 * Assume that at least two (consecutive) vertices of a polygon
	 * are not on a straight line with the first vertex.
	 * 
	 * @ parameter vertices may be the transformed vertices.
	 * @ returns length of normal, given back via parameter n 
	 * @ returns as array (vec3) or null-vector if normal does not exist.
	 */
	function calculateNormalForPolygon(vertices, polygon, n){
		
		if(n == null || polygon == null){
			console.log("Error: calculateNormalForPolygon Parameter is null.");
			return 0;
		}
		
		if (polygon.length < 3) {
			console.log('Error: calculateNormalForPolygon not enough vertices ', polygon.length);
			return 0;
		}
		
		// START exercise z-Buffer:
		
		// Calculate normal vector from vector product of edges.
		var origin = vec3.create(vertices[polygon[0]]);
		var U = vec3.subtract(vec3.create(vertices[polygon[1]]), origin);
		var V = vec3.subtract(vec3.create(vertices[polygon[2]]), origin);

		// Calculate normal
		vec3.cross(U, V, n);

		// Check that e[u] are not parallel.
		if(isZero(n[0]) && isZero(n[1]) && isZero(n[2]))
		{
			console.error("calcPlaneEquation: zero vector" + n);
			return 0;
		}
		
		vec3.normalize(n);
		
		return vec3.length(n);

		// END exercise z-Buffer
	}
	
	/**
	 * Create triangle fans (123, 134, 145, ...) from polygons.
	 */
	function triangulate(){
		// Create new array for the triangles and colors,  but keep all polygon data.
		this.triangles = [];
		this.orgPolygonVertices = this.polygonVertices;
		this.triangleColors = [];
		this.orgPolygonColors = this.polygonColors;
		this.triangleVertexNormals = [];
		this.orgVertexNormals = this.vertexNormals;
		this.trianglePolygonNormals = [];
		this.orgPolygonNormals = this.polygonNormals;
		
		var nbTris = 0;
		
		// Loop over polygons.
		for(var p = 0; p < this.polygonVertices.length; p++) {
			var polygon = this.polygonVertices[p];
			if(polygon.length < 3) {
				console.error("triangulate: skip polygon: "+p);
				continue;
			}
			// Loop over vertices of polygon.
			var firstVertex = polygon[0];
			for(var v = 1; v < polygon.length-1; v++) {
				this.triangles[nbTris] = [firstVertex, polygon[v], polygon[v+1]];
				this.triangleColors.push(this.polygonColors[p]);
				nbTris++;
			}
		}
		
		// calculate normals
		this.vertexNormals = this.triangleVertexNormals;
		this.polygonNormals = this.trianglePolygonNormals;
		calcuateVertexNormalsFromPolygonNormals.apply(this);
		this.vertexNormals = this.orgVertexNormals;
		this.polygonNormals = this.orgPolygonNormals;
		
		// Set triangles a new polygons.
		//this.polygonVertices = this.triangles;
		//this.polygonColors = this.triangleColors;
	}
	
	/*
	* clean up doubled vertices to smooth normals
	*/
	function mergeVertices() {
		var vdone = [];
		for(var v = 0; v < this.vertices.length; v++) {
			
			if(vdone[v] != true)
			{
				// find equal verts
				for(var vf = v+1; vf < this.vertices.length; vf++)
				{
					if(vectorsEqual(this.vertices[vf], this.vertices[v]))
					{
						vdone[vf] = true;
						this.vertices[vf] = [0,0,0];
						
						// loop over polygons
						for(var p = 0; p < this.polygonVertices.length; p++) {
							// Loop over vertices of polygon.
							for(var pv = 0; pv < this.polygonVertices[p].length; pv++) {
								if(vf == this.polygonVertices[p][pv])
								{
									this.polygonVertices[p][pv] = v;
								}
							}		
						}
					}
				}
			}
		}
	}
	
	function isTriangulated(){
		if(this.polygonVertices === this.triangles){
			return true;
		}
		return false;
	}	
	
	function toggleTriangulation(){
		if(isTriangulated.apply(this)){
			// Set original polygons a new polygons.
			this.polygonVertices = this.orgPolygonVertices;
			this.polygonColors = this.orgPolygonColors;
			this.vertexNormals = this.orgVertexNormals;
			this.polygonNormals = this.orgPolygonNormals;
		} else {
			// Set triangles a new polygons.
			this.polygonVertices = this.triangles;
			this.polygonColors = this.triangleColors;
			this.vertexNormals = this.triangleVertexNormals;
			this.polygonNormals = this.trianglePolygonNormals;
		}
		// Re.calculate normals.
		//this.vertexNormals = [];
		//this.polygonNormals = [];
		//calcuateVertexNormalsFromPolygonNormals.apply(this);
	}
	
	// Public API.
	exports.init = init;	
	exports.calculateNormalForPolygon = calculateNormalForPolygon;
	exports.isTriangulated = isTriangulated;
	exports.toggleTriangulation = toggleTriangulation;
	exports.augmentColorObjecstWithColornameAndRgba = augmentColorObjecstWithColornameAndRgba;
	
	// Public data.
	exports.vertices = vertices;
	exports.colors = colors;
	exports.textureCoord = textureCoord;
	exports.polygonVertices = polygonVertices;
	exports.polygonColors = polygonColors;
	exports.vertexNormals = vertexNormals;
	exports.polygonNormals = polygonNormals;
});