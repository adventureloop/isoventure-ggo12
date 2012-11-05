var tiles = [];
tiles[0] = undefined;
tiles[1] = new Image();
tiles[1].src = "images/FloorTile.png";
tiles[1].enterable = true;
tiles[1].blocksView = false;
tiles[2] = new Image();
tiles[2].src = "images/WallCube.png";
tiles[2].enterable = false;
tiles[2].blocksView = true;
tiles[3] = new Image();
tiles[3].src = "images/DesertTile.png";
tiles[3].enterable = true;
tiles[3].blocksView = false;
tiles[4] = new Image();
tiles[4].src = "images/DownStairTile.png";
tiles[4].enterable = true;
tiles[4].blocksView = false;
tiles.width = 108;
tiles.height = 54;

/*

var tileMap = [[2,2,2,2,0,0,2,2,2],[1,1,1,1,0,0,1,1,1],[1,1,1,1,1,1,1,1,1],					[1,1,1,1,1,1,1,1,1],[1,1,1,1,0,0,1,1,1],[1,1,1,1,0,0,1,1,1]];
*/

var tileMap = [[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],				[3,3,3,3,3,3,3,4,3],[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],
[3,3,3,3,3,3,3,3,3]];


tileMap.width = tileMap.length;
tileMap.height = tileMap[0].length;

var player;
var game;
var ctx;
var debugCtx;

var FRAMES_PER_SECOND = 60;
var FPS = 1000 / FRAMES_PER_SECOND;

function init()
{
	var debugCanvas = document.getElementById('debug');
	debugCtx = debugCanvas.getContext('2d');
	
	var canvas = document.getElementById('game');
	ctx = canvas.getContext('2d');
	
	console.log("Contex is " + ctx);
	
	game = new Game(canvas.width,canvas.height,
					debugCanvas.width,debugCanvas.height);
	
	document.getElementById('game').onmousedown = mouse;	
	document.onkeydown = keyboard;	
	document.oncontextmenu = contextMenu;
	document.getElementById('debug').onmousedown = mouse;	
	
	setInterval(function(){game.run();},FPS); //Wrapped in an anon func, to stop the scope on run changing
	//setInterval(game.run,1000);
	//game.run();
}

function mouse(e)
{
    var canvasElement = e.target;
	if(event.target) {
		var x;
		var y;
		if (e.pageX || e.pageY) { 
			x = e.pageX;
			y = e.pageY;
		} else { 
			x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
  			y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
  		} 
		x -= canvasElement.offsetLeft;
		y -= canvasElement.offsetTop;
	
	
		if(e.target.id == 'game')
			game.clicked(e.which,x,y);
			
		if(e.target.id == 'debug')
			game.debug.clicked(e.which,x,y);
	}
}

function contextMenu()
{
	//Prevent the context menu on a right click
    event.preventDefault();
    event.stopPropagation();
    return false;
}

function keyboard()
{
	var moveSpeed = 5;
	switch(window.event.which) {
		case 37:
			player.move(-moveSpeed,0);
			break;
		case 38:
			player.move(0,moveSpeed);
			break;
		case 39:
			player.move(moveSpeed,0);
			break;
		case 40:
			player.move(0,-moveSpeed);
			break;
		case 69:
			player.setDest({tileX:6,tileY:0,tileXPos:0,tileYPos:0});
			break;
		case 80:
			console.log("Player position tile:(" + player.tileX + "," + player.tileY + ")"); 
			break;
		default:
			console.log("That was not an arrow key " + window.event.which);
			break;
	}
}

function degreesToRads(angle)
{
	var fdeg = Math.PI * 2 / 360
	return fdeg * angle;	
}

