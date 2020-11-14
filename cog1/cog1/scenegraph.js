/**
 * The scene-graph with nodes.
 * @namespace cog1
 * @module scene
 */
define(["exports", "dojo", "model", "node", "shader"], function(exports, dojo, model, node, shader) {

	// Contains the scene-graph, a tree of
	// nodes (a model with a transform) in the scene.
	var nodes = new Array();

	// There may be ambient light and
	// one white point-light in the scene.
	var ambientLigthIntensity = 0.2;
	var pointLigthIntensity = 1.0;
	// The light position does not get transformed or
	// projected. It has to be set in respect to the
	// screen coordinates.
	var pointLigthPosition = [100, 100, 100];
	var pointLightOn = true;	

	/*
	 * 	Create scene-graph (tree).
	 */
	function init(triangulateDataOnInit) {
		//console.log("scenegraph.init()");
		model.init(triangulateDataOnInit);
	}

	/**
	 * Create a node with model and given model data.
	 * @parameter modelData
	 * @parameter parent node is optional
	 * @returns node
	 */
	function createNodeWithModel(name, modeldata, parent) {
		// to observer pattern.
		var newModle = model.create(modeldata);
		//console.log(newModle);
		var newNode = node.create(name, newModle, parent);
		//console.log(newNode);
		nodes.push(newNode);
		upToDate = false;
		return newNode;
	}

	/*
	 * @parameter LI are positive floats, pointPos is a vec3.
	 */
	function setLights(ambientLI, pointLI, pointPos) {
		ambientLigthIntensity = ambientLI;
		pointLigthIntensity = pointLI;
		pointLigthPosition = pointPos;
		// Store values also in the shader for speed-up.
		shader.setLights(ambientLI, pointLI, pointPos);
	}

	function togglePointLight() {
		if(pointLightOn) {
			pointLightOn = false;
			pointLightIntensity = 0.0
		} else {
			pointLightOn = true;
			pointLightIntensity = scenegraph.getPointLightIntensity();
		}
	}

	function getLightPosition() {
		return pointLigthPosition;
	}

	function getPointLightIntensity() {
		return pointLigthIntensity;
	}

	function getAmbientLigthIntensity() {
		return ambientLigthIntensity;
	}

	/*
	 * 	Access to the nodes in the scene-graph.
	 */
	function getNodes() {
		return nodes;
	}

	function getNodeByName(name) {
		for(var n in nodes) {
			if(nodes[n].name == name) {
				return nodes[n];
			}
		}
		console.error("Error: node not found in scenegraph: " + name);
		return null;
	}

	/*
	 * @ returns first node in the list, normally the root of a node-tree.
	 */
	function getRootNode() {
		if(nodes[0] != undefined) {
			return nodes[0];
		} else {
			//console.log("No Root node found in scenegraph");
			return null;
		}
	}

	/*
	 * Call toggleTriangulation on all nodes.
	 */
	function toggleTriangulation() {
		for(var n in nodes) {
			nodes[n].toggleTriangulation();
		}
	}

	// Public API.
	exports.init = init;
	exports.createNodeWithModel = createNodeWithModel;
	exports.setLights = setLights;
	exports.togglePointLight = togglePointLight;
	exports.getLightPosition = getLightPosition;
	exports.getPointLightIntensity = getPointLightIntensity;
	exports.getAmbientLigthIntensity = getAmbientLigthIntensity;
	exports.getNodes = getNodes;
	exports.getNodeByName = getNodeByName;
	exports.getRootNode = getRootNode;
	exports.toggleTriangulation = toggleTriangulation;
});
