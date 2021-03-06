/*
 *  Isoventure - Github Game Off Entry. 
 *  Copyright Tom Jones jones@sdf.org @adventureloop 
 *
 */
var player;
var game;
//var audioManager;
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

	audioManager = new AudioManager(['sounds/Shoot.wav']);
	audioManager.loadSounds(function(){game.finishedLoadingSounds();});

	setInterval(function(){game.run();},FPS); //Wrapped in an anon func, to stop the scope on run changing
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
		case 80:
			console.log("Player position tile:(" + player.tileX + "," + player.tileY + ")"); 
			break;
		case 82:
			console.log("Restarting game");
			game.state = "starting";
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
			
		tile = tiles[this.tileMap[tileX][tileY]];	//DEBUG error where tile cannot be found happens here.
		if(tile == undefined || !tile.enterable)
			return false;
			
		//If there are any events for the tile we are in execute them
		if(this.eventMap !== undefined) {
			var events = this.eventMap[tileX][tileY];
			for(var i = 0;i < events.length;i++)
				events[i]();
		}
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
	};
	
	this.tileIndex = function(x,y) 
	{
		return this.tileMap[x][y];
	};
	
	this.changeTile = function(x,y)
	{
		this.tileMap[x][y]++;
		if(this.tileMap[x][y] > tiles.length-1)
			this.tileMap[x][y] = 0;
	};
	
	this.clicked = function(x,y)
	{
		//console.log("Checking  x: " + x + " y: " + y);
		//We need to undo the isometric conversion to get real (x,y) coords
		//each tiles is 54x108 as a real screen image.	
		var width = this.tiles.width;
		var height = this.tiles.height;
		
		for (var i = 0; i < this.tileMap.width; i++) {
		    for (var j = this.tileMap.height-1;j >= 0; j--) {
				var xpos = (j * width / 2) + (i * width / 2);
				var ypos = (i * height / 2) - (j * height / 2);

				if((x > xpos && x < xpos + 108) && (y > ypos+54 && y < ypos + 108)) {
					//console.log("Hit tile (" + i + "," + j + ")");
					//Return the first tile hit, DEBUG this later
					return {tileX:i,tileY:j,tileXPos:54,tileYPos:54};
				}
			}
		}
	};
	
	this.addEventToTile = function(x,y,event) 
	{
		//If not already defined create a 3d array which matches the tileMap, where the 3rd dimension holds events.
		if(this.eventMap === undefined) {
			var width = this.tileMap.width;
			var height = this.tileMap.height;
			this.eventMap = []
			for(var i = 0;i< width;i++) {
				var tmp = [];
				for(var j = 0;j < height;j++) {
					tmp.push([]);
				}
				this.eventMap.push(tmp);
			}
		}
		this.eventMap[x][y].push(event);
	};
}