function TileMap(tiles,tileMap) 
{
	this.tiles = tiles;
	this.tileMap = tileMap;
	this.debug = false;
	
	this.drawTileMap = function(entities)
	{	
		var width = tiles.width;
		var height = tiles.height;
		for (var i = 0; i < this.tileMap.width; i++) {
		    for (var j = this.tileMap.height-1;j >= 0; j--) {
			
				var xpos = (j * width / 2) + (i * width / 2);
				var ypos = (i * height / 2) - (j * height / 2);
				
				var tileIndex = this.tileMap[i][j];
				var tile = this.tiles[tileIndex];
				
				if(tileIndex == 0)
					continue;	
					
				ctx.save();					
				ctx.translate(xpos,ypos);
				
				if(tiles[tileIndex].blocksView && 
							(i > player.tileX && j < player.tileY)) {
					ctx.globalAlpha = 0.4;
					ctx.drawImage(tile,0,0);
				}
					
				ctx.drawImage(tile,0,0);

				ctx.restore();
								
				for(var k = 0;k < entities.length;k++) {
					var e = entities[k];
					if(e.tileX == i && e.tileY == j)
						e.draw();
				}					
			}
		}
		if(this.debug)
			this.drawDebug();
	};
	
	this.getWidth = function() { return this.tiles.width/2};
	
	this.validTilePos = function(tileX,tileY) 
	{
		if(tileX < 0 || tileX >= this.tileMap[0].length)
			return false;	
		if(tileY < 0 || tileY >= this.tileMap[0].length)
			return false;
			
		tile = tiles[this.tileMap[tileX][tileY]];
		if(tile == undefined || !tile.enterable)
			return false;
//		console.log("You are allowed into this tile");
		return true;
	};
	
	this.drawDebug = function()
	{
		var width = tiles.width;
		var height = tiles.height;

		for (var i = 0; i < this.tileMap.width; i++) {
		    for (var j = this.tileMap.height-1;j >= 0; j--) {
				ctx.save();
			
				var xpos = (j * width / 2) + (i * width / 2);
				var ypos = (i * height / 2) - (j * height / 2);
				ctx.translate(xpos,ypos);			
				ctx.strokeText(i + ":" + j,50,80);	
				ctx.restore();
			}
		}
	}
	
	this.tileIndex = function(x,y) 
	{
		return this.tileMap[x][y];
	}
	
	this.changeTile = function(x,y)
	{
		this.tileMap[x][y]++;
		if(this.tileMap[x][y] > tiles.length-1)
			this.tileMap[x][y] = 0;
	}
}

function Animation(animationInterval,sprite,frames)
{
	this.animationInterval = animationInterval;
	this.sprite = sprite;
	this.frames = frames;
	this.lastFrameTime = 0;
	this.currentFrame = 0;
	
	this.updateWithDelta = function(delta)
	{

		this.lastFrameTime += delta;
		if(this.lastFrameTime > this.animationInterval) {
			this.next();
			this.lastFrameTime = 0;
		}
	};
	
	this.next = function()
	{
		if(++this.currentFrame > this.frames.length-1)
			this.currentFrame = 0;
	};
	
	this.previous = function()
	{
		if(--this.currentFrame < 0)
			this.currentFrame = this.frames.length-1;
	};
	
	this.draw = function()
	{
		var frame = this.frames[this.currentFrame];
		//console.log("Current frame: " + frame);

		ctx.drawImage(this.sprite,frame.x,frame.y,
										frame.width,frame.height,-25,20,
										frame.width,frame.height);

	//	ctx.drawImage(this.sprite,0,0,64,64,0,0,64,64);
	};
}

