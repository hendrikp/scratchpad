/**
 * Initialize the canvas.
 * Render the scene.
 * @namespace cog1
 * @module scene
 */
define(["exports", "dojo", "dojo/dom-style", "app", "scenegraph", "createScene", "raster", "shader", "framebuffer", "data", "glMatrix"], function(exports, dojo, domStyle, app, scenegraph, createScene, raster, shader, framebuffer, data) {

	// Name of the shading function used for all nodes
	// (noShading, flat, gouraud, phong, etc)
	var shadingFunctionName = "flat";
	//"noShading";

	// Keep the canvas to access context and parameters.
	var canvas = null;
	// Drawing context for canvas.
	var ctx;

	// Scene is up to date, i.e. nothing changed,
	// all (model-) data has been loaded,
	// no animations are running.
	var upToDate = false;

	// In glMatrix vectors are columns.
	// Thus OpenGL-Matrices have to be transposed.
	//
	// There is one projection matrix for the scene.
	var projection = mat4.identity(mat4.create());
	// Viewport transformation matrix.
	var viewport = mat4.identity(mat4.create());
	// Combined matrix for faster calculation.
	var viewportProjection = mat4.create();
	// Combined matrix for faster calculation.
	var worldModelviewViewportProjection = mat4.create();

	// Font for info on canvas (not in GUI) .
	var fontsizeInPt = 10;
	var font = fontsizeInPt + "pt Helvetica normal";
	var fontLineHeightInPt = Math.ceil(fontsizeInPt * 1.5);
	// Default drawing.
	var defaultColor = "black";
	var defaultTextColor = "grey";

	// If triangulation should be performed on the data on init.
	var triangulateDataOnInit = false;
	var dataIsTriangulated = triangulateDataOnInit;
	// Fill or stroke polygon.
	var fill = false;
	// Display normals for debug.
	var displayNormals = false;
	// Display the z-buffer instead of the frame-buffer.
	var debug_zBuffer = false;

	/**
	 * Initialize the scene, i.e., canvas, graphics-context, projection.
	 * If we wanted multiple scenes we would
	 * have to pass an index and maybe a enclosing div element.
	 */
	function init() {
		//console.log("scene.init()");
		// Check if there is already a canvas in the scene.
		canvas = dojo.query("canvas")[0];
		if(!dojo.isObject(canvas)) {
			console.error("Scene: No canvas found.")
			return;
		}
		// Get the drawing context.
		if(canvas.getContext) {
			ctx = canvas.getContext("2d");
		}
		// Get background-color from canvas to pass to the framebuffer.
		var bgColorStyle = domStyle.get(canvas, "backgroundColor");
		//console.log("background-color: "+bgColorStyle);
		rgb = bgColorStyle.match(/rgb\((\d+),\s(\d+),\s(\d+)\)/);
		var bgColor = rgb.slice(1, 4);
		//console.log(rgb);
		//console.log(bgColor);
		// Also store dimension of the canvas in the context,
		// to pass them all together as parameter.
		ctx.width = canvas.width;
		ctx.height = canvas.height;
		// Default display setting.
		ctx.strokeStyle = defaultColor;
		ctx.fillStyle = defaultColor;
		ctx.font = font;
		ctx.textAlign = "left";

		// Initialize an calculate matrices that do not chance.
		setProjection();
		setViewport();
		calcviewportProjection();

		raster.init(ctx, bgColor);
		scenegraph.init(triangulateDataOnInit);
		// Create the scene.
		createScene.init();
		shader.init();		
	}

	/**
	 * When nodes are modified or some other interaction occured,
	 * the scene needs re-rendering.
	 * Tell the app to restart the render loop, which calls the scene in turn.
	 */
	function setUpToDate(val) {
		upToDate = val;
		// Tell app to run the loop.
		if(!upToDate) {
			app.start(false);
		}
	}

	/**
	 * Set a default for the projection matrix.
	 * As a result all vertices inside the frustum
	 * should be in a -1,+1 cube (clip cooordinates).
	 * This may be overwritten.
	 * If you do not do anything here, result will be
	 * an orthogonal-projection without scaling (z-value will be ignored).
	 * @parameter mat is a mat4 matrix.
	 */
	function setProjection(matrix) {
		if(matrix) {
			mat4.set(matrix, projection);
		} else {
			// Set frustum to +- size of the canvas.
			var r = ctx.width;
			var t = ctx.height;
			// glMatrix has a bug. Set near to far to cancel the wrong transform in glMatrix.
			// mat4.ortho(-r, r, -t, t, 2, 0, projection);
			// Assume an orthogonal projection with a symmetric frustum.
			// Projection should be the unity matrix at this point.
			// See  mat4.multiplyVec4 for indices.
			projection[0] = 1.0 / r;
			projection[5] = 1.0 / t;
			// We do not clip at the near or far plane,
			// thus we leave out scaling the z-coordinate.
			//projection[10] = //-2/f-n;
			//projection[11] = -(f+n)/(f-n);
		}
	}

	/**
	 * Set a default for the viewport matrix.
	 * This may be overwritten.
	 * If you do not do anything here, result will be no transformation.
	 */
	function setViewport() {
		// Center the scene and scale frustum to the canvas.
		// See  mat4.multiplyVec4 for indices.
		var w = ctx.width;
		var h = ctx.height;
		var w2 = w / 2.0;
		var h2 = h / 2.0;
		viewport[0] = w2;
		viewport[5] = h2;
		viewport[12] = w2;
		viewport[13] = h2;
		//console.log("viewport: w" + w + " h" + h + " w2 " + w2 + " h2 " + h2);
		//var matrix = [w2, 0, 0, 0,  0, h2, 0, 0,  0, 0, 1, 0,  w2, h2, 1, 1];
		//mat4.set(matrix, viewport);
	}

	function calcviewportProjection() {
		//mat4.multiply(projection, viewport, viewportProjection);
		mat4.multiply(viewport, projection, viewportProjection);
	}

	/**
	 * Run the complete rendering pipeline for all nodes.
	 */
	function render() {
		if(upToDate) {
			return true;
		}

		framebuffer.reset();
		// Clear the canvas from debug info and from the
		// remains of the last (maybe larger) dirty rectangle.
		ctx.clearRect(0, 0, ctx.width, ctx.height);

		// Assume all is ready for rendering.
		upToDate = true;

		// Set one shading function for all nodes/models.
		shader.setShadingFunction(shadingFunctionName);

		// A shortcut to the nodes.
		var nodes = scenegraph.getNodes();

		// Display matrices that are common for all nodes.
		//displayViewProjectionMatrices();

		//console.log("scene.render() notes:" + nodes.length);
		// Loop over all nodes in the scene.
		// Leave out nodes if they are not ready yet
		// and report that.
		for(var i = 0; i < nodes.length; i++) {
			//console.log(nodes[i]);
			//console.log(nodes[i].getModel());
			// Verify that node is ready.
			if(!nodes[i].isReady()) {
				upToDate = false;
				//console.log("note not ready:" + i);
				continue;
			}
			//console.log("nodes[" + i + "] is ready");
			// Render the node.
			// Perform modelview, projection and viewport transformations in 3D.
			var worldModelview = nodes[i].updateModelview();
			// Combine all three matrices into one.
			mat4.multiply(viewportProjection, worldModelview, worldModelviewViewportProjection);
			// Display for debug.
			//displayModelViewMatrix(i, worldModelview, nodes[i].getLocalModelview());

			// Apply the worldModelview matrix to the node.
			// The result is stored in the transformedVertices of node.model.
			nodes[i].applyMatrixToVertices(worldModelview);
			//nodes[i].applyMatrixToVertices(worldModelviewViewportProjection);

			// Transform, i.e. only rotate, normals for shading.
			var worldRotation = nodes[i].updateRotation();
			nodes[i].applyMatrixToNormals(worldRotation);

			// Display normals for debug.
			if(displayNormals) {
				renderModelNormals(nodes[i].getModel());
			}

			// Apply the viewportProjection matrix to the node.
			// The result is stored in the transformedVertices of node.model.
			nodes[i].applyMatrixToTransformedVertices(viewportProjection);

			// Raster the 2D polygons of the node.
			renderModel(nodes[i].getModel());
		}
		framebuffer.display();
		return upToDate;
	}

	/**
	 * Rasterization, interpolation and shading.
	 * Do the work (among other) of the fragment shader.
	 */
	function renderModel(model) {
		var modelData = model.getData();
		var vertices = model.getTransformedVertices();
		var polygons = modelData.polygonVertices;

		// Register the current model with the shader.
		shader.setModel(model);

		// Loop over polygons in model.
		for(var p = 0; p < polygons.length; p++) {

			var polygon = polygons[p];
			var color = modelData.colors[modelData.polygonColors[p]];

			// Register the current polygon with the shader,
			// combined with back-face culling.
			if(!fill || shader.setPolygon(p)) {
				raster.scanlineDrawPolygon(ctx, vertices, polygon, color, fill);
			}
			
			// Stroke polygon on top to see black edges
			// (and to cover up (a bit) for edge fighting).
			var colorBlack = data.colors[6];
			if(fill && displayNormals) {
				raster.scanlineDrawPolygon(ctx, vertices, polygon, colorBlack, false);
			}
		}
	}

	/**
	 * Create some debug geometry for the normals on the fly
	 * and apply view-port transformation and projection and rasterization to it.
	 */
	function renderModelNormals(model) {
		var modelData = model.getData();
		var vertices = model.getTransformedVertices();
		var polygons = modelData.polygonVertices;
		var vertexNormals = model.getTransformedVertexNormals();
		var polygonNormals = model.getTransformedPolygonNormals();

		var polygonCenter;
		// Loop over polygons in model.
		for(var p = 0; p < polygons.length; p++) {
			var polygon = polygons[p];

			// The average of all vertices as debug geometry for the normals.
			polygonCenter = [0, 0, 0];

			// Loop over vertices/edges in polygon.
			for(var v = 0; v < polygon.length; v++) {

				// Draw normal for vertex.
				var vertexIndex = polygon[v];
				renderNormal(vertices[vertexIndex], vertexNormals[vertexIndex]);

				// Accumulate vertices to calculate center of polygon.
				vec3.add(polygonCenter, vertices[vertexIndex]);
			}

			vec3.scale(polygonCenter, (1 / polygon.length));

			// Draw normal for polygon beginning in the averaged center.
			renderNormal(polygonCenter, polygonNormals[p]);
		}
	}

	/*
	 * Renders a normal as a line taking care of projection
	 * and view-port and scaling it.
	 */
	function renderNormal(_startPoint, normal, scale) {

		if(scale == undefined) {
			scale = 50.0;
		};

		var colorBlack = data.colors[6];

		var startPoint = vec3.create();
		vec3.set(_startPoint, startPoint);
		var endPoint = vec3.create();
		var scaledNormal = vec3.create();
		vec3.scale(normal, scale, scaledNormal);

		vec3.add(startPoint, scaledNormal, endPoint);

		mat4.multiplyVec3(viewportProjection, startPoint);
		mat4.multiplyVec3(viewportProjection, endPoint);

		raster.calcPlaneEquationForStraightLine(startPoint, normal);
		raster.drawLineBresenhamGivenStartEndPoint(ctx, startPoint, endPoint, colorBlack, false);
	}

	/**
	 * Display Projection and View-port matrices.
	 */
	function displayViewProjectionMatrices() {
		displayMatrix("Projection", projection, 10, 100);
		displayMatrix("Viewport", viewport, 10, 200);
		displayMatrix("Projection-Viewport", viewportProjection, 10, 300);
	}

	function displayModelViewMatrix(nodeIndex, worldModelview, localModelview) {
		displayMatrix("Local Modelview Node " + nodeIndex, localModelview, ctx.width - 220, 100);
		displayMatrix("World Modelview Node " + nodeIndex, worldModelview, ctx.width - 220, 200);
		displayMatrix("ModelviewViewProject Node " + nodeIndex, worldModelviewViewportProjection, ctx.width - 220, 300);
	}

	/**
	 * Display a matrix for debug
	 * @parameter name of the matrix for debug, matrix and position on canvas
	 */
	function displayMatrix(name, matrix, xOffset, yOffset) {
		ctx.fillStyle = defaultTextColor;
		var str;
		var x = xOffset, y = yOffset;
		ctx.fillText(name + ":", x, y);
		x += fontLineHeightInPt;
		y += fontLineHeightInPt;
		var index = 0;
		for(var i = 0; i < 4; i++) {
			str = "";
			for(var j = 0; j < 4; j++) {
				str += matrix[index].toFixed(3) + "  ";
				index++;
			}
			ctx.fillText(str, x, y);
			y += fontLineHeightInPt;
		}
		// Reset color.
		ctx.fillStyle = defaultColor;
	}

	//////////////////////////////////////////
	//////// UI Interface functions
	//////////////////////////////////////////

	function toggleFill() {
		fill = !fill;
		setUpToDate(false);
	}

	function toggleDebugZBuffer() {
		debug_zBuffer = !debug_zBuffer;
		setUpToDate(false);
	}

	function toggleDebugNormals() {
		displayNormals = !displayNormals;
		setUpToDate(false);
	}

	/*
	 * Switch between original data and triangulation result.
	 */
	function toggleTriangulation() {
		scenegraph.toggleTriangulation();
		dataIsTriangulated = ! dataIsTriangulated; 
		setUpToDate(false);
	}

	//////////////////////////////////////////
	//////// getter/setter functions for UI
	//////////////////////////////////////////

	function getFill() {
		return fill;
	}

	function getDisplayNormals() {
		return displayNormals;
	}

	function getDataIsTriangulated() {
		return dataIsTriangulated;
	}

	function getDebug_zBuffer() {
		return debug_zBuffer;
	}

	function getShadingFunctionName() {
		return shadingFunctionName;
	}

	function setShadingFunctionName(name) {
		shadingFunctionName = name;
		shader.setShadingFunction(shadingFunctionName);
	}

	// Public API.
	exports.init = init;
	exports.setProjection = setProjection;
	exports.render = render;
	exports.setUpToDate = setUpToDate;
	// GUI switches. 
	exports.toggleFill = toggleFill;
	exports.toggleDebugNormals = toggleDebugNormals;
	exports.toggleTriangulation = toggleTriangulation;
	exports.toggleDebugZBuffer = toggleDebugZBuffer;
	// Public getter/setter for variables.
	exports.getFill = getFill;
	exports.getDisplayNormals = getDisplayNormals;
	exports.getDataIsTriangulated = getDataIsTriangulated;
	exports.getDebug_zBuffer = getDebug_zBuffer;
	exports.getShadingFunctionName = getShadingFunctionName;
	exports.setShadingFunctionName = setShadingFunctionName;

});
