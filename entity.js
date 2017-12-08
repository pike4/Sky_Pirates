//TODO: define "get" methods for every class, we need to be able to send them conveniently over the socket

var bullets;
var coords;
var pirates;
var bases;
const CHUNK_WIDTH = 1000;
const CHUNK_HEIGHT = 1000;

class Entity 
{
	constructor(id, x, y, cX, cY)
	{
		this.speed = 0;
		
		//The indices of the chunk the player is currently in
		this.chunkX = cX;
		this.chunkY = cY;

		//Coordinates within the chunk
		this.localX = x % CHUNK_WIDTH;
		this.localY = y % CHUNK_HEIGHT;
		
		//Global world coordinates
		this.x = x;
		this.y = y;


		//Used for accessing this globally
		if(id == 0) {
			this.id = Math.random().toString();
		}
		else {
			this.id = id;
		}
	}

	//Get the current time
	curTime() {
		var d = new Date();
		return d.getTime();
	}

	//True if $inc milliseconds have passed since $timer was last reset	
	hasElapsed(timer, inc) {
		return ((this.curTime() - timer) > inc);
	}

	//Wrap coordinates and change chunks
	boundsCheck()
	{
/*		var ret;
		if(this.localX > CHUNK_WIDTH)
		{
			this.localX = 0;
			this.chunkX++;
		}
	
		if(this.localX < 0) 
		{ 
			this.localX = CHUNK_WIDTH; 
			this.chunkX--; 
		}
		if(this.localY > CHUNK_HEIGHT)
		{
			this.localY = 0; 
			this.chunkY++; 
		}
		if(this.localY < 0)
		{
			this.localY = CHUNK_HEIGHT; 
			this.chunkY--; 
		}*/
		this.chunkX = Math.floor(this.x / CHUNK_WIDTH);
		this.chunkY = Math.floor(this.y / CHUNK_HEIGHT);
	}
	

	//Map real coordinates to drawn coordinates based on the relative position to the player
	draw () {
		this.img.x = this.getRelX(player) + player.img.x;
		this.img.y = this.getRelY(player) + player.img.y;
	}

	//Get the relative x corrdinate between this and another entity
	getRelX(other) {
		return other.x - this.x;
	}

	//Get the relative y corrdinate between this and another entity
	getRelY(other) {
		return other.y - this.y;
	}

	//TODO: If this client has adopted the entity, update entity state on the server
	store() {

	}

	//TODO: convert this object to a returnable object, something about the way inheritance works here breaks everything when you try to send the object
	JSONify() {
		var ret = new Object();
		ret.x = this.x;
		ret.y = this.y;
		ret.chunkX = this.chunkX;
		ret.chunkY = this.chunkY;
		ret.id = this.id;
		return ret;
	}

	//Modify the state of the given entity 
	modify(x, y, chunkX, chunkY) {
		this.x = x; this.y = y; this.chunkX = chunkX; this.chunkY = chunkY;
	}
}

class OtherPlayer extends Entity
{
	constructor(id,type, x, y, cx, cy) {
		super(id, x, y, cx, cy);

		this.img = game.add.sprite(x, y, 'spr_player_1');
		this.img.anchor.setTo(0.5, 0.5);
		this.img.width = 100;
		this.img.height = 50;
	}
	
	update() {
		this.draw();
	}

	modify(x, y, chunkX, chunkY, rot) {
		this.x = x; this.y = y; this.chunkX = chunkX; this.chunkY = chunkY; this.img.rotation = rot;
	}
}

class Base extends Entity
{
	constructor(id, x, y, cx, cy, health) {
		super(id, x, y, cx, cy);
		
		if(cx % 2 == 0) {
			this.img = game.add.sprite(x, y, 'spr_base_1');
		} else {
			this.img = game.add.sprite(x, y, 'spr_base_2');
		}

		this.img.anchor.setTo(0.5, 0.5);
		this.img.width = 150;
		this.img.height = 150;
		this.health = health;

		this.fireTimer = this.curTime();
		bases.set(this.id, this);
	}

	update() {
		if(this.hasElapsed(this.fireTimer, 800)) {
			for(var i = 0; i < 15; i++) {
				var newGuy = new Bullet(this.x, this.y, this.chunkX, this.chunkY, i * 2 * 3.14159 / 15);
			}
			this.fireTimer = this.curTime();
		}
		this.draw();
	}

	kill(dmg) {
		this.health -= dmg;

		if(this.health <= 0) {
			gold += 100;
			this.img.destroy();
			bases.delete(this.id);
			killEntity(this.id);
		}
	}
}

//Represents the client player
class Player extends Entity 
{
	constructor(type, x, y, cX, cY)
	{
		super(0, x, y, cX, cY);
		
		this.img = game.add.sprite(x, y, 'spr_player_1');
		this.img.anchor.setTo(0.5, 0.5);
		this.img.width = 100;
		this.img.height = 50;

		this.health = 200;
		this.type = type;
		this.fireTimer = this.curTime();

		this.curWeapon = 1;
	}

