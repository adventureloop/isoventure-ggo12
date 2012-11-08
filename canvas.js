/*
 *  Isoventure - Github Game Off Entry. 
 *  Copyright Tom Jones jones@sdf.org @adventureloop 
 *
 */


var player;
var game;
var ctx;
var debugCtx;

var FRAMES_PER_SECOND = 60;
var FPS = 1000 / FRAMES_PER_SECOND;

function init()
{
	var debugCanvas = document.getElementById('editor');
	debugCtx = debugCanvas.getContext('2d');
	
	var canvas = document.getElementById('game');
	ctx = canvas.getContext('2d');
	
	console.log("Contex is " + ctx);

	game = new Game(canvas.width,canvas.height,
					debugCanvas.width,debugCanvas.height);
	
	document.getElementById('game').onmousedown = mouse;	
	document.onkeydown = keyboard;	
	document.oncontextmenu = contextMenu;
	document.getElementById('editor').onmousedown = mouse;	
	
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
			
		if(e.target.id == 'editor')
			game.mapEditor.clicked(e.which,x,y);
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
			player.setDest({tileX:0,tileY:8,tileXPos:0,tileYPos:0});
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
		var width = this.tiles.width;
		var height = this.tiles.height;
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
		return true;
	};
	
	this.drawDebug = function()
	{
		var width = this.tiles.width;
		var height = this.tiles.height;

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
	
	this.clicked = function(x,y)
	{
		console.log("Checking  x: " + x + " y: " + y);
		//x = (x / (this.tiles.width/2));
		//y = (y/(this.tiles.width/4));
		//We need to undo the isometric conversion to get real (x,y) coords
		//each tiles is 54x108 as a real screen image.	
		var width = this.tiles.width;
		var height = this.tiles.height;
		
		for (var i = 0; i < this.tileMap.width; i++) {
		    for (var j = this.tileMap.height-1;j >= 0; j--) {
				var xpos = (j * width / 2) + (i * width / 2);
				var ypos = (i * height / 2) - (j * height / 2);

				if((x > xpos && x < xpos + 108) && (y > ypos+54 && y < ypos + 108)) {
					console.log("Hit tile (" + i + "," + j + ")");
					//Return the first tile hit, DEBUG this later
					return {tileX:i,tileY:j,tileXPos:54,tileYPos:54};
				}
			}
		}
		//console.log("Clicked tile (" + x + "," + y + ")");
	}
}