function LevelLoader()
{
	this.loadTiles = function()
	{
		var tiles = [];
		tiles[0] = undefined;
		tiles[1] = new Image();
		tiles[1].src = "images/FloorTile.png";
		tiles[1].blocksView = false;
		tiles[1].enterable = true;
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
		tiles[5].src = "images/FloorTile.png";
		tiles[5].enterable = true;
		tiles[5].blocksView = false;
		tiles[6] = new Image();
		tiles[6].src = "images/FloorTileDebug.png";
		tiles[6].enterable = true;
		tiles[6].blocksView = false;
		tiles.width = 108;
		tiles.height = 54;
		
		return tiles;
	};

	this.staticTileMap = function() 
	{
		var tiles = this.loadTiles();
		
		var tileMap = [];

		var tileMap = [[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],				[3,3,3,3,3,3,3,4,3],[3,3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3,3],
			[3,3,3,3,3,3,3,3,3]];

		tileMap.width = tileMap.length;
		tileMap.height = tileMap[0].length;
		return new TileMap(tiles,tileMap);
	};
	
	this.generateTileMap = function(width,height)
	{
		var tileMap = [];
		for(var i = 0;i< width;i++) {
			var tmp = [];
			for(var j = 0;j < height;j++) {
				tmp.push(3);
			}
			tileMap.push(tmp);
		}
		tileMap.width = tileMap.length;
		tileMap.height = tileMap[0].length;
		return new TileMap(this.loadTiles(),tileMap);
	};

	this.level1 = function() 
	{
		console.log("Starting level 1 ");
		console.log("This level has you crash on an enemy planet");
		var tileMap = [];
		var width = 25;
		var height = 25;
		for(var i = 0;i< width;i++) {
			var tmp = [];
			for(var j = 0;j < height;j++) {
				tmp.push(3);
			}
			tileMap.push(tmp);
		}
		tileMap.width = tileMap.length;
		tileMap.height = tileMap[0].length;

		//Make the bottom corner crash site
		for(var i = 0;i< 5;i++)
			for(var j = 0;j < 5;j++)
				tileMap[i][j] = 1;
		for(var i = 0;i < height;i++)
			tileMap[0][i] = 2;
		for(var i = 0;i < height/2;i++)
			tileMap[i][height-1] = 2;

		tileMap[24][11] = 1;
		tileMap[24][12] = 1;

		var level = new TileMap(this.loadTiles(),tileMap);
		
		level.tileMap[22][22] = 4;
		level.addEventToTile(22,22,function(){ 
				if(player.tileX == 22 && player.tileY == 22) {
					game.state = "level complete";
					game.currentLevel = 2;
				}
		});

		var entities = []	
		/*for(var i = 1;i < 4;i++) {
			entities.push(createEnemy(level,i+10,6));
		}*/
	
		//Create a path follow, this is a test
		var e = createEnemy(level,20,20);
		e.clearComponents();
		e.addComponent(pathFollowerComponent);
		e.addComponent(headToComponent);
		
		var path = [];
		path.push({tileX:20,tileY:20,tileXPos:0,tileYPos:0});
		path.push({tileX:20,tileY:10,tileXPos:0,tileYPos:0});
		path.push({tileX:10,tileY:10,tileXPos:0,tileYPos:0});
		path.push({tileX:10,tileY:20,tileXPos:0,tileYPos:0});
		
		e.path = path;
		e.pathIndex = 0;
		
		entities.push(e);

		if(player === undefined)
			player = createPlayer(level);
		player.tileX = 19;
		player.tileY = 19;

		return {tileMap:level,entities:entities};
	};

	this.level2 = function() 
	{
		console.log("Starting level 2");
		var tileMap = [];
		var width = 10;
		var height = 10;
		for(var i = 0;i< width;i++) {
			var tmp = [];
			for(var j = 0;j < height;j++) {
				if(i == width || j== width)
					tmp.push(2);
				else
					tmp.push(1);
			}
			tileMap.push(tmp);
		}
		tileMap.width = tileMap.length;
		tileMap.height = tileMap[0].length;
		
		var level = new TileMap(this.loadTiles(),tileMap);
		
		level.tileMap[5][5] = 4;
		level.addEventToTile(5,5,function(){ 
				if(player.tileX == 5 && player.tileY == 5) {
					game.state = "level complete";
					game.currentLevel = 3;
				}
		});

		if(player === undefined)
			player = createPlayer(level);
		//player.tileMap = level;
		player.tileX = 4;
		player.tileY = 4;
		player.setDest(undefined);	
		var entities = [];
		
		return {tileMap:level,entities:entities};
	};
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

		ctx.drawImage(this.sprite,frame.x,frame.y,
										frame.width,frame.height,
										frame.xshift,frame.yshift,
										frame.width,frame.height);

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
	this.maxLife;
	this.maxTime = 1000;

	this.player = false;
	
	this.components = [];
	this.dest = undefined;
	this.time = 0;		//Time increases with the game.
	this.hitBox = undefined;
	
	this.collidesWithEntity = function(entity)
	{		
		var mypos = this.worldPosition();
		var x = mypos.x;
		var y = mypos.y;		
		
		var enpos = entity.worldPosition();
		var enX = enpos.x;
		var enY = enpos.y;
		
		var dist = Math.sqrt(Math.pow(enX - x,2) + Math.pow(enY - y,2));
		if(dist < 25)
			return true;
	};
	
	this.updateWithDelta = function(delta)
	{
		this.time += delta;
		//Work around the sticking bug. This needs to be solved at the source [DEBUG]
		if(isNaN(this.tileX) || isNaN(this.tileY) || isNaN(this.tileXPos) || isNaN(this.tileXPos)) {
			console.log("Tile position has become NaN");
			this.unmove();
		}
      	for(var i = 0;i < this.components.length;i++)
          this.components[i](delta,this);
	};
	
	this.draw = function()
	{
		ctx.save();
		//Translate to the tile	
		var pos = this.screenPosition();
		ctx.translate(pos.x,pos.y);

		if(this.animations == undefined)
			this.animations = [];
		if(this.currentAnimation != undefined)
			this.currentAnimation.draw();
			
		ctx.restore();
	
		if(this.hitBox !== undefined)
			drawHealthBarComponent(0,this)
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
	console.log("Unmoving");
		this.tileX = this.oldTileX;
		this.tileY = this.oldTileY;
		this.tileXPos = this.oldTileXPos;
		this.tileYPos = this.oldTileYPos;
	};
	
	this.hit = function(damage)
	{
		this.life -= damage;
	};
	
	this.worldPosition = function()
	{
		var xpos = (this.tileX * this.tileMap.getWidth()) + this.tileXPos;
		var ypos = (this.tileY * this.tileMap.getWidth()) + this.tileYPos;

		return {x:xpos,y:ypos};
	};
	
	this.screenPosition = function()
	{
		var screenX = (this.tileY * this.tileWidth / 2) + 
									(this.tileX * this.tileWidth / 2);
		var screenY = (this.tileX * this.tileHeight / 2) - 
									(this.tileY * this.tileHeight / 2);			

		//Having these coordinates fixes a jump between tiles, I do not know why [DEBUG]
		screenX /= 2;	
		screenY /= 2;	

		screenX += screenX + (this.tileXPos + this.tileYPos);
		screenY += screenY + ((this.tileXPos - this.tileYPos) / 2 + 0.0);	
		
		return {x:screenX,y:screenY};
	};
	
	this.addComponent = function(component)
	{
		this.components.push(component);
	};
	
	this.clearComponents = function()
	{
		this.components = [];
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

	var frames = [{width:64,height:64,x:0,y:0,xshift:-25,yshift:20},
				{width:64,height:64,x:64,y:0,xshift:-25,yshift:20},
				{width:64,height:64,x:128,y:0,xshift:-25,yshift:20},
				{width:64,height:64,x:64,y:0,xshift:-25,yshift:20}
				];

	var p = new Entity(tileMap,0,0);
	p.addAnimation(new Animation(100,sprite,frames));
	p.life = 10;
	p.maxLife = 10;
	p.player = true;
	p.addComponent(headToComponent);
	p.hitBox = true;
	p.weapon = new Weapon(tileMap,p,2,10,750,1000);

	return p;
}

function createEnemy(tileMap,x,y)
{
	var e = new Entity(tileMap,x,y);
	e.speed = 15;
	e.life = 5;
	e.maxLife = 5;
	e.hitBox = true;
    e.addComponent(headToComponent);
    e.addComponent(generateRandomDest);

	e.addComponent(sentryComponent);
	e.attackRange = 300;
	var frames = [{width:64,height:64,x:0,y:0,xshift:-25,yshift:20}];
	var esprite = new Image();
	esprite.src = "images/SpriteShooting.png";

	e.addAnimation(new Animation(0,esprite,frames));
	
	e.weapon = new Weapon(tileMap,e,1,undefined,400,2000);
    return e;
}

function createBullet(tileMap,pos,dest,maxTime,damage)
{
	var sprite = new Image();
	sprite.src = "images/bullet.png";

	var frames = [{width:5,height:5,x:11,y:11,xshift:5,yshift:50}]

	var b = new Entity(tileMap,pos.tileX,pos.tileY);
	b.tileXPos = pos.tileXPos;
	b.tileYPos = pos.tileYPos;
	b.addAnimation(new Animation(0,sprite,frames));
	b.addComponent(headAlongVector);
	b.setDest(dest);
	b.speed = 200;
	b.damage = damage;
	b.maxTime = maxTime;
	return b;
}

function createConingMachine(tileMap,pos,rate,createFunc)
{
	var sprite = new Image();
	sprite.src = "images/cloningmachine.png";

	var frames = [{width:5,height:5,x:11,y:11,xshift:5,yshift:50}]
	var c = new Entity(tileMap,pos.tileX,pos.tileY);	
	c.addAnimation(new Animation(0,sprite,frames));

}

function headToComponent(delta,entity)
{

	if(entity.dest != undefined && entity.currentAnimation != undefined)
      entity.currentAnimation.updateWithDelta(delta);

	if(entity.dest !== undefined) {
		//Once we have arrived clear out the destination.
		if(entity.dest.tileX === entity.tileX && entity.dest.tileY === entity.tileY) {
			entity.dest = undefined;
			//if(this.dest.tileXPos === this.tileXPos && this.dest.tileYPos === this.tileYPos)
			//	this.dest = undefined;
		}

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
    }
}

function pathFollowerComponent(delta,entity)
{
	if(entity.path === undefined) {
		var path = [];
		path.push({tileX:0,tileY:0,tileXPos:0,tileYPos:0});
		path.push({tileX:9,tileY:0,tileXPos:0,tileYPos:0});
		path.push({tileX:9,tileY:9,tileXPos:0,tileYPos:0});
		path.push({tileX:0,tileY:9,tileXPos:0,tileYPos:0});
		
		entity.path = path;
		entity.pathIndex = 0;
	}
	
	if(entity.dest === undefined) {
		entity.setDest(entity.path[entity.pathIndex]);
		if(entity.pathIndex > entity.path.length)
			entity.pathIndex = 0;
		else
			entity.pathIndex++;
	}
}

function drawHitBoxComponent(delta,entity)
{
	//console.log("Drawing hit box");
	ctx.save();
	
	var screenPos = entity.screenPosition();
	ctx.translate(screenPos.x,screenPos.y);
	
	ctx.strokeStyle = "rgb(1.0,0.0,0.0)";
	ctx.beginPath();
	ctx.arc(7.5,50,12.5,0*Math.PI,2*Math.PI);
	ctx.restore();
	ctx.stroke();
}

function drawHealthBarComponent(delta,entity)
{
	//console.log("Drawing hit box");
	ctx.save();
	
	var screenPos = entity.screenPosition();
	ctx.translate(screenPos.x,screenPos.y);
	
	ctx.fillStyle = "rgb(255,0,0)";
	ctx.fillRect(-5,15,25,5);
	
	entity.maxHealth = 2;
	var size = entity.life / entity.maxLife;
	size = (size > 1.0)? 1.0 : size;	//If the size is greater than one, we get a horrible long bar

	ctx.fillStyle = "rgb(0,255,0)";
	ctx.fillRect(-10,15,35 * size,5);
	

	ctx.restore();
}

function sentryComponent(delta,entity)
{
	if(entity.attackRange === undefined)
		entity.attackRange = 100;
	var mypos = entity.worldPosition();
	var x = mypos.x;
	var y = mypos.y;		
				
	var enpos = player.worldPosition();
	var enX = enpos.x;
	var enY = enpos.y;
							
	var dist = Math.sqrt(Math.pow(enX - x,2) + Math.pow(enY - y,2));
	if(dist < entity.attackRange) {
	//	game.addBullet(entity.weapon.fire({tileX:0,tileY:0,tileXPos:0,tileYPos:0}))
		game.addBullet(entity.weapon.fire(player))
	}	
}

function generateRandomDest(delta,entity)
{
  	if(entity.dest === undefined) {
      entity.setDest({tileX:Math.floor(Math.random()*8),
	  					tileY:Math.floor(Math.random()*8),	
						tileXPos:0,
						tileYPos:0});
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

function Weapon(tileMap,entity,damage,ammo,delay,maxTime)
{
	this.entity = entity;
	this.tileMap = tileMap;
	this.damage = damage;
	this.ammo = ammo;
	this.delay = delay;
	this.maxTime = maxTime;

	this.fire = function(dest)
	{
		//Limit the firing rate
		if(this.entity.lastFired === undefined)
			this.entity.lastFired = this.entity.time;
		if(this.entity.time < this.entity.lastFired + this.delay)
			return;
		this.entity.lastFired = this.entity.time;

		//If ammo is defined limit the number of shots that can be fired
		if(this.ammo !== undefined)
			this.ammo--;
		if(this.ammo !== undefined && this.ammo < 1)
			return undefined;	

		//Manually play the fire sound
		audioManager.playSound(0);
		return createBullet(tileMap,entity,dest,maxTime,damage);
	};
}

function Game(width,height,debugWidth,debugHeight) 
{
	this.width = width;
	this.height = height;
	this.translateX = 0;
	this.translateY = 0;

	this.lastUpdateTime = 0;
    this.lastFpsTime = 0;
    this.lastLoopTime = 0;
    this.latestFPS = 0;
    this.fps = 0;

	this.state = "loading sounds";		//Manage the flow of the game, States: running,paused,gameover
	
	var bullets = [];
	var entities = [];

	this.maxLevel = 2;
	this.currentLevel = 1;
	this.levelLoader = new LevelLoader();

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
        
		this.draw();
	};
	
	this.loadLevel = function()
	{
		//Clear out values in case this is a reset
		player = undefined;
		entities = undefined;
		bullets = undefined;
		this.tileMap = undefined;
		this.mapEditor = undefined;
		
		//this.tileMap = (new TileMapLoader).staticTileMap();
	//	console.log("Current level is " + currentLevel);
		var level;
		switch(this.currentLevel) {
			case 1:
				level = this.levelLoader.level1();		
				break;
			case 2:
				level = this.levelLoader.level2();		
				break;
			default:
				break;
		}
		this.tileMap = level.tileMap;
		entities = level.entities;
		
		//Cannot enter tiles tileX > 9
		//this.tileMap.debug = true;

		//this.mapEditor = new TileMapEditor(debugWidth,debugHeight,this.tileMap);
	
		bullets = [];
		//entities = [];
		
		this.state = "running";
	};
	
	this.updateWithDelta = function(delta) 
	{
		if(this.currentLevel > this.maxLevel)
			this.state = "complete";

		if(this.state === "starting") {
			this.loadLevel();
			return;
		}
		if(this.state === "running") {
			player.updateWithDelta(delta);
	
			for(var i = 0;i < entities.length;i++) {
				entities[i].updateWithDelta(delta);				
			}

			for(var i = 0;i < bullets.length;i++) {
				bullets[i].updateWithDelta(delta);				
			}

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
					player.hit(1);
					player.unmove();
				}				
			}

			//Check whether bullets have hit enemy
			for(var i = 0;i < bullets.length;i++) {
				if(bullets[i].time < 300)
					continue;
				if(bullets[i].collidesWithEntity(player)) {
					bullets[i].hit(1);
					player.hit(bullets[i].damage);
					continue;
				}
				for(var j = 0;j < entities.length;j++) {
					if(bullets[i].collidesWithEntity(entities[j])) {
						bullets[i].hit();
						entities[j].hit(bullets[i].damage);				
					}	
				}
			}
		
			var tmp = []
			//Remove any enemy that has 0 life left
			for(var i = 0;i < entities.length;i++) {
				if(entities[i].life > 0)
					tmp.push(entities[i]);
			}
	
			//Remove bullets that leave the tilemap and over a certain age
			entities = tmp;
			tmp = []; 
			for(var i = 0;i < bullets.length;i++) {
				var b = bullets[i];
				if(!this.tileMap.validTilePos(b.tileX,b.tileY) || b.time > b.maxTime)
					b.hit();
				if(b.life > 0)
					tmp.push(b);
			}
			bullets = tmp
		
			//Center the player in the screen
			var pos = player.screenPosition();
			this.translateX = -pos.x+(this.width/2);
			this.translateY = -pos.y+(this.height/2);
       
			if(player.life < 1)
				this.state = "game over";
		//	if(entities.length === 0)
		//		this.state = "game over";
		}
	};
	
	this.draw = function()
	{
		ctx.clearRect(0,0,this.width,this.height); // clear canvas
		
		if(this.state !== "starting") {
			ctx.save();		
		
			//Position the tilemap
			ctx.translate(this.translateX,this.translateY);			
		
			this.tileMap.drawTileMap(entities);
			player.draw();
		
			for(var i = 0;i < bullets.length;i++) {
				bullets[i].draw();				
			}
			ctx.restore();
		}
		
		if(this.state == "complete") {
			ctx.save();
			
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect(0,0,this.width,this.height);
			
			ctx.font = "italic 40px Arial";
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillText("You WIINNN!!!!",this.width/2-100,this.height/2);
			
			ctx.font = "italic 20px Arial";
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillText("Thank you for playing",this.width/2-75,this.height/2+25);
			
			ctx.restore();
			return;
		}

		ctx.strokeText("FPS: " + this.latestFPS,2,10);
		ctx.strokeText("BUILD: Lots of levels",
								this.width-112,10);
		ctx.strokeText("Health: " + player.life,2,this.height-2);
		ctx.strokeText("Enemies: " + entities.length,100,this.height-2);
		ctx.strokeText("Bullets: " + player.weapon.ammo,175,this.height-2);
		ctx.strokeText("Level: " + this.currentLevel,225,this.height-2);
	
		if(this.state == "game over") {
			ctx.save();
			
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect(0,0,this.width,this.height);
			
			ctx.font = "italic 40px Arial";
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillText("Game Over",this.width/2-100,this.height/2);
			
			ctx.font = "italic 20px Arial";
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillText("Click to restart",this.width/2-75,this.height/2+25);
			
			ctx.restore();
		}

		if(this.state == "level complete") {
			ctx.save();
			
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect(0,0,this.width,this.height);
			
			ctx.font = "italic 40px Arial";
			ctx.fillStyle = "rgb(0,255,0)";
			ctx.fillText("Level Complete",this.width/2-100,this.height/2);
			
			ctx.font = "italic 20px Arial";
			ctx.fillStyle = "rgb(0,255,0)";
			ctx.fillText("Click to continue",this.width/2-75,this.height/2+25);
			
			ctx.restore();
		}
		
		if(this.state == "starting") {
			ctx.save();
			
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect(0,0,this.width,this.height);
			
			ctx.font = "italic 40px Arial";
			ctx.fillStyle = "rgba(255,255,255,0.4)";
			ctx.fillText("loading...",this.width/2-100,this.height/2);
			
			ctx.restore();
		}
		
		if(this.mapEditor !== undefined)
			this.mapEditor.draw();
	};
	
	this.getTime = function()
	{
		var now = new Date();
		return Date.UTC(now.getFullYear(),now.getMonth(),
						now.getDate(),now.getHours(),now.getMinutes(),
												now.getSeconds(),now.getMilliseconds() );
	};
	//Initialise lastloop time here to avoid getting a massive
   	//delta on the first run
    this.lastLoopTime = this.getTime(); 
    									
    								
	this.clicked = function(button,x,y)
	{
		//Undo screen centering
		x -= this.translateX;
		y -= this.translateY;
		
		var tile = this.tileMap.clicked(x,y);
		//console.log(tile);
		if(this.state === "running") {
			switch(button) 
			{
			case 1:
				player.setDest(tile);
				break;
			case 3:
			//Add new bullet in direction
				if(player.weapon !== undefined) {
					var b = player.weapon.fire(tile);
					if(b !== undefined)
						bullets.push(b);
				}
				break;
			default:
				break;
			}
		} else
			this.state = "starting";
	};

	this.addBullet = function(bullet)
	{
		if(bullet !== undefined)
			bullets.push(bullet);
	};

	this.finishedLoadingSounds = function()
	{
		this.state = "starting";
	};
}