	update() 
	{

		if(dead) { return; }
		var dY = Math.sin(this.img.rotation) * this.speed;
		var dX = Math.cos(this.img.rotation) * this.speed;
		
		this.x += dX;
		this.y += dY;	
		this.localX += dX;
		this.localY += dY;
	
		this.boundsCheck();
		this.draw();
		coords.setText("x: " + this.chunkX + " y: " + this.chunkY);

		if(this.health <= 0) {
			console.log("You Died.");
			this.img.destroy();
			this.health = 100;
			var deadText = game.add.text(game.world.centerX, game.world.centerY, "You Died", 
				{ fill : "#ff0000", fontSize : 60});

			
			deadText.anchor.setTo(0.5, 0.5);
			var subText = game.add.text(game.world.centerX, game.world.centerY + 80, 
			"Reload to try again", {fill : "#ff0000", fontSize : 20});
			subText.anchor.setTo(0.5, 0.5);
			//deadText.fontSize = 60;
			dead = true;
		}
	}

	JSONify() {
		var ret = Entity.prototype.JSONify.call(this);
		ret.rotation = this.img.rotation;
		ret.type = 'P';
		return ret;
	}

	fire() {

		if(this.curWeapon == 1) {
			if(this.hasElapsed(this.fireTimer, 500)) {

				for(var i = 0; i < 10; i++) {
					var newGuy = new PlayerBullet(this.x, this.y, 
						this.chunkX, this.chunkY, i * 2 * 3.14159 / 10);
					newGuy.update();
				}
				
				this.fireTimer = this.curTime();
			}
		}

		else if(this.curWeapon == 2) {
			console.log("fire weapon 2");
			if(this.hasElapsed(this.fireTimer, 100)) {
				var newGuy = new PlayerBullet(this.x, this.y, 
						this.chunkX, this.chunkY, this.img.rotation);

				
				this.fireTimer = this.curTime();
			}
		}

		else if(this.curWeapon == 3) {
			console.log("fire weapon 3");
			if(this.hasElapsed(this.fireTimer, 1500)) {
				var newGuy = new PlayerMissile(this.x, this.y, 
					this.chunkX, this.chunkY, this.img.rotation);

				this.fireTimer = this.curTime();
			}
		}
	}
}

class Pirate extends Entity 
{
	constructor(id, owner, x, y, cX, cY, health)
	{
		super(id, x, y, cX, cY);
		this.img = game.add.sprite(x, y, 'spr_pirate_1');
		this.img.anchor.setTo(0.5, 0.5);
		this.img.width = 70;
		this.img.height = 40;
		this.x = x;
		this.y = y;
		this.health = health;
		this.fireTimer = this.curTime();
		this.owner = owner;
		pirates.set(this.id, this);
	}
	
	getHeading() 
	{
		var newDiff = 0;

		//Move directly toward the player until within a certain distance
		if(Math.hypot(this.x - player.x, this.y - player.y) < 200) {
			newDiff = -1;
		}
		else {
			newDiff = 1;
		}
		//Unit vector in current travel direction
		var Ux = Math.cos(this.img.rotation);
		var Uy = Math.sin(this.img.rotation);

		//Vector between ship and player
		//var Vx = player.img.x - this.img.x;
		//var Vy = player.img.y - this.img.y;
		var Vx = this.getRelX(player);
		var Vy = this.getRelY(player);
		
		//2D cross product determines left or right hand turn
		var crossProduct = Ux*Vy-Uy*Vx;

		var diffAngle = Math.atan2(Vy, Vx);
		if(isNaN(diffAngle)) {
			console.log("nan");
			diffAngle = 0;
		}

		if(crossProduct < 0) {
			this.img.angle -= newDiff;
		}

		else if(crossProduct > 0) {
			this.img.angle += newDiff;
		}

		if(this.hasElapsed(this.fireTimer, 2000)) {
			console.log('fire!');
			new Bullet(this.x, this.y, this.chunkX, this.chunkY, diffAngle);
			this.fireTimer = this.curTime();
		}
	}

	update() 
	{
		//Updates are only handled for entities this client owns
		if(this.owner - player.id > 0.01) { this.draw(); return; }
		if(Math.abs(this.chunkX - player.chunkX) > 2 || Math.abs(this.chunkY - player.chunkY) > 2) {
			this.kill(10000000);
			return;
		}

		this.getHeading();
		var dY = Math.sin(this.img.rotation) * 3;
		var dX = Math.cos(this.img.rotation) * 3;

		this.x += dX;
		this.y += dY;
		this.localX += dX;
		this.localY += dY;
		
		this.boundsCheck();
		this.draw();
	}

	JSONify() {
		var ret = Entity.prototype.JSONify.call(this);
		ret.rotation = this.img.rotation;
		ret.type = 'R';
		return ret;
	}


	modify(owner, x, y, chunkX, chunkY, health) {
		this.owner = owner; this.x = x; this.y = y; this.chunkX = chunkX; this.chunkY = chunkY; this.health = health;
	}


	kill(dmg) {
		this.health -= dmg;

		if(this.health <= 0) {
			gold += 20;
			this.img.destroy();
			pirates.delete(this.id);
		}
		killEntity(this.id);
	}
}