function Entity(tileMap,tileX,tileY)
{
	this.tileMap = tileMap;

	this.tileX = tileX;
	this.tileY = tileY;
	this.tileXPos = 0;
	this.tileYPos = 0;
	
	this.oldTileX = 0;
	this.oldTileY = 0;
	this.oldTileXPos = 0;
	this.oldTileYPos = 0;
	
	this.tileWidth = 109;
	this.tileHeight = 54;
	
	this.width = 2;
	this.height = 2;
	
	this.animations = [];
	this.currentAnimation;
	
	this.speed = 50;
	this.life = 1;
	
	this.player = false;
	
	this.components = [];
	this.dest = undefined;
	
	this.collidesWithEntity = function(entity)
	{		
		var mypos = this.worldCoords();
		var x = mypos.x;
		var y = mypos.y;		
		
		var enpos = entity.worldCoords();
		var enX = enpos.x;
		var enY = enpos.y;
		
		var dist = Math.sqrt(Math.pow(enX - x,2) + Math.pow(enY - y,2));
		if(dist < 40)
			return true;
	};
	
	this.updateWithDelta = function(delta)
	{
		if(this.currentAnimation != undefined)
				this.currentAnimation.updateWithDelta(delta);
		
		if(this.player && this.dest !== undefined) {
			//Calculate the vector between here and there.
			var playerX = (this.tileY * this.tileWidth / 2) + 
									(this.tileX * this.tileWidth / 2);
			var playerY = (this.tileX * this.tileHeight / 2) - 
									(this.tileY * this.tileHeight / 2);		

			playerX += this.tileXPos + this.tileYPos;		
			playerY += (this.tileXPos - this.tileYPos) / 2 + 0.0;

			//calculate the tile and sub coord we are trying to get to.
			var destX = (this.dest.tileY * this.tileWidth / 2) + 
									(this.dest.tileX * this.tileWidth / 2);
			var destY = (this.dest.tileX * this.tileHeight / 2) - 
									(this.dest.tileY * this.tileHeight / 2);			

			destX += this.dest.tileXPos + this.dest.tileYPos;
			destY += (this.dest.tileXPos - this.dest.tileYPos) / 2 + 0.0;
			
			var fx =  playerX - destX;
			var fy =  playerY - destY;
			
			var rotation = Math.cos(fx/fy);
			
			var xmove = (this.speed * delta/1000) * Math.cos(degreesToRads(rotation));
			var ymove = (this.speed * delta/1000) * Math.sin(degreesToRads(rotation));			
			
/*
			//Calculate the vector to move along
			var fX = destX-playerX;
			var fY = destY-playerY;
			var dist = Math.sqrt(fX*fX + fY*fY);
			var step = (this.speed*(delta/1000))/dist;	//Scale the speed for time, pixels per second.
			
			var xmove = fX*step;
			var ymove = fY*step;
*/
			
			//console.log("Moving towards a position " + xmove + "," + ymove);
			this.move(xmove,ymove);
			I dont seem to be able to do the basic maths without help. I really need to work on my geometry.
			//When we reach the destination tile, we have arrived so we can clear dest.
			if(this.dest.tileX === this.tileX && this.dest.tileY === this.tileY)
				this.dest = undefined;				
		}
	};
	
	this.draw = function()
	{
/*
		screen_x = sprite_x - sprite_y
		screen_y = (sprite_x + sprite_y) / 2 + sprite_z	
*/
		ctx.save();
		//Translate to the tile	
		var screenX = (this.tileY * this.tileWidth / 2) + 
									(this.tileX * this.tileWidth / 2);
		var screenY = (this.tileX * this.tileHeight / 2) - 
									(this.tileY * this.tileHeight / 2);
		
		ctx.translate(screenX,screenY);		
//console.log("Tile render position (" + screenX + "," + screenY + ")");
		
		screenX = this.tileXPos + this.tileYPos;
		screenY = (this.tileXPos - this.tileYPos) / 2 + 0.0; //The 0.0 is a z coord for depth sorting

		ctx.translate(screenX,screenY);
//console.log("Tile render location (" + screenX + "," + screenY + ")");

		if(this.animations == undefined)
			this.animations = [];
		if(this.currentAnimation != undefined)
			this.currentAnimation.draw();
			
		ctx.restore();
	};
	
	this.addAnimation = function(animation)
	{
		this.animations.push(animation);
		if(this.animations.length == 1)
			this.currentAnimation = this.animations[0];
	};
	
	this.move = function(xoffset,yoffset)
	{
		//console.log("Standing at tile (" + this.tileX + "," + this.tileY +
		//		") tile position (" + this.tileXPos + "," + this.tileYPos + ")");										
		this.oldTileX = this.tileX;
		this.oldTileY = this.tileY;
		this.oldTileXPos = this.tileXPos;
		this.oldTileYPos = this.tileYPos;
		
		this.tileXPos += xoffset;
		this.tileYPos += yoffset;
		
		if(this.tileXPos >= this.tileMap.getWidth()) {
			this.tileXPos = 0;
			this.tileX++;
		}
		if(this.tileXPos < 0) {
			this.tileXPos = this.tileMap.getWidth();
			this.tileX--;
		}
		
		if(this.tileYPos >= this.tileMap.getWidth()) {
			this.tileYPos = 0;
			this.tileY++;
		}
		if(this.tileYPos < 0) {
			this.tileYPos = this.tileMap.getWidth();
			this.tileY--;
		}			
	};
	
	this.unmove = function()
	{
		this.tileX = this.oldTileX;
		this.tileY = this.oldTileY;
		this.tileXPos = this.oldTileXPos;
		this.tileYPos = this.oldTileYPos;
	};
	
	this.hit = function()
	{
		this.life--;
	}
	
	this.worldCoords = function()
	{
		var screenX = (this.tileY * this.tileWidth / 2) + 
									(this.tileX * this.tileWidth / 2);
		var screenY = (this.tileX * this.tileHeight / 2) - 
									(this.tileY * this.tileHeight / 2);			
		
		screenX = screenX + (this.tileXPos + this.tileYPos);
		screenY = screenY + ((this.tileXPos - this.tileYPos) / 2 + 0.0);	
		
		return {x:screenX,y:screenY};
	}
	
	this.addComponent = function(component)
	{
		this.components.push(component);
	};
	
	this.setDest = function(dest)
	{
		this.dest = dest;
	};
}


