/**
 * Framebuffer is used buffer the rendering output and to draw to the canvas.
 * Z-Buffer is included in this module.
 *
 * @namespace cog1.frambuffer
 * @module frambuffer
 */
define(["exports", "scene"], function(exports, scene) {

	// Drawing context for canvas.
	var ctx;

	// Fragment buffer as ImageData with size of canvas * 4 (rgba).
	// Thus we use a 1D buffer as storage.
	// We assume that the dimension of the canvas pixel match the CSS
	// pixel.
	var buf;
	var data;
	
	// Z-Buffer, with size number of pixels.
	// Stores z-coordinate.
	var zBuf;
	// We remember the size of the buffers for speedup.
	var bufSize;
	var zBufSize;

	// For z buffer. Camera look in -z direction.
	var maxDistance = -10000;
	// Background color rgb
	var bgColor = [255, 255, 255, 255];
	// "white";

	// Rectangle with region of modified pixel.
	// We only repazBuf[i] the dirty rectangle.
	var dirtyRect = {
		x : undefined,
		y : undefined,
		xMax : undefined,
		yMax : undefined,
		width : undefined,
		height : undefined
	};
	
	// For fast reset
	var buffer = new ArrayBuffer(4);
	var buffer8 = new Uint8Array(buffer); // clamp is useless or color is already clamped
	var buffer32 = new Uint32Array(buffer);
	var buffersize = 4;
	var bgcolorold = 4;
	
	var height = 0;
	var width = 0;
	
	/*
	 * @parameter _bgColor is an rgb array.
	 */
	function init(_ctx, _bgColor) {
		ctx = _ctx;
		if(_bgColor != undefined) {
			// Create a new local array, not a slow remote reference,
			// and not as a string but as a number ("255" != 255).
			for(var i = 0; i < _bgColor.length; i++) {
				bgColor[i] = Number(_bgColor[i]);
			}
			// Set alpha.
			bgColor[3] = 255;
		}
		
		// Initialize the frame-buffer.
		height = ctx.height;
		width = ctx.width;
		exports.width = width;
		exports.height = height;
		// console.log("framebuffer: " + width + " " + height);
		
		buf = ctx.getImageData(0, 0, width, height);
		data = buf.data;
		if((width != buf.width) || (height != buf.height)) {
			console.log("WARNING: Dimension of the canvas pixel match the CSS pixel.");
		}

		// Initialize the zBuffer.
		zBufSize = width * height;
		zBuf = new Array(zBufSize);
		
		// Calculate size for rgba pixel.
		bufSize = zBufSize * 4;
		
		// Init dirty rectangle.
		dirtyRect.x = 0;
		dirtyRect.y = 0;
		dirtyRect.xMax = width;
		dirtyRect.yMax = height;

		reset();
	}

	/**
	 * Perform zBuffer test.
	 * @parameter color is an object-array with rgba values
	 * @return true on pass.
	 */
	function zBufferTest(indexz, z, rgba) {
		// BEGIN exercise z-Buffer

		// The camera is in the origin looking in negative z-direction.
		if(z > zBuf[indexz] && zBuf[indexz] != maxDistance && z != maxDistance)
			return false;
		
		// END exercise z-Buffer

		return true;
	}

	/**
	 * Set a pixel/fragment in the frame-buffer and in z-buffer
	 * @parameter color is an object with colorname : rgba values
	 * @paramter performZBufferTest is set to true per default if not given.
	 */
	/*
	function set(x, y, z, color, performZBufferTest) {
		// Check range.
		if(x < 0 || x >= width || y < 0 || y >= height) {
			// console.log("Error: Framebuffer out of range: " + x + " " + y);
			return;
		}

		// Perform zBuffer-test.
		if(performZBufferTest == undefined || performZBufferTest == true) {
			if(! zBufferTest(x, y, z, color)) {
				return;
			}
		}
		
		// Set default color black.
		if(color == undefined) {
			color = [0, 0, 0];
		}
		
		var rgba = color.rgbaShaded;
		
		// Index in frame-buffer.
		var index = (y * width + x) * 4;
		data[index] = rgba[0];
		data[++index] = rgba[1];
		data[++index] = rgba[2];
		data[++index] = rgba[3];
		// force alpha to 100%.
		// data[index + 3] = 255;
	}*/
	
	/**
	 * Optimized version of set a pixel/fragment in the frame-buffer and in z-buffer
	 * @parameter rgba rgba array
	 */
	function setFast(x, y, z, rgba) {
		var indexz = (y * width + x);
		var index = indexz << 2; //* 4;

		// Perform zBuffer-test.
		if(!zBufferTest(indexz, z, rgba)) {
			return;
		}

		// Set in Z-Buffer
		zBuf[indexz] = z;
		
		// Set in Framebuffer
		data[index] = rgba[0];
		data[++index] = rgba[1];
		data[++index] = rgba[2];
		data[++index] = rgba[3];
	}
	
	/**
	 * Decouples Dirty Rect calculation from set methods
	 */
	function setDirtyPoint(x, y)
	{
		// Adjust the dirty rectangle.
		if(x < dirtyRect.x) {
			dirtyRect.x = x;
		} else if(x > dirtyRect.xMax) {
			dirtyRect.xMax = x;
		}
		if(y < dirtyRect.y) {
			dirtyRect.y = y;
		} else if(y > dirtyRect.yMax) {
			dirtyRect.yMax = y;
		}
	}

	/*
	 * Call before every frame or to clear.
	 */
	function reset()
	{
		if(dirtyRect.xMax <= 0 && dirtyRect.yMax <= 0)
			return;
		
		var dirtyStartIndex = dirtyRect.y * width + dirtyRect.x;
		var dirtyEndIndex = dirtyRect.yMax * width + dirtyRect.xMax;

		// Reset frame-buffer to bgColor.
		var r = bgColor[0];
		var g = bgColor[1];
		var b = bgColor[2];
		var a = bgColor[3];
		var bgcolor = (a << 24) | (b << 16) | (g << 8) | r;

		// maybe for later: zBuf = zBuf_maxDistance.slice(0);
		//zBuf.set(this.buffer8);
		
		//  http://jsperf.com/canvas-pixel-manipulation/37 2 but avoid memory reallocation
		var framesize = width*height*4;
		if(this.buffersize != framesize)
		{	
			this.zBufSize = framesize / 4;
			this.zBuf = new Array(this.zBufSize);
			
			// RGBA
			this.bufSize = framesize;
			this.buffersize = framesize;
			this.buffer = new ArrayBuffer(this.buffersize);
			this.buffer8 = new Uint8Array(this.buffer); // clamp is useless or color is already clamped
			this.buffer32 = new Uint32Array(this.buffer);
			this.bgcolorold = 0;
		}
		
		// Reset zBuffer. 
		for(var i = dirtyStartIndex; i < dirtyEndIndex; ++i) {
			zBuf[i] = maxDistance;
		}
		
		if(bgcolor != this.bgcolorold)
		{
			this.bgcolorold = bgcolor;
			var nEndIndex = this.buffersize/4;
			for(var i = 0; i < nEndIndex; ++i)
			{
				this.buffer32[i] = bgcolor;
			}
		}
		
		data.set(this.buffer8);

		// Reset dirty rectangle.
		dirtyRect.x = width;
		dirtyRect.y = height;
		dirtyRect.xMax = 0;
		dirtyRect.yMax = 0;
	}

	function display() {
		dirtyRect.width = dirtyRect.xMax - dirtyRect.x;
		dirtyRect.height = dirtyRect.yMax - dirtyRect.y;

		// Check if nothing changed.
		if(dirtyRect.width < 0 || dirtyRect.height < 0) {
			return;
		} else {
			// Add one pixel to include the max.
			dirtyRect.width++;
			dirtyRect.height++;
		}
		
		if(scene.getDebug_zBuffer()) {
			MultiplyFramebufferWithZBuffer();
		}

		ctx.putImageData(buf, 0, 0, dirtyRect.x, dirtyRect.y, dirtyRect.width, dirtyRect.height);
	}

	/*
	 * Scale the z-buffer for visualization to interval [0,1].
	 */
	function scaleZBuffer() {
		// Initialize z-min and z-max (maxDistance is large negative)
		// reversed, complementary and scale linearly.
		var min = -maxDistance;
		var max = maxDistance;
		
		var dirtyStartIndex = dirtyRect.y * width + dirtyRect.x;
		var dirtyEndIndex = dirtyRect.yMax * width + dirtyRect.xMax;
		
		// Get min and max.
		for(var i = dirtyStartIndex; i < dirtyEndIndex; ++i) {
			if(zBuf[i] == maxDistance)
				continue;
			
			if(zBuf[i] < maxDistance || zBuf[i] > -maxDistance)
				continue;
			
			if(zBuf[i] > max) {
				max = zBuf[i];
			}
			
			if(zBuf[i] < min) {
				min = zBuf[i];
			}
		}
		
		var range = Math.abs(max - min);
		if(range == 0)
			range = 1;
		
		//console.log("z-Buffer Scaler: min="+min+" max="+max+" range="+range);
		
		// Scale between min and max.
		for(var i = dirtyStartIndex; i < dirtyEndIndex; ++i) {
			if(zBuf[i] == maxDistance)
			{
				zBuf[i] = 1;
				continue;
			}
			
			// Set offset to zero (also wen min is negative) then scale.
			zBuf[i] = (zBuf[i] - min) / range;
		}
	}

	/*
	 * Multiply the z-buffer for visualization to interval [0,1].
	 */
	function MultiplyFramebufferWithZBuffer()
	{
		scaleZBuffer();

		var dirtyStartIndex = dirtyRect.y * width + dirtyRect.x;
		var dirtyEndIndex = dirtyRect.yMax * width + dirtyRect.xMax;
		
		var z;
		var j = dirtyStartIndex*4;
		for(var i = dirtyStartIndex; i < dirtyEndIndex; ++i)
		//for(var i = 0; i < zBufSize; ++i)
		{
			z = zBuf[i];
			
			// Set the bgColor if z not maxDistance, which is not scaled.
			if(z != maxDistance) {
				z = 1 - z;
				data[j] = 255*z;
				data[++j] = 255*z;
				data[++j] = 255*z;
				data[++j] = 255;
				++j;
			} else {
				data[j] = bgColor[0];
				data[++j] = bgColor[1];
				data[++j] = bgColor[2];
				data[++j] = bgColor[3];
				++j;
			}
		}
	}

	// Public API.
	exports.init = init;
	//exports.set = set;
	exports.maxDistance =  maxDistance;
	exports.setFast = setFast;
	exports.setDirtyPoint = setDirtyPoint;
	exports.zBufferTest = zBufferTest;
	exports.reset = reset;
	exports.display = display;
	exports.width = width;
	exports.height = height;
});
