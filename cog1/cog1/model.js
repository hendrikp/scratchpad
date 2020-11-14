/**
 * Administration of transformed data.
 *
 * Model produces/creates a modelObj that holds a pointer to a 3D modelData.
 * _functions are private, i.e., not exposed by modelObj.
 *
 * Original data is taken in each frame from the modelData loaded,
 * thus is is reused for multiple instances of the same model.
 *
 * @namespace cog1
 * @module model
 */
define(["exports", "dojo", "data", "sampler", "glMatrix"], function(exports, dojo, data, sampler) {

	// Set from default in scene, which is passed to data on initialization.
	var triangulateDataOnInit;

	/**
	 * Initialize the module, not uses for a created model.
	 */
	function init(_triangulateDataOnInit) {
		triangulateDataOnInit = _triangulateDataOnInit;	
	}

	/**
	 * Link to model to its modelData/mesh.
	 * @parameter string, name of the modeldata
	 */
	function create(_modelData) {
		//console.log("cog1.model.create: " + _modelData + " " + typeof _modelData);
		// Try to load a modelData-module with the name _modelData.
		if(_modelData === undefined || typeof _modelData !== "string") {
			console.error("Error: Parameter for modelData not a String.");
			//alert("Error: Parameter for modelData not a String.");
			return;
		}
		// Return access object to the model.
		var newModelObj = {
			//
			// Fields.
			//
			// 3D Data Store, containing the mesh, etc.
			// Vertices are blocks of points with X Y Z.
			// Polygons should be closed, i.e. first=last point.
			// Colors are assigned to polygons corresponding to the order in polygonData.
			modelData : null,
			// Working copy of the vertices to apply transform.
			transformedVertices : null,
			// Needed for ready.
			initTransformedVertricesDone : false,
			// Working copy of the normals to apply transform.
			transformedVertexNormals : null,
			transformedPolygonNormals : null,
			// Needed for ready.
			initTransformedNormalsDone : false,
			//
			// Public functions.
			//
			isReady : isReady,
			setData : setData,
			getData : getData,
			getTransformedVertices : getTransformedVertices,
			getTransformedVertexNormals : getTransformedVertexNormals,
			getTransformedPolygonNormals : getTransformedPolygonNormals,
			applyMatrixToVertices : applyMatrixToVertices,
			applyMatrixToTransformedVertices : applyMatrixToTransformedVertices,
			applyMatrixToNormals : applyMatrixToNormals,
			projectTransformedVertrices : projectTransformedVertrices,
			toggleTriangulation : toggleTriangulation
		};

		// Load the modelData of the required 3d model.
		// The require forks, loads then calls given callback.
		require(["cog1/modelData/" + _modelData], function(_modelData) {
			_requiredModelDataCbk.call(newModelObj, _modelData);
		});
		return newModelObj;
	}

	/**
	 * Called from require when model data has been read.
	 * Callback within the closure of this module-(function).
	 */
	function _requiredModelDataCbk(_modelData) {
		//console.log("requiredModelDataCbk....");
		if(!dojo.isObject(_modelData)) {
			console.error("Error: The modelData for the model is not valid: " + _modelData);
			alert("Error: model.create: " + _modelData);
			return;
		}
		this.setData(_modelData);
		//console.dir(this.modelData);
		// Initialize modelData.
		data.init.apply(_modelData);
		_initTransformedVertrices.apply(this);
		_initTransformedNormals.apply(this);
		if(triangulateDataOnInit) {
			this.toggleTriangulation();
		}
	}

	/**
	 * Set the dimensions of the modelData to the 2D-array structure.
	 */
	function _initTransformedVertrices() {
		if(!this.modelData) {
			return;
		}
		this.transformedVertices = [];
		for(var i = 0, len = this.modelData.vertices.length; i < len; i++) {
			this.transformedVertices[i] = [];
		}
		// We may copy the initial, not transformed modelData over.
		// But we may leave this out as well, it is done when the model-view matrix is applied.
		_copyVertexDataToTransformedVertrices.apply(this);
		this.initTransformedVertricesDone = true;
	}

	/**
	 * This is only used for debugging when we want to see the
	 * untransformed vertices.
	 */
	function _copyVertexDataToTransformedVertrices() {
		// Store array length for speedup.
		for(var i = 0, leni = this.modelData.vertices.length; i < leni; i++) {
			// Speedup vars to save indices.
			var vertex = this.modelData.vertices[i];
			var transformedVertex = this.transformedVertices[i];
			for(var j = 0, lenj = vertex.length; j < lenj; j++) {
				transformedVertex[j] = vertex[j];
			}
		}
	}

	function _initTransformedNormals() {
		if(!this.modelData) {
			return;
		}
		this.transformedVertexNormals = [];
		this.transformedPolygonNormals = [];
		for(var i = 0, len = this.modelData.vertexNormals.length; i < len; i++) {
			this.transformedVertexNormals[i] = [];
		}
		for(var i = 0, len = this.modelData.polygonNormals.length; i < len; i++) {
			this.transformedPolygonNormals[i] = [];
		}
		this.initTransformedNormalsDone = true;
	}

	/**
	 * Apply matrix to normals or to the mash given as vertices.
	 * Store the result in transformedVertices
	 * @parameter matrix is a mat4 matrix
	 */
	function _applyMatrix(matrix, vertices, transformedVertices) {
		// Check if the modelData has finished loading.
		if(!this.isReady()) {
			return;
		}
		if(!matrix || !vertices || !transformedVertices) {
			console.error("model.applyMatrix parameter error.");
			return;
		}
		// We may start empty or just overwrite the existing array.
		for(var i = 0, len = vertices.length; i < len; i++) {
			mat4.multiplyVec3(matrix, vertices[i], transformedVertices[i]);
		}
	}

	/**
	 * Apply matrix to the mash given the modelData.
	 * Store the result in transformedVertices
	 * @parameter matrix is a mat4 matrix
	 */
	function applyMatrixToVertices(matrix) {
		// Check if the modelData has finished loading.
		if(!this.isReady()) {
			return;
		}
		var vertices = this.modelData.vertices;
		_applyMatrix.call(this, matrix, vertices, this.transformedVertices);
	}

	/**
	 * Apply matrix to already transformedVertices and
	 * store the result in transformedVertices
	 * @parameter matrix is a mat4 matrix
	 */
	function applyMatrixToTransformedVertices(matrix) {
		// Check if the modelData has finished loading.
		if(!this.isReady()) {
			return;
		}
		_applyMatrix.call(this, matrix, this.transformedVertices, this.transformedVertices);
	}

	/**
	 * Apply matrix to normals given the modelData.
	 * Store the result in transformedNormals
	 * @parameter matrix is a mat4 matrix
	 */
	function applyMatrixToNormals(matrix) {
		// Check if the modelData has finished loading.
		if(!this.isReady()) {
			return;
		}
		var vertexNormals = this.modelData.vertexNormals;
		var polygonNormals = this.modelData.polygonNormals;
		_applyMatrix.call(this, matrix, vertexNormals, this.transformedVertexNormals);
		_applyMatrix.call(this, matrix, polygonNormals, this.transformedPolygonNormals);
	}

	/**
	 * Apply a projection matrix to the transformed vertices.
	 */
	function projectTransformedVertrices(matrix) {
		if(this.transformedVertices === null) {
			return;
		}
		for(var i = 0, len = this.transformedVertices.length; i < len; i++) {
			mat4.multiplyVec3(matrix, this.transformedVertices[i]);
		}
	}

	/**
	 * Call/apply on current data.
	 */
	function toggleTriangulation() {
		if(!this.isReady()) {
			return;
		}
		data.toggleTriangulation.apply(this.modelData);
	}

	// Ready is true when the model data finished loading.
	function isReady() {
		if(this.modelData === null) {
			return false;
			//console.log("model.isReady: this.modelData==null");
		}
		if(!this.initTransformedVertricesDone) {
			return false;
		}
		if(!this.initTransformedNormalsDone) {
			return false;
		}
		return true;
	}

	/**
	 * @returns null until the model data finished loading.
	 *
	 */
	function getData() {
		return this.modelData;
	}

	function setData(_modelData) {
		this.modelData = _modelData;
	}

	function getTransformedVertices() {
		return this.transformedVertices;
	}

	function getTransformedVertexNormals() {
		return this.transformedVertexNormals;
	}

	function getTransformedPolygonNormals() {
		return this.transformedPolygonNormals;
	}

	// Public API to module.
	exports.init = init;
	exports.create = create;
});
