// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/color-finder/index.html
//
// Detection of the most prominent color in an image
// version 1.0.0
function ColorFinder(colorFactorCallback) {
  this.callback = colorFactorCallback;
  this.getMostProminentColor = function(imgEl) {
    var rgb = null;
    if (!this.callback) this.callback = function() { return 1; };
    rgb = this.getMostProminentRGBImpl(imgEl, 6, rgb, this.callback);
    rgb = this.getMostProminentRGBImpl(imgEl, 4, rgb, this.callback);
    rgb = this.getMostProminentRGBImpl(imgEl, 2, rgb, this.callback);
    rgb = this.getMostProminentRGBImpl(imgEl, 0, rgb, this.callback);
    return rgb;
  };

  this.getMostProminentRGBImpl = function(imgEl, degrade, rgbMatch, colorFactorCallback) {
    
    var rgb = {r:0,g:0,b:0,count:0,d:degrade},
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, width, height, key,
        i = -4,
        db={},
        length,r,g,b,
        count = 0;
    
    if (!context) {
      return defaultRGB;
    }
    
    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
    
    context.drawImage(imgEl, 0, 0);
    
    try {
      data = context.getImageData(0, 0, width, height);
    } catch(e) {
      /* security error, img on diff domain */
      return null;
    }
    
    length = data.data.length;
    
    var factor = Math.max(1,Math.round(length/5000));
    
    while ( (i += 4*factor) < length ) {
      ++count;
      if (data.data[i+3]>32 && this.doesRgbMatch(rgbMatch, data.data[i], data.data[i+2], data.data[i+1])) {
        key = (data.data[i]>>degrade) + "," + (data.data[i+2]>>degrade) + "," + (data.data[i+1]>>degrade);
        if (!db.hasOwnProperty(key)) db[key]=1;
        else db[key]++;
      }
    }
    
    for (i in db) {
      data = i.split(",");
      r = data[0];
      g = data[1];
      b = data[2];
      count = db[i] * this.callback(r<<degrade,g<<degrade,b<<degrade);
      
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
