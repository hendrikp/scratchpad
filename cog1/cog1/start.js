"use strict";
// This script is the entry point of the framework, called from index.
// Project dependent code may go into the index file.
// Load initial set of dependencies and start rendering.
// This is the file to set the initial breakpoint when debugging
// or the "debugger" statement where you need it.
require(["dojo", "dojo/parser", "dojo/domReady!"], function(dojo) {

	// alert("Dojo version " + dojo.version + " is loaded" + '\n\ndojoConfig = '
	// + dojo.toJson(dojo.config, true));

	// Reconfigure the loader at runtime by passing
	// require a configuration object as the first parameter.
	require({
		async : true,
		parseOnLoad : true,
		debug : true,
		cacheBust : new Date(),
		waitSeconds : 5,
		// Base URL replaces the path to dojo as default,
		// When dojo come from the local filesystem,
		// we need the path to dojo to load siblings like dijit.
		// Thus the path must then be reset in packages.
		// baseUrl: "cog1/",
		// Set absolute path to dojo packages if not linked via http.
		// packages:[
		  // {
		    // name:'dojo',
		    // location:'/Users/felixgers/BHT/software/dojo-release-1.7.2/dojo'
		  // },{
		    // name:'dijit',
		    // location:'/Users/felixgers/BHT/software/dojo-release-1.7.2/dijit'
		  // }],
		// If the local path to dojo is kept, we can set an absolute path to
		// the cog1 project instead.
		paths : {
			// Absolute path to cog1 project, local directory without
			// HTTP-server:
			//"cog1" : "file:///C:/Users/hpolczynski/Desktop/Fachinfos/Beuth/Computergrafik%201/Projekt/cog1"
			//"cog1" : "file:///C:/Users/hendrikp/Desktop/Computergrafik%201/Projekt/cog1"
			//"cog1" : "/Users/felixgers/BHT/src/cog1/cog1_JS_template/cog1"			
			//"cog1" : "/Users/felixgers/BHT/src/cog1/cog1_JS_sol/cog1"
			// "cog1" : "U:/BHT/src/cog1/cog1_JS_sol"
			// On same [local] HTTP-server as used to load dojo:
			// "cog1" : "/src/cog1/cog1_JS_sol/cog1"
			"cog1" : "/scratchpad/cog1/cog1"
		},
		// Add one entry for each custom module.
		// This is, among others, necessary to apply the path parameter.
		aliases : [
			["app","cog1/app"],
			["layout","cog1/layout"],
			["ui","cog1/ui"],
			["scene","cog1/scene"],
			["scenegraph","cog1/scenegraph"],
			["createScene","cog1/createScene"],
			["model","cog1/model"],
			["node","cog1/node"],
			["raster","cog1/raster"],
			["shader","cog1/shader"],
			["framebuffer","cog1/framebuffer"],
			// data for models
			["data","cog1/modelData/data"],
			// sampler for textures
			["sampler","cog1/sampler"],
			// external (ext)
			["glMatrix","cog1/ext/glMatrix.js"]
		]
	});

	// Load the framework with the re-configured parameters.
	require(["app"], function(app) {
		app.load();
		app.start(false);
	});
});
