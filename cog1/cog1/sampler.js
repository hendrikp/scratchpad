/**
 * sD Data store and sampling for textures
 * 
 * @namespace cog1.data
 * @module sampler
 */
define(["exports", "sampler", "scene"], function(exports, sampler, scene)
{
	var initDone = false;
	var textureCanvas;
	var textureContext;
	var textureData;
	var textureWidth;
	var textureHeight;
	var textureWidthSWrap;
	var textureHeightTWrap;

	var objImg = new Image();

	function black()
	{
		return [0,0,0,255];
	}

	function wrapNearest(s, t) {
		var x = ((0.5 + (s * textureWidth)) << 0) % textureWidthSWrap;
		var y = ((0.5 + (t * textureHeight)) << 0) % textureHeightTWrap;
		var index = (x + y * textureWidth) << 2;
		
		return [ textureData[index], textureData[index+1], textureData[index+2], 255];
	}
	
	function wrapBilinear(s, t) {
		var sw = (s * textureWidth - 0.5) % textureWidthSWrap;
		var th = (t * textureHeight - 0.5) % textureHeightTWrap;
		if(sw < 0) sw += textureWidth;
		if(th < 0) th += textureHeight;
		
		var isw = sw << 0;
		var ith = th << 0;

		var isw1 = (isw+1) % textureWidthSWrap;
		var ith1 = (ith+1) % textureHeightTWrap;
		var index00 = (isw + ith * textureWidth) << 2;
		var index01 = (isw1 + ith * textureWidth) << 2;
		var index10 = (isw + ith1 * textureWidth) << 2;
		var index11 = (isw1 + ith1 * textureWidth) << 2;
		
		var wx = sw - isw;
		var wy = th - ith;
		var wx1 = 1-wx;
		var wy1 = 1-wy;
		
		return [ 
			(textureData[index00] * wx1 + textureData[index01] * wx) * wy1 + (textureData[index10] * wx1 + textureData[index11] * wx) * wy,
			(textureData[index00+1] * wx1 + textureData[index01+1] * wx) * wy1 + (textureData[index10+1] * wx1 + textureData[index11+1] * wx) * wy,
			(textureData[index00+2] * wx1 + textureData[index01+2] * wx) * wy1 + (textureData[index10+2] * wx1 + textureData[index11+2] * wx) * wy,
			255
		];
	}
	
	objImg.onload = function()
	{
		textureCanvas = document.createElement('canvas');
		textureCanvas.width = objImg.width;
		textureCanvas.height = objImg.height;
		textureWidth = objImg.width;
		textureHeight = objImg.height;
		textureWidthSWrap = textureWidth;
		textureHeightTWrap = textureHeight;
		
		textureContext = textureCanvas.getContext('2d');
		textureContext.drawImage(objImg, 0, 0);
		textureData = textureContext.getImageData(0, 0, textureWidth, textureHeight).data; // doesn't change so cache it
		
		objImg = null;
		//exports.getTextureData = wrapNearest;
		exports.getTextureData = wrapBilinear;
		initDone = true;
		
		scene.setUpToDate(false);
	}

	objImg.src = "cog1/modelData/earth.jpg";

	exports.getTextureData = black;
});