function Game(width,height,debugWidth,debugHeight) 
{
	this.width = width;
	this.height = height;

	this.lastUpdateTime = 0;
    this.lastFpsTime = 0;
    this.lastLoopTime = 0;
    this.latestFPS = 0;
    this.fps = 0;
   
    this.tileMap = new TileMap(tiles,tileMap);
    this.tileMap.debug = true;
    
    this.debug = new Debug(debugWidth,debugHeight,this.tileMap);
        
    var sprite = new Image();
    sprite.src = "images/BaseSpriteSheet.png";

	var frames = [{width:64,height:64,x:0,y:0},
				//{width:64,height:64,x:64,y:0},
				{width:64,height:64,x:128,y:0},
				//{width:64,height:64,x:64,y:0}
				];

	player = new Entity(this.tileMap,0,0);
	player.addAnimation(new Animation(200,sprite,frames));
	player.life = 100;
	player.player = true;
	
	var entities = [];
	
	frames = [{width:64,height:64,x:0,y:0}];
	var esprite = new Image();
	esprite.src = "images/SpriteShooting.png";
	
	for(var i = 1;i < 4;i++)
		entities.push(new Entity(this.tileMap,i+2,6));
	for(var i = 0;i < entities.length;i++) 
		entities[i].addAnimation(new Animation(0,esprite,frames));
    
	this.run = function()
	{
        // work out how long its been since the last update, this
        // will be used to calculate how far the entities should
        // move this loop
        var delta = this.getTime() - this.lastLoopTime;
        this.lastLoopTime = this.getTime();
        this.lastFpsTime += delta;
        this.fps++;
        
        // update our FPS counter if a second has passed
        if (this.lastFpsTime >= 1000) {
            this.latestFPS = this.fps;
            this.lastFpsTime = 0;
            this.fps = 0;            
        }

        this.updateWithDelta(delta);        
        
        //Control the game now   
        for(var i = 0;i < entities.length;i++) {
			var e = entities[i];
			if(!this.tileMap.validTilePos(e.tileX,e.tileY))
	    		e.unmove();
        }
        
        if(!this.tileMap.validTilePos(player.tileX,player.tileY))
		   	player.unmove();
		   	
		//Check for collision with the player and the enemy
		for(var i = 0;i < entities.length;i++) {
			if(player.collidesWithEntity(entities[i])) {
				player.hit();
				entities[i].hit();				
			}				
		}
		
		var tmp = []
		//Remove any enemy that has 0 life left
		for(var i = 0;i < entities.length;i++) {
			if(entities[i].life > 0)
				tmp.push(entities[i]);
		}
		
		entities = tmp;
        
        this.draw();
	};
	
	this.updateWithDelta = function(delta) 
	{
		player.updateWithDelta(delta);
	
		for(var i = 0;i < entities.length;i++) {
			entities[i].updateWithDelta(delta);				
		}
	};
	
	this.draw = function()
	{
		ctx.clearRect(0,0,this.width,this.height); // clear canvas
		
		ctx.strokeText("FPS: " + this.latestFPS,2,10);
		ctx.strokeText("BUILD: Debug Mode",
								this.width-112,this.height-2);
		ctx.strokeText("Health: " + player.life,2,this.height-2);
		ctx.strokeText("Enemies: " + entities.length,100,this.height-2);
		ctx.save();		
		
		//Position the tilemap
		ctx.translate(0,160);			
		
		//entities.push(player);
		this.tileMap.drawTileMap(entities);
		//entities.pop;
		player.draw();
		ctx.restore();
		
		this.debug.draw();
	};
	
	this.getTime = function()
	{
		var now = new Date();
		return Date.UTC(now.getFullYear(),now.getMonth(),
						now.getDate(),now.getHours(),now.getMinutes(),
												now.getSeconds(),now.getMilliseconds() );
	};
    this.lastLoopTime = this.getTime(); //Initialise lastloop time here to avoid getting a massive
    									//delta on the first run
    									
    								
	this.clicked = function(button,x,y)
	{
		console.log(" button " + button + " x: " + x + " y: " + y);
	} 
}


