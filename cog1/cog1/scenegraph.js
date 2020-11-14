/**
 * The scene-graph with nodes.
 * @namespace cog1
 * @module scene
 */
define(["exports", "dojo", "model", "node", "shader", "scene"], function(exports, dojo, model, node, shader, scene) {

	// Contains the scene-graph, a tree of
	// nodes (a model with a transform) in the scene.
	var nodes = new Array();

	// There may be ambient light and
	// one white point-light in the scene.
	var ambientLightIntensity = 0.3;
	var pointLightIntensity = 1.0;

	var specularLightIntensity = 0.75;
	var shininess = 8;
	
	// The light position does not get transformed or
	// projected. It has to be set in respect to the
	// screen coordinates.
	var pointLightPosition = [100, 100, 100];
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
	function setLights(ambientLI, pointLI, pointPos, specLI, shine) {
		ambientLightIntensity = ambientLI;
		pointLightIntensity = pointLI;
		pointLightPosition = pointPos;
		specularLightIntensity = specLI;
		shininess = shine;
		
		// Store values also in the shader for speed-up.
		shader.setLights(ambientLI, (pointLightOn ? pointLI : 0), pointPos, (pointLightOn ? specLI : 0), shine);
	}

	function togglePointLight() {
		pointLightOn = !pointLightOn;
		setLights(ambientLightIntensity, pointLightIntensity, pointLightPosition, specularLightIntensity, shininess);
		scene.setUpToDate(false);
	}

	function getPointLightOn()
	{
		return pointLightOn;
	}
	
	function getLightPositionX() {
		return pointLightPosition[0];
	}
	
	function setLightPositionX(val) {
		setLights(ambientLightIntensity, pointLightIntensity, [val, pointLightPosition[1], pointLightPosition[2]] , specularLightIntensity, shininess);
		scene.setUpToDate(false);
	}
	
	function getLightPositionY() {
		return pointLightPosition[1];
	}
	
	function setLightPositionY(val) {
		setLights(ambientLightIntensity, pointLightIntensity, [pointLightPosition[0], val, pointLightPosition[2]] , specularLightIntensity, shininess);
		scene.setUpToDate(false);
	}
	
	function getLightPositionZ() {
		return pointLightPosition[2];
	}
	
	function setLightPositionZ(val) {
		setLights(ambientLightIntensity, pointLightIntensity, [pointLightPosition[0], pointLightPosition[1], val] , specularLightIntensity, shininess);
		scene.setUpToDate(false);
	}
	
	function getPointLightIntensity() {
		return pointLightIntensity;
	}
	
	function setPointLightIntensity(val) {
		setLights(ambientLightIntensity, val, pointLightPosition, specularLightIntensity, shininess);
		scene.setUpToDate(false);
	}
	
	function getAmbientLightIntensity() {
		return ambientLightIntensity;
	}
	
	function setAmbientLightIntensity(val) {
		setLights(val, pointLightIntensity, pointLightPosition, specularLightIntensity, shininess);
		scene.setUpToDate(false);
	}
	
	function getSpecularLightIntensity() {
		return specularLightIntensity;
	}
	
	function setSpecularLightIntensity(val) {
		setLights(ambientLightIntensity, pointLightIntensity, pointLightPosition, val, shininess);
		scene.setUpToDate(false);
	}
	
	function getShininess() {
		return shininess;
	}
	
	function setShininess(val) {
		setLights(ambientLightIntensity, pointLightIntensity, pointLightPosition, specularLightIntensity, val);
		scene.setUpToDate(false);
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
	exports.getPointLightOn = getPointLightOn;
	
	exports.getLightPositionX = getLightPositionX;
	exports.setLightPositionX = setLightPositionX;
	exports.getLightPositionY = getLightPositionY;
	exports.setLightPositionY = setLightPositionY;
	exports.getLightPositionZ = getLightPositionZ;
	exports.setLightPositionZ = setLightPositionZ;
	
	exports.getPointLightIntensity = getPointLightIntensity;
	exports.setPointLightIntensity = setPointLightIntensity;
	
	exports.getAmbientLightIntensity = getAmbientLightIntensity;
	exports.setAmbientLightIntensity = setAmbientLightIntensity;
	
	exports.getSpecularLightIntensity = getSpecularLightIntensity;
	exports.setSpecularLightIntensity = setSpecularLightIntensity;
	
	exports.getShininess = getShininess;
	exports.setShininess = setShininess;
	
	exports.getNodes = getNodes;
	exports.getNodeByName = getNodeByName;
	exports.getRootNode = getRootNode;
	exports.toggleTriangulation = toggleTriangulation;
});
