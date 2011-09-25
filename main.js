$(function() {
	var canvas = $("#c");
	var canvasHeight;
	var canvasWidth;
	var ctx;
	var dt = 0.1;
	
	var pointCollection;


    function getPointsFromString(text, callback) {
        var points = [];

        ctx.color = '#ffff77';
        ctx.font = 'bold 120px sans-serif';
        var imgwidth = ctx.measureText(text).width;
        ctx.fillText(text, 0, 130, canvasWidth);
        imgwidth = imgwidth > canvasWidth ? canvasWidth : imgwidth;
        
        var imagedata = ctx.getImageData(0, 0, imgwidth, canvasHeight);
      var density = densityOverride ? densityOverride : 15;
        for (var x=0; x < imagedata.width; x+=density) {
            for (var y=0; y < imagedata.height; y+=density) {
                var index = (y*4)*imagedata.width + x*4;
                
                var r = imagedata.data[index];
                var g = imagedata.data[index+1];
                var b = imagedata.data[index+2];
                var a = imagedata.data[index+3];
                if (r|g|b|a) {
                        var r = 200 - Math.floor((x / canvasWidth) * 255);
                        var g = 200 - Math.floor((y / canvasWidth) * 255) * 2;
                        var b = 200 - Math.floor((x / canvasWidth) * 255);

                        var p = new Point(x + canvasWidth/2 - imgwidth/2,y,
                                          0.0, 
                                          density/2, 
                                          "rgb("+r+","+g+","+b+")");
                        points.push(p);
                }
            }
        }

        callback(points);
    }
  
    function getPointsFromImage(callback) {
        var points = [];
        
        var bufcan = document.getElementById("buffercan");
        var bufctx = bufcan.getContext('2d');

        var img = new Image();

        img.src = image_to_draw;
      
        img.onload = function() { 

            var ratio = bufcan.width / Math.max(img.width, img.height);
            bufctx.scale(ratio, ratio);
            bufctx.drawImage(img, 0, 0, img.width, img.height); 

            var imagedata = bufctx.getImageData(0, 0, img.width * ratio, img.height * ratio);

          var density = densityOverride ? densityOverride : 10;
            for (var x=0; x < imagedata.width; x+=density) {

                for (var y=0; y < imagedata.height; y+=density) {

                    var index = (y*4)*imagedata.width + x*4;
                    
                    var r = imagedata.data[index];
                    var g = imagedata.data[index+1];
                    var b = imagedata.data[index+2];
                    var a = imagedata.data[index+3];
                    if (r|g|b|a) {
                            var p = new Point(x+canvasWidth/2 - (img.width * ratio) /2, y+canvasHeight/2 - (img.height * ratio) /2, 
                                            0.0,
                                            density,
                                            "rgb("+r+","+g+","+b+")");
		            p.draw = function() {
			        ctx.fillStyle = this.colour;
			        ctx.beginPath();
			        ctx.fillRect(this.curPos.x, this.curPos.y, this.radius, this.radius);
		            };
                            
                          points.push(p);
                          

                    }
                }
            }
            callback(points);
        }
    }

    function postInit(points) {
        pointCollection = new PointCollection();
        pointCollection.points = points;
        initEventListeners();
        timeout();
    }

  function init() {
      updateCanvasDimensions();
      if (text_to_draw) {
          getPointsFromString(text_to_draw, postInit);
      } else if (image_to_draw) {
          getPointsFromImage(postInit);
      }
  };

	
	
	function initEventListeners() {
		$(window).bind('resize', updateCanvasDimensions).bind('mousemove', onMove);
		
		canvas.get(0).ontouchmove = function(e) {
			e.preventDefault();
			onTouchMove(e);
		};
		
		canvas.get(0).ontouchstart = function(e) {
			e.preventDefault();
		};
	};
	
	function updateCanvasDimensions() {
        // canvas.attr({height: $(window).height(), width: $(window).width()});
        canvas.attr({height: 300, width: $(window).width()});
		canvasWidth = canvas.width();
		canvasHeight = canvas.height();

		draw();
	};
	
	function onMove(e) {
		if (pointCollection)
			pointCollection.mousePos.set(e.pageX, e.pageY);
	};
	
	function onTouchMove(e) {
		if (pointCollection)
			pointCollection.mousePos.set(e.targetTouches[0].pageX, e.targetTouches[0].pageY);
	};
	
	function timeout() {
		draw();
		update();
		
		setTimeout(function() { timeout() }, 30);
	};
	
	function draw() {
		var tmpCanvas = canvas.get(0);

		if (tmpCanvas.getContext == null) {
			return; 
		};

		ctx = tmpCanvas.getContext('2d');
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);


		if (pointCollection)
			pointCollection.draw();

	};
	
	function update() {		
		if (pointCollection)
			pointCollection.update();
	};
	
	function Vector(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
 
		this.addX = function(x) {
			this.x += x;
		};
		
		this.addY = function(y) {
			this.y += y;
		};
		
		this.addZ = function(z) {
			this.z += z;
		};
 
		this.set = function(x, y, z) {
			this.x = x; 
			this.y = y;
			this.z = z;
		};
	};
	
	function PointCollection() {
		this.mousePos = new Vector(0, 0);
		this.points = new Array();
		
		this.newPoint = function(x, y, z) {
			var point = new Point(x, y, z);
			this.points.push(point);
			return point;
		};
		
		this.update = function() {		
			var pointsLength = this.points.length;
			
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
				
				if (point == null)
					continue;
				
				var dx = this.mousePos.x - point.curPos.x;
				var dy = this.mousePos.y - point.curPos.y;
				var dd = (dx * dx) + (dy * dy);
				var d = Math.sqrt(dd);
				
				if (d < 150) {
					point.targetPos.x = (this.mousePos.x < point.curPos.x) ? point.curPos.x - dx : point.curPos.x - dx;
					point.targetPos.y = (this.mousePos.y < point.curPos.y) ? point.curPos.y - dy : point.curPos.y - dy;
				} else {
					point.targetPos.x = point.originalPos.x;
					point.targetPos.y = point.originalPos.y;
				};
				
				point.update();
			};
		};
		
		this.draw = function() {
			var pointsLength = this.points.length;
			for (var i = 0; i < pointsLength; i++) {
				var point = this.points[i];
				
				if (point == null)
					continue;

				point.draw();
			};
		};
	};
	
	function Point(x, y, z, size, colour) {
		this.colour = colour;
		this.curPos = new Vector(x, y, z);
		this.friction = 0.8;
		this.originalPos = new Vector(x, y, z);
		this.radius = size;
		this.size = size;
		this.springStrength = 0.1;
		this.targetPos = new Vector(x, y, z);
		this.velocity = new Vector(0.0, 0.0, 0.0);
		
		this.update = function() {
			var dx = this.targetPos.x - this.curPos.x;
			var ax = dx * this.springStrength;
			this.velocity.x += ax;
			this.velocity.x *= this.friction;
			this.curPos.x += this.velocity.x;
			
			var dy = this.targetPos.y - this.curPos.y;
			var ay = dy * this.springStrength;
			this.velocity.y += ay;
			this.velocity.y *= this.friction;
			this.curPos.y += this.velocity.y;
			
			var dox = this.originalPos.x - this.curPos.x;
			var doy = this.originalPos.y - this.curPos.y;
			var dd = (dox * dox) + (doy * doy);
			var d = Math.sqrt(dd);
			
			this.targetPos.z = d/100 + 1;
			var dz = this.targetPos.z - this.curPos.z;
			var az = dz * this.springStrength;
			this.velocity.z += az;
			this.velocity.z *= this.friction;
			this.curPos.z += this.velocity.z;
			
			this.radius = this.size*this.curPos.z;
			if (this.radius < 1) this.radius = 1;
		};
		
		this.draw = function() {
		    ctx.fillStyle = this.colour;
		    ctx.beginPath();
		    ctx.arc(this.curPos.x, this.curPos.y, this.radius, 0, Math.PI*2, true);
		    ctx.fill();
/*
                    ctx.beginPath();
                    ctx.moveTo(this.curPos.x, this.curPos.y);
		    ctx.lineTo(this.originalPos.x, this.originalPos.y);
                    ctx.stroke();
*/
		};
	};
	
	init();
});