class Bullet extends Entity 
{
	constructor(x, y, cX, cY, theta) 
	{
		super(0, x, y, cX, cY);
		this.img = game.add.sprite(x, y, 'spr_bullet');
		this.img.anchor.setTo(0.5, 0.5);
		
		this.img.rotation = theta;
		bullets.set(this.id, this);
		this.wad = 0;
		this.draw();
	}

	update() 
	{

		if(this.wad++ > 200) { this.kill(); }
		var dY = Math.sin(this.img.rotation) * 3;
		var dX = Math.cos(this.img.rotation) * 3;

		this.x += dX;
		this.y += dY;
		this.localX += dX;
		this.localY += dY;	

		this.draw();

		if(Math.hypot(this.x - player.x, this.y - player.y) < 50) {
			player.health -= 5;
			this.kill();
		}
	}

	kill() {
		this.img.destroy();
		bullets.delete(this.id);
	}

	//TODO: send this bullet to the server to be spawned for all other clients
	// (see spawnBullets in network.js)
	spawn() {
		
	}
}

class PlayerMissile extends Entity {
	constructor(x, y, cX, cY, theta) {
		super(0, x, y, cX, cY, theta);
		this.img = game.add.sprite(x, y, 'spr_missile');
		this.img.anchor.setTo(0.5, 0.5);
		this.curTarget = 0;
			
		this.img.rotation = theta;
		bullets.set(this.id, this);
		this.wad = 0;
		this.draw();

		var iter = pirates.values();
		var curDist = Infinity;

		for(var cur of iter) {
			var temp = Math.hypot(this.x - cur.x, this.y - cur.y);
			if(temp < curDist) {
				curDist = temp;
				this.curTarget = cur.id;
			}
		}

		iter = bases.values();

		for(var cur of iter) {
			var temp = Math.hypot(this.x - cur.x, this.y - cur.y);
			if(temp < curDist) {
				curDist = temp;
				this.curTarget = cur.id;
			}
		}

		if(this.curTarget == 0) { console.log("couldn't find a target!");}
	}

	getHeading() 
	{
		var newDiff = 3;
		var target;
	
		if(bases.has(this.curTarget)) {
			target = bases.get(this.curTarget);
		}

		else if(pirates.has(this.curTarget)) {
			target = pirates.get(this.curTarget);
		}
		
		else {
			console.log("target lost!");
			this.kill();
			return;
		}

		if(Math.hypot(this.x - target.x, this.y - target.y) < 30) {
			this.kill();
			target.kill(200);
		}
		
		//Unit vector in current travel direction
		var Ux = Math.cos(this.img.rotation);
		var Uy = Math.sin(this.img.rotation);

		//Vector between ship and player
		//var Vx = player.img.x - this.img.x;
		//var Vy = player.img.y - this.img.y;
		var Vx = this.getRelX(target);
		var Vy = this.getRelY(target);
		
		//2D cross product determines left or right hand turn
		var crossProduct = Ux*Vy-Uy*Vx;

		var diffAngle = Math.atan2(Vy, Vx);
		if(isNaN(diffAngle)) {
			console.log("nan");
			diffAngle = 0;
		}

		if(crossProduct < 0) {
			this.img.angle -= newDiff;
		}

		else if(crossProduct > 0) {
			this.img.angle += newDiff;
		}
	}

	update() 
	{
		this.getHeading();
		var dY = Math.sin(this.img.rotation) * 8;
		var dX = Math.cos(this.img.rotation) * 8;

		this.x += dX;
		this.y += dY;
		this.localX += dX;
		this.localY += dY;
		
		this.boundsCheck();
		this.draw();
	}



	kill() {
		bullets.delete(this.id);
		this.img.destroy();
	}
}

class PlayerBullet extends Entity
{

	constructor(x, y, cX, cY, theta) 
	{
		super(0, x, y, cX, cY);
		this.img = game.add.sprite(x, y, 'spr_bullet');
		this.img.anchor.setTo(0.5, 0.5);
		
		this.img.rotation = theta;
		bullets.set(this.id, this);
		this.wad = 0;
		this.draw();
	}


	update() {

		if(this.wad++ > 200) { this.kill(); }
		var dY = Math.sin(this.img.rotation) * 15;
		var dX = Math.cos(this.img.rotation) * 15;

		this.x += dX;
		this.y += dY;
		this.localX += dX;
		this.localY += dY;	

		var xx = this.x;
		var yy = this.y;
		this.draw();
		var good = true;

		var iter = pirates.values();

		for (var value of iter) {

			if(Math.hypot(value.x - xx, value.y - yy) < 50) {
				console.log("got one");
				value.kill(20);
				killEntity(value.id);
				good = false;
				break;
			}
		}

		if(!good) {
			this.kill();
		} else {
			var it = bases.values();
		
			for (var value of it) {
				if(Math.hypot(value.x - xx, value.y - yy) < 80) {
					console.log("got one");
					value.kill(20);
					killEntity(value.id);
					good = false;
					break;
				}		
			}
			if(!good) {
				this.kill();
			}
		}
	}

	kill() {
		this.img.destroy();
		bullets.delete(this.id);
	}
}
