// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/color-finder/index.html
//
// Detection of the most prominent color in an image
// version 1.1.2 (Node.JS edition, modified by Pecacheu)

//NOTE:

//'img' should be an lwip image object.
//You'll need the lwip npm package in order to use this script.
//If lwip errors during instal, you may need to install python 2.7.

//Here's some example node.js usage code:

/*
//Include Files:
var lwip = require('lwip'),
ColorFinder = require('./colorfinder');

//Open Image File:
lwip.open(__dirname+"/myImage.png", function(err, image) {
	if(err) { console.log("File Read Error: "+err); return; }
	//Send image data to ColorFinder:
	var rgb = new ColorFinder().getMostProminentColor(image);
});
*/

module.exports = function(colorFactorCallback) {
  this.callback = colorFactorCallback;
  
  this.getMostProminentColor = function(img) {
    var rgb = null;
    if (!this.callback) this.callback = function() { return 1; };
    var data = this.getImageData(img);
    rgb = this.getMostProminentRGBImpl(data, 6, rgb);
    rgb = this.getMostProminentRGBImpl(data, 4, rgb);
    rgb = this.getMostProminentRGBImpl(data, 2, rgb);
    rgb = this.getMostProminentRGBImpl(data, 0, rgb);
    return rgb;
  };
  
  this.getImageData = function(img, degrade, rgbMatch) {
	var width = img.width(), height = img.height(),
	length = width*height*4; //(4 values for RGBA)
    
	/*function translateBuf(ind) {
		var x = ind/4, y = 0, c = ind % 4;
		while(x >= width) { x -= width; y++; }
		var pix = img.getPixel(Math.floor(x),y);
		switch(c) {
			case 0: return pix.r; case 1: return pix.g;
			case 2: return pix.b; case 3: return pix.a;
		}
	}*/
	function translateBuf(ind) {
		var x = ind/4, y = 0;
		while(x >= width) { x -= width; y++; }
		return img.getPixel(Math.floor(x),y);
	}
	
    var factor = Math.max(1,Math.round(length/5000));
    var result = {}, i = -4, rgb, key, pix;
	
    while ( (i += 4*factor) < length ) {
      pix = translateBuf(i); if(pix.a>32) { //Only count pixel if alpha is above 32.
        key = (pix.r>>degrade) + "," + (pix.g>>degrade) + "," + (pix.b>>degrade);
        if(!result.hasOwnProperty(key)) {
          rgb = {r:pix.r, g:pix.g, b:pix.b,count:1};
          rgb.weight = this.callback(rgb.r, rgb.g, rgb.b);
          if (rgb.weight<=0) rgb.weight = 1e-10;
          result[key]=rgb;
        } else {
          rgb=result[key]; rgb.count++;
        }
      }
    }
    return result;
  };
  
  this.getMostProminentRGBImpl = function(pixels, degrade, rgbMatch) {
    var rgb = {r:0,g:0,b:0,count:0,d:degrade},db={},
    pixel,pixelKey,pixelGroupKey,length,r,g,b,count = 0;
    
    for (pixelKey in pixels) {
      pixel = pixels[pixelKey];
      totalWeight = pixel.weight * pixel.count;
      ++count;
      if (this.doesRgbMatch(rgbMatch, pixel.r, pixel.g, pixel.b)) {
        pixelGroupKey = (pixel.r>>degrade) + "," + (pixel.g>>degrade) + "," + (pixel.b>>degrade);
        if (db.hasOwnProperty(pixelGroupKey))
          db[pixelGroupKey]+=totalWeight;
        else
          db[pixelGroupKey]=totalWeight;
      }
    }
    
    for (i in db) {
      data = i.split(",");
      r = data[0];
      g = data[1];
      b = data[2];
      count = db[i];
      if (count>rgb.count) {
        rgb.count = count;
        data = i.split(",");
        rgb.r = r;
        rgb.g = g;
        rgb.b = b;
      }
    }
    
    return rgb;
  };
  
  this.doesRgbMatch = function(rgb,r,g,b) {
    if (rgb==null) return true;
    r = r >> rgb.d;
    g = g >> rgb.d;
    b = b >> rgb.d;
    return rgb.r == r && rgb.g == g && rgb.b == b;
  }
}