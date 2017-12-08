//Server sync functions

var player;
var socket;

// Send a request to the server to remove the entity of the given id
function killEntity(id) {
	socket.emit("kill_entity", id);
}

// Request the 3x3 grid of chunks surrounding the chunk at the given coordinates
function getSurrounding() {
	var lis = [player.chunkX, player.chunkY];
	socket.emit('req_chunks', lis);
}

//Callback function to be called when a 'send_chunks' message is received
var receiveChunks = function(msg) {
	if(Array.isArray(msg)) {
		for(var i = 0; i < msg.length; i++) {

			// Received entity controlled by other client
			if(msg[i].owner - player.id > 0.01 ) {
				setEntity(msg[i]);
			}
			
			// You have just acquired an existing entity from the server
			else {
				setEntity(msg[i]);
			}
		}
		if(msg.length == 0) {
		}
	}
	else {
		console.log('not an array!');
	}
}

//TODO: calback function that handles a 'send_bullets' and spawns the new bullets client-side
var receiveBullets = function(msg) {
	
}

// Given a database row, update the world to include the new entity
var setEntity = function(ent) {
	if(Math.abs(player.id - ent.id) < 0.001) { return; }
	var iter = otherPlayers.values();
	if(ent.type == "P") {
		console.log("other player id: ", ent.id, " my id: ", player.id);
		
		var P;
		//console.log("player!");

		if(otherPlayers.has(ent.id) ) {
			//console.log("update player at x: ", ent.x, " y: ", ent.y, " cx: ", ent.chunkX, " cy: ", ent.chunkY);
			P = otherPlayers.get(ent.id);
			P.modify(ent.x, ent.y, ent.chunkX, ent.chunkY, ent.rotation);
		} else {
			//console.log("new player: ", ent.id);
			P = new OtherPlayer(ent.type, ent.id, ent.x, ent.y, ent.chunkX, ent.chunkY);
		}
		
		otherPlayers.set(ent.id, P);
	}

	else if(ent.type == "R") {
		var P = pirates.get(ent.id);
		if(P === undefined) {
			P = new Pirate(ent.id, ent.owner, ent.x, ent.y, ent.columnID, ent.rowID, ent.health)
		} 
		//The received entity is not owned by us
		else if(Math.abs(ent.owner - player.id) > 0.01) {
			//console.log("update pirate with owner: ", ent.owner);
			//console.log("player id = ", player.id);
			P.modify(ent.owner, ent.x, ent.y, ent.columnID, ent.rowID, ent.health);
			pirates.set(P.id, P);
		}
		//The received entity IS owned by us, but the player doesn't know it yet
		else if( Math.abs(P.owner - player.id) > 0.01) {
			P.owner = ent.owner;
			pirates.set(P.id, P);
		}
	}

	else if(ent.type == "B") {
		if(bases.has(ent.id)) {
			//if(ent.health < bases.get(ent.id).health) {
			//	var B = bases.get(ent.id);
			//	B.health = ent.health;
			//	bases.set(B.id, B);
			//}
		} else {
			console.log("new base!");
			var newBase = new Base(ent.id, ent.x, ent.y, ent.columnID, ent.rowID, ent.health);
		}
	}

	else if(ent.type == "F") {
		
	}
}

//TODO: store the player's current postion and state on the server
function storePlayer() {
	socket.emit('update_player', player.JSONify());
}

//TODO: update the list of entites on the server
function updateChildren() {
	var outBox = [];

	//Push the new values for every owned pirate onto the outbox
	pirates.forEach(function(value, key, map) {
		if(value.owner - player.id < 0.01) {
			outBox.push(value.JSONify());
		}
	});

	outBox.push(player.JSONify());
	//console.log("sending " + outBox.length+ " entities for update");
	//console.log("out of " + pirates.size);

	//Send an array containing all owned pirates and the player
	socket.emit('update_chunks', outBox);
}

//TODO: send a list of "smart" entities to the server to be 
function spawn(list) {
	
}

//Send a list of "dumb" entities to the server to forward to other clients
function spawnBullets(list) {
	socket.emit('spawn_bullets', list);
}