function TileMapLoader()
{
	this.staticTileMap = function()
	{
		var tiles = [];
		tiles[0] = undefined;
		tiles[1] = new Image();
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
		tiles[5] = new Image();
		tiles[5].src = "images/FloorTileDebug.png";
		tiles[5].enterable = true;
		tiles[5].blocksView = false;
		tiles.width = 108;
		tiles.height = 54;
		
		var tileMap = [];

		/*

		var tileMap = [[2,2,2,2,0,0,2,2,2],[1,1,1,1,0,0,1,1,1],[1,1,1,1,1,1,1,1,1],					[1,1,1,1,1,1,1,1,1],[1,1,1,1,0,0,1,1,1],[1,1,1,1,0,0,1,1,1]];
		*/

		var tileMap = [[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],				[3,3,3,3,3,3,3,4,3],[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],
			[3,3,3,3,3,3,3,3,3]];

		/*
		var tileMap = [[5,5,5,5,5,5,5,5,5],[5,5,5,5,5,5,5,5,5],[5,5,5,5,5,5,5,5,5],				[5,5,5,5,5,5,5,4,5],[5,5,5,5,5,5,5,5,5],[5,5,5,5,5,5,5,5,5],
				[5,5,5,5,5,5,5,5,5]];
		*/
		tileMap.width = tileMap.length;
		tileMap.height = tileMap[0].length;
		return new TileMap(tiles,tileMap);
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

  	this.stop = function()
    {
    	this.currentFrame = 0;
    }
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
		if(dist < 25)
			return true;
	};
	
	this.updateWithDelta = function(delta)
	{
      	for(var i = 0;i < this.components.length;i++)
          this.components[i](delta,this);
	};
	
	this.draw = function()
	{
		ctx.save();
		//Translate to the tile	
		var screenX = (this.tileY * this.tileWidth / 2) + 
									(this.tileX * this.tileWidth / 2);
		var screenY = (this.tileX * this.tileHeight / 2) - 
									(this.tileY * this.tileHeight / 2);
		
		ctx.translate(screenX,screenY);		
		
		screenX = this.tileXPos + this.tileYPos;
		screenY = (this.tileXPos - this.tileYPos) / 2 + 0.0; //The 0.0 is a z coord for depth sorting

		ctx.translate(screenX,screenY);

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

function createPlayer(tileMap)
{
	var sprite = new Image();
    sprite.src = "images/BaseSpriteSheet.png";

	var frames = [{width:64,height:64,x:0,y:0},
				{width:64,height:64,x:64,y:0},
				{width:64,height:64,x:128,y:0},
				{width:64,height:64,x:64,y:0}
				];

	var p = new Entity(tileMap,0,0);
	p.addAnimation(new Animation(200,sprite,frames));
	p.life = 20;
	p.player = true;
	p.addComponent(headToComponent);
	//player.addComponent(headAlongVector);
	
	return p;
}

function headToComponent(delta,entity)
{

	if(entity.dest != undefined && entity.currentAnimation != undefined)
      entity.currentAnimation.updateWithDelta(delta);

	if(entity.dest !== undefined) {
		var playerX = entity.tileX;
		var playerY = entity.tileY;

		var destX = entity.dest.tileX;
		var destY = entity.dest.tileY;

//Calculate the vector between here and there, use the unit vector to scale a step
      	var fx = destX - playerX;
		var fy = destY - playerY;

		var mag = Math.sqrt( (fx*fx) + (fy*fy));
		fx = fx/mag;
		fy = fy/mag;

		var step = (entity.speed*(delta/1000));	//Scale the speed for time, pixels per second.

		var xmove = fx*step;
		var ymove = fy*step;
		entity.move(xmove,ymove);

		//Once we have arrived clear out the destination.
		if(entity.dest.tileX === entity.tileX && entity.dest.tileY === entity.tileY) {
			entity.dest = undefined;
			//if(this.dest.tileXPos === this.tileXPos && this.dest.tileYPos === this.tileYPos)
			//	this.dest = undefined;
		}
    }
}

function generateRandomDest(delta,entity)
{
  	if(entity.dest === undefined) {
      entity.setDest({tileX:Math.floor(Math.random()*8),tileY:Math.floor(Math.random()*8),tileXPos:0,tileYPos:0});
  	}

}

function headAlongVector(delta,entity)
{
	if(entity.dest !== undefined) {
		
		var playerX = entity.tileX;
		var playerY = entity.tileY;

		var destX = entity.dest.tileX;
		var destY = entity.dest.tileY;

//Calculate the vector between here and there, use the unit vector to scale a step
      	var fx = destX - playerX;
		var fy = destY - playerY;

		var mag = Math.sqrt( (fx*fx) + (fy*fy));
		fx = fx/mag;
		fy = fy/mag;

		var step = (entity.speed*(delta/1000));	//Scale the speed for time, pixels per second.

		entity.xmove = fx*step;
		entity.ymove = fy*step;
		
		//Remove the destination to avoid recalculation
		entity.dest = undefined
	}
	if(entity.xmove !== undefined && entity.ymove !== undefined) 
		entity.move(entity.xmove,entity.ymove);
}

function Game(width,height,debugWidth,debugHeight) 
{
	this.width = width;
	this.height = height;
	this.translateX = 0;
	this.translateY = 160;

	this.lastUpdateTime = 0;
    this.lastFpsTime = 0;
    this.lastLoopTime = 0;
    this.latestFPS = 0;
    this.fps = 0;

    this.tileMap = (new TileMapLoader).staticTileMap();
    this.tileMap.debug = true;

    this.mapEditor = new TileMapEditor(debugWidth,debugHeight,this.tileMap);
	
	player = createPlayer(this.tileMap);
	
	var bullets = [];
	var entities = [];

  	for(var i = 1;i < 4;i++) {
      	var e = new Entity(this.tileMap,i+2,6);
		e.speed = 15;
		e.life = 10;
      	e.addComponent(headToComponent);
      	e.addComponent(generateRandomDest);
      	entities.push(e);
  	}

	frames = [{width:64,height:64,x:0,y:0}];
	var esprite = new Image();
	esprite.src = "images/SpriteShooting.png";
	
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
				//entities[i].hit();				
			}				
		}

		//Check whether bullets have hit enemy
		for(var i = 0;i < bullets.length;i++) {
			for(var j = 0;j < entities.length;j++)
				if(bullets[i].collidesWithEntity(entities[j])) {
					bullets[i].hit();
					entities[j].hit();				
			}				
		}
		
		var tmp = []
		//Remove any enemy that has 0 life left
		for(var i = 0;i < entities.length;i++) {
			if(entities[i].life > 0)
				tmp.push(entities[i]);
		}
		
		entities = tmp;
       	tmp = []; 
		for(var i = 0;i < bullets.length;i++) {
			var b = bullets[i];
			if(!this.tileMap.validTilePos(b.tileX,b.tileY))
				b.hit();
			if(b.life > 0)
				tmp.push(b);
		}
		bullets = tmp
        this.draw();
	};
	
	this.updateWithDelta = function(delta) 
	{
		player.updateWithDelta(delta);
	
		for(var i = 0;i < entities.length;i++) {
			entities[i].updateWithDelta(delta);				
		}

		for(var i = 0;i < bullets.length;i++) {
			bullets[i].updateWithDelta(delta);				
		}
	};
	
	this.draw = function()
	{
		ctx.clearRect(0,0,this.width,this.height); // clear canvas
		
		ctx.strokeText("FPS: " + this.latestFPS,2,10);
		ctx.strokeText("BUILD: Clicking game",
								this.width-112,this.height-2);
		ctx.strokeText("Health: " + player.life,2,this.height-2);
		ctx.strokeText("Enemies: " + entities.length,100,this.height-2);
		ctx.strokeText("Bullets: " + bullets.length,175,this.height-2);
		ctx.save();		
		
		//Position the tilemap
		ctx.translate(this.translateX,this.translateY);			
		
		//entities.push(player);
		this.tileMap.drawTileMap(entities);
		//entities.pop;
		player.draw();
		
		for(var i = 0;i < bullets.length;i++) {
			bullets[i].draw();				
		}
		ctx.restore();
		
		this.mapEditor.draw();
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
		
		//Undo screen centering
		x -= this.translateX;
		y -= this.translateY;
		
//		console.log("Checking " + button + " x: " + x + " y: " + y);
		var tile = this.tileMap.clicked(x,y);
		console.log(tile);

      	switch(button) 
        {
        case 1:
			player.setDest(tile);
         	break;
        case 3:
            //Add new bullet in direction
			console.log("Adding bullet");
			var bsprite = new Image();
			bsprite.src = "images/bullet.png";

			var bframes = [{width:5,height:5,x:11,y:11}]

			var b = new Entity(this.tileMap,player.tileX,
												player.tileY);
			b.tileXPos = player.tileXPos;
			b.tileYPos = player.tileYPos;
			b.addAnimation(new Animation(0,bsprite,bframes));
			b.addComponent(headAlongVector);
			b.setDest(tile);
			b.speed = 200;
			bullets.push(b);
            break;
        default:
            break;
        }
	} 
}


function TileMapEditor(width,height,tileMap)
{
	this.width = width;
	this.height = height;
	this.translateX = 10;
	this.translateY = 10;
	this.offset = 5;

	this.tileMap = tileMap;
	
	this.colours = ["rgba(0,0,0,0.1)","green","red","orange","cyan","blue"];
	
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
		//Roll back the translation for appearance
		x -= this.translateX;
		y -= this.translateY;

        x = Math.floor(x/(10+5));		
		y = Math.floor(y/(10+5));
        
        this.tileMap.changeTile(x,y);
	}
}