function Debug(width,height,tileMap)
{
	this.width = width;
	this.height = height;
	this.translateX = 10;
	this.translateY = 10;
	this.offset = 5;

	this.tileMap = tileMap;
	
	this.colours = ["rgba(0,0,0,0.1)","green","red","orange","cyan"];
	
	this.draw = function()
	{
		debugCtx.clearRect(0,0,this.width,this.height); // clear canvas
		debugCtx.save();
		debugCtx.translate(this.translateX,this.translateY);

		var width = 10;
		
		var length = this.tileMap.tileMap.width;
		var height = this.tileMap.tileMap.height;
		
		debugCtx.fillStyle = "rgba(0,0,0,0.1)";
		debugCtx.fillRect(0,0,(length * (width+this.offset))-this.offset,(height * (width+this.offset))-this.offset);//length,height);
				

		for (var i = 0; i < length; i++) {
		    for (var j = 0; j < height; j++) {
		    	var xpos = i * (width + this.offset);
		    	var ypos = j * (width + this.offset);
		    	
		    	debugCtx.save();		    	
		    	
		    	debugCtx.translate(xpos,ypos);
		    	
	 	 		debugCtx.fillStyle = this.colours[this.tileMap.tileIndex(i,j)];
		    	debugCtx.fillRect(0,0,width,width);
		    	debugCtx.restore();
		    }
		}
		debugCtx.restore();
	}
	
	this.clicked = function(button,x,y)
	{
		//console.log(" button " + button + " x: " + x + " y: " + y);
		
		//Roll back the translation for appearance
		x -= this.translateX;
		y -= this.translateY;

        x = Math.floor(x/(10+5));		
		y = Math.floor(y/(10+5));

        
        console.log("x: " + x + " y: " + y);
        
        this.tileMap.changeTile(x,y);
	}
}