function TileMapEditor(width,height,tileMap)
{
	this.width = width;
	this.height = height;
	this.translateX = 10;
	this.translateY = 10;
	this.offset = 5;

	this.tileMap = tileMap;
	
	this.colours = ["rgba(0,0,0,0.1)","green","red","orange","cyan","blue","yellow"];
	
	this.draw = function()
	{
		debugCtx.clearRect(0,0,this.width,this.height); // clear canvas
		debugCtx.save();
		debugCtx.translate(this.translateX,this.translateY);

		var width = 10;
		
		var length = this.tileMap.tileMap.width;
		var height = this.tileMap.tileMap.height;
		
		debugCtx.fillStyle = "rgba(0,0,0,0.1)";
		debugCtx.fillRect(0,0,(length * (width+this.offset))-this.offset,(height * (width+this.offset))-this.offset);
				

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
	};
	
	this.clicked = function(button,x,y)
	{
		//Roll back the translation for appearance
		x -= this.translateX;
		y -= this.translateY;

        x = Math.floor(x/(10+5));		
		y = Math.floor(y/(10+5));
        
        this.tileMap.changeTile(x,y);
	};
}

//Audio stuff follows. I do not enjoy audio stuff
//The loading and creation of audio buffers is based off of code
//from html5rocks.com
function AudioManager(urlList)
{
	this.context = new webkitAudioContext();
	this.urlList = urlList;
	this.bufferList = new Array();
	this.loadCount = 0;

	this.playSound = function(index)
	{
		var sound = this.context.createBufferSource();
		sound.buffer = this.bufferList[index];
		sound.connect(this.context.destination);
		sound.noteOn(0);
	};

	this.loadBuffer = function(url,index)
	{
		// Load buffer asynchronously
		var request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.responseType = "arraybuffer";

		var loader = this;

		request.onload = function() {
		// Asynchronously decode the audio file data in request.response
			loader.context.decodeAudioData(
				request.response,
				function(buffer) {
					if (!buffer) {
						alert('error decoding file data: ' + url);
						return;
					}
					loader.bufferList[index] = buffer;
					if (++loader.loadCount == loader.urlList.length) {
						console.log("Finished loading sounds");
						loader.onload();
					}
				},
				function(error) {
					console.error('decodeAudioData error', error);
				}
			);
		};

		request.onerror = function() {
			alert('BufferLoader: XHR error');
		};

		request.send();
	};

	this.loadSounds = function(onload) 
	{
		this.onload = onload;
		for (var i = 0; i < this.urlList.length; ++i)
			this.loadBuffer(this.urlList[i], i);
	};
}
