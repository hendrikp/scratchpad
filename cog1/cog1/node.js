/**
 * An node in the scene contains a model (3D-data) and a
 * transform, i.e. translate, rotate, scale vectors for a node in the scene.
 * It can have a parent node.
 */
define(["exports", "dojo", "scene"], function(exports, dojo, scene) {

	/**
	 * Create a node and return an interface object to it.
	 * This interface node is used in the scene-graph.
	 * @ returns node.
	 */
	function create(_name, _model, _parent) {
		//console.log("cog1.node.create:" + _model);
		if( ! _name  || ! _model ) {
			console.log("Error node.create no name or model");
			return;
		}
		var newNodeObj = {
			//
			// Fields for each object instance.
			//
			// The UI finds nodes by name.
			name : _name,
			// 3D-Model, if null the node may only serve as an empty group.
			model : _model,
			// Parent node, should not be undefined but null if not set.
			parent : _parent || null,
			// List of children /child nodes.
			children : [],

			// Local transformations (translation, rotation, scale)
			// for the model or group.
			transformation : {
				translate : [0, 0, 0],
				rotate : [0, 0, 0], // around x,y,z axis angle in radians
				scale : [1, 1, 1]
			},
			// Modelview matrix as 4x4 glMatrix to
			// Transform, i.e. translate, rotate, scale the node.
			// Local Modelview not including the transformations of the parents.
			localModelview : mat4.create(),
			// World coordinates, including transformation of parents.
			worldModelview : mat4.create(),
			// Track changes via transformations and update only when necessary.
			localModelviewUpToDate : false,
			worldModelviewUpToDate : false,
			// Separate rotation-matrix for normals.
			localRotation : mat4.create(),
			worldRotation : mat4.create(),
			//
			// Public functions.
			//
			addChild : addChild,
			applyMatrixToVertices : applyMatrixToVertices,
			applyMatrixToTransformedVertices : applyMatrixToTransformedVertices,
			applyMatrixToNormals : applyMatrixToNormals,
			getLocalModelview : getLocalModelview,
			getWorldModelview : getWorldModelview,
			getModel : getModel,
			getModelData : getModelData,
			isReady : isReady,
			rotate : rotate,
			scale : scale,
			setWorldModelviewNotUpToDate : setWorldModelviewNotUpToDate,
			tellChildren : tellChildren,
			toggleTriangulation : toggleTriangulation,
			transform : transform,
			translate : translate,
			updateModelview : updateModelview,
			updateRotation : updateRotation,
		};
		// Register as child;
		if(_parent) {
			_parent.addChild(newNodeObj);
		}
		// Return access object to the node.
		return newNodeObj;
	}

	function getLocalModelview() {
		this.updateModelview();
		return this.localModelview;
	}

	function getWorldModelview() {
		this.updateModelview();
		return this.worldModelview;
	}

	function getModel() {
		return this.model;
	}

	function getModelData() {
		if(this.model === null) {
			return null;
		}
		return this.model.getData();
	}

	function setWorldModelviewNotUpToDate() {
		this.worldModelviewUpToDate = false;
	}

	function addChild(node) {
		this.children.push(node);
	}

	/**
	 * Tell node an children to call a given update function.
	 *  @parameter fktName is a name of a function in this given as string.
	 */
	function tellChildren(fktName) {
		// First tell myself.
		this[fktName]();
		for(var i = 0; i < this.children.length; i++) {
			this.children[i][fktName]();
		};
	}

	/**
	 * Checks if model data has finished loading.
	 * @returns true if model is ready for rendering
	 */
	function isReady() {
		var ready = false;
		if(this.model !== null) {
			ready = this.model.isReady();
		} else {
			// The model may not have finished loading.
			//console.log("this.node.isReady: this.model==null");
		}
		return ready;
	}

	/**
	 * First update the local model-view matrix
	 * then traverse up the graph and incorporate
	 * the transformations of the parents recursively.
	 * This is due to optimization as calculations
	 * are performed more than once in each frame.
	 *
	 * Update the rotation matrices for the rotation as well.
	 *
	 * @ returns worldModelview Matrix
	 */
	function updateModelview() {
		// update LocalModelview() {
		if(!this.localModelviewUpToDate) {
			// Calculate local modelview.
			mat4.identity(this.localModelview);
			// Translate last, thus include it first.
			mat4.translate(this.localModelview, this.transformation.translate);
			// Calculate and store the rotation separately for the normals.
			mat4.identity(this.localRotation);
			mat4.rotateX(this.localRotation, this.transformation.rotate[0]);
			mat4.rotateY(this.localRotation, this.transformation.rotate[1]);
			mat4.rotateZ(this.localRotation, this.transformation.rotate[2]);
			// Include rotation.
			mat4.multiply(this.localModelview, this.localRotation, this.localModelview);
			// Include scaling.
			mat4.scale(this.localModelview, this.transformation.scale);
			// Locally we are up to date, but we have to adjust world MV.
			this.localModelviewUpToDate = true;
			this.worldModelviewUpToDate = false;
		}
		// Update WorldModelview and worldRotation.
		if(!this.worldModelviewUpToDate) {
			mat4.identity(this.worldModelview);
			mat4.identity(this.worldRotation);
			// Include transformation of parent node.
			if(this.parent !== null) {
				var PWMV = parent.updateModelview();
				var PWR = parent.updateRotation();
				mat4.multiply(this.worldModelview, PWMV, this.worldModelview);
				mat4.multiply(this.worldRotation, PWR, this.worldRotation);
			}
			// Combine world of parents with local to this world.
			mat4.multiply(this.worldModelview, this.localModelview, this.worldModelview);
			mat4.multiply(this.worldRotation, this.localRotation, this.worldRotation);
			this.worldModelviewUpToDate = true;
		}
		return this.worldModelview;
	}

	/*
	 * @return world rotation matrix.
	 */
	function updateRotation() {
		this.updateModelview();
		return this.worldRotation;
	}

	/**
	 * @parameter delta to add to the current translation.
	 */
	function translate(vec) {
		this.transform(this.transformation.translate, vec);
	}

	/**
	 * @parameter delta to add to the current rotation.
	 */
	function rotate(vec) {
		this.transform(this.transformation.rotate, vec);
	}

	/**
	 * @parameter delta to add to the current scale.
	 */
	function scale(vec) {
		this.transform(this.transformation.scale, vec);
	}

	/**
	 * @parameter vec delta to add to the current transformation, given as trans.
	 */
	function transform(trans, vec) {
		//console.log("transform name: " + name);
		this.localModelviewUpToDate = false;
		this.worldModelviewUpToDate = false;
		vec3.add(trans, vec, null);
		// Tell children the world of their parents has changed.
		this.tellChildren("setWorldModelviewNotUpToDate");
		scene.setUpToDate(false);
		//this.updateModelview() is called from render function.
	}

	/**
	 * Apply a matrix to vertices if node contains a model.
	 * @parameter mat mat4 matrix
	 */
	function applyMatrixToVertices(matrix) {
		// Transform the model.
		if(this.model !== null) {
			this.model.applyMatrixToVertices(matrix);
		}
	}

	/**
	 * Apply a matrix to transformed vertices if node contains a model.
	 * @parameter mat mat4 matrix
	 */
	function applyMatrixToTransformedVertices(matrix) {
		// Transform the model.
		if(this.model !== null) {
			this.model.applyMatrixToTransformedVertices(matrix);
		}
	}

	/**
	 * Apply a matrix to normals if node contains a model.
	 * @parameter mat mat4 matrix
	 */
	function applyMatrixToNormals(matrix) {
		if(this.model !== null) {
			this.model.applyMatrixToNormals(matrix);
		}
	}

	function toggleTriangulation() {
		if(this.model !== null) {
			this.model.toggleTriangulation();
		}
	}

	// Public API to module.
	// The API of the node object is defines in the create() method.
	exports.create = create;
});
