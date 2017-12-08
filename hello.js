#!/usr/bin/env nodejs
var http = require('http');
var fs = require('fs');
var mysql = require('mysql');


var totalEntities = 0;

//State information for players
var players = new Map();

//Last check-in for players
var timeouts = new Map();

//Players that fail to update within the interval will be removed from the world
const TIMEOUT_INTERVAL = 3000;

var con;

//Send a file
var sendIndex = function(path, res) {
	var fullPath = String('.' + path);
	fs.readFile(fullPath, function(err, data) {
		if(err) {
			send404(res);
			return;
		}
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(data);
		res.end();
  });
}

var sendStat = function(res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write("Total players: " + players.size);
	res.write("Total entities: " + totalEntities);
	res.end();
}

//Send a 404 response
var send404 = function(res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end('404 :(');
}

// Remove the entity of the given id from the database
var killEntity = function(id) {
	con.query("DELETE FROM entities WHERE id='" + id + "';");
}

// Promise function to get the given chunk and the 3x3 surrounding it from the DB
var getChunk = function(x, y) {
	//Query the database for all entities with chunk indices x, y
	var ret = 4;
	return new Promise(function(resolve, reject) {
	var req =	"SELECT * FROM entities WHERE columnID>='" + (x-1);
	req += 		"' AND columnID<='"+ (x+1) + "' AND rowID>='" + (y-1);
	req +=		"' AND rowID<='" + (y+1) + "';";
		con.query(req, function(err, result) {
				if(err) {throw err;}
				resolve(result);
			});
	});
}

// Get the chunk and surroundings from the database and return to the requestor
var getChunks = function(x, y, socket) {
	var ret = [];
	
	var cur = getChunk(x, y);

	cur.then(function(result) {

		players.forEach(function(value, key, map) {
			result.push(value);
		});

		if(result.length > 0)
		{
			console.log("send ", result.length, " entities to the client");
			socket.emit('send_chunks', result);
			ret.push(result);
		}
	}, function(err) {console.log(err);} );
}

//Update the given player
var updatePlayer = function(p) {
	players.set(p.id, p);
	timeouts.set(p.id, Date.now());
}

// Get all entities in the database and reassign ownership based on who is closest,
// only needs to be done every few seconds or so
var shuffleOwnership = function() {
	// Check each object against each player, setting owner id to the id of the nearest player
	var ents = con.query("SELECT * FROM entities", function(err, result, fields) {
		console.log("shuffling ", result.length, " entities");
		if(err) { throw err; }
		totalEntities = result.length;
		
		for(var i = 0; i < result.length; i++) {
			var curEnt = result[i];
			var curDist = Infinity;
			var newOwner = curEnt.id;
			//Check each entity against each player and set owner as the nearest player
			players.forEach(function(value, key, map) {
				//Check 
	
				if(i == 0) {console.log("check player: ", value.id);}
				var dist = Math.hypot(value.x - curEnt.x, value.y - curEnt.y);
				if(dist < curDist && Math.abs(value.chunkX - curEnt.columnID) <= 2 &&
					Math.abs(value.chunkY - curEnt.rowID) <= 2) {
					newOwner = value.id;
					curDist = dist;
				}
			});
			if(Math.abs(newOwner - curEnt.owner) > 0.01) {
				console.log("player ", newOwner, " takes entity ", curEnt.id, " from: ", curEnt.owner);
			}
			else {
				console.log("player ", newOwner, " retains entity ", curEnt.id);
			}
			
			var updateQuery  = "UPDATE entities SET owner='" + newOwner;
					updateQuery += "' WHERE id=" + curEnt.id + ";"
			//console.log(updateQuery);
			con.query(updateQuery, function(er, res, fi) {
				if(er) { throw er; }
			});
		}
	});
}

//TODO: remove players who have disconnected
var cullAfks = function() {
	players.forEach(function(value, key, map) {
		if( (Date.now() - timeouts.get(value.id)) > TIMEOUT_INTERVAL) {
			players.delete(value.id);
			timeouts.delete(value.id);
			console.log("player with id: ", value.id, " timed out");
		}
	});
}

//Spawn a pirate in a random chunk at a random x and y
var spawnPirate = function(x, y) {
	var queryBegin = "INSERT INTO entities (x, y, columnID, rowID, owner, type, health) VALUES (";
	var minX = 300;
	var maxX = 700;
	var minXChunk = x - 1;
	var maxXChunk = x + 1;
	var minYChunk = y - 1;
	var maxYChunk = y + 1;

	var xChunk = Math.round(Math.random() * (maxXChunk - minXChunk) + minXChunk);
	var yChunk = Math.round(Math.random() * (maxYChunk - minYChunk) + minYChunk);
	var xPos   = Math.random() * (maxX - minX) + minX;
	var yPos   = Math.random() * (maxX - minX) + minX;

	queryBegin += xPos;
	queryBegin += ",";
	queryBegin += yPos;
	queryBegin += ",";
	queryBegin += xChunk;
	queryBegin += ",";
	queryBegin += yChunk;
	queryBegin += ",";
	queryBegin += "12";
	queryBegin += ",";
	queryBegin += "'R', 100);";

	con.query(queryBegin, function(err, result, fields) {
		if(err) { throw err; }
		//console.log("Stored new pirate: ", queryBegin);
		//console.log(result);
	});
}

//Spawn a pirate in a random chunk at a random x and y
var spawnBase = function(x, y) {
	var queryBegin = "INSERT INTO entities (x, y, columnID, rowID, owner, type, health) VALUES (";
	var minX = 0;
	var maxX = 500;
	var minXChunk = x - 1;
	var maxXChunk = x + 1;
	var minYChunk = y - 1;
	var maxYChunk = y + 1;

	var xChunk = Math.round(Math.random() * (maxXChunk - minXChunk) + minXChunk);
	var yChunk = Math.round(Math.random() * (maxYChunk - minYChunk) + minYChunk);

	var xPos   = Math.random() * (maxX - minX) + minX;
	var yPos   = Math.random() * (maxX - minX) + minX;

	queryBegin += xPos;
	queryBegin += ",";
	queryBegin += yPos;
	queryBegin += ",";
	queryBegin += xChunk;
	queryBegin += ",";
	queryBegin += yChunk;
	queryBegin += ",";
	queryBegin += "12";
	queryBegin += ",";
	queryBegin += "'B', 100);";

	con.query(queryBegin, function(err, result, fields) {
		if(err) { throw err; }
		//console.log("Stored new pirate: ", queryBegin);
		//console.log(result);
	});
}

var spawnPirates = function() {
	var iter = players.values();

	for(var cur of iter) {
		spawnPirate(cur.chunkX, cur.chunkY);
	}
}

var spawnBases = function() {
	var iter = players.values();

	for(var cur of iter) {
		spawnBase(cur.chunkX, cur.chunkY);
	}
}


//TODO: store the given entities in the database from list sent by client
var updateEntities = function(list) {
	console.log("updating ", list.length, " entities");

	for(var i = 0; i < list.length; i++) {
		var curEnt = list[i];
		if(curEnt.type == "R") {
			var queryBegin = "UPDATE entities SET x="+curEnt.x+", y="+curEnt.y+", columnID="
			queryBegin += curEnt.chunkX + ", rowID="+ curEnt.chunkY;
			queryBegin += " WHERE id=" + curEnt.id + ";";
			//console.log(queryBegin);
			
			con.query(queryBegin, function(err, result, fields) {
				//console.log(queryBegin);
				if(err) { throw err; }
			});
		}

		else if(curEnt.type == "P") {
			//TODO: store state info in the map
			updatePlayer(curEnt);
		}
	}
	//console.log("received ", list.length, " entities to update");
}

//TODO: receive a list of bullets from the client and broadcast to all other nearby clients
var spawnBullets = function(list, socket) {
	
}

//TODO: MySQL wrapper function, store an entity in the database
var storeEntity = function() {

}

con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "cs252bm",
	database: "game"
});

con.connect(function(err) {
	if(err) throw err;

	con.query("SELECT * FROM entities", function(err, result, fields) {
		if(err) throw err;
	});
});

var server = http.createServer(function (req, res) {
	if(req.url == '/hellophaser') {
		console.log('why are we still here?');
		sendIndex('/index.html', res);
	}

	else if(req.url == "/stat") {
		sendStat(res);
	}
	
	else  {
		console.log('else: ' + req.url);
		sendIndex(req.url, res);
	}

}).listen(8080, 'localhost');


//Set ownership of ships in database to be shuffled every 2.5 seconds
setInterval(shuffleOwnership, 2500);

//Set repeating interval to remove afks
setInterval(cullAfks, TIMEOUT_INTERVAL);

setInterval(spawnPirates, 5000);
setInterval(spawnBases, 10000);

//Socket functions below
var io = require('socket.io')(server);
console.log('Server running at http://localhost:8080/');

io.on('connection', function(socket) {
	//Return the contents of surrounding chunks to the client
	socket.on('req_chunks', function(msg) {
		if(Array.isArray(msg)) {
			chunk = getChunks(msg[0], msg[1], socket);
		}
		else {
			socket.send('bad request, type should be int[2]');
		}
	});

	//Update/store the entities in the database
	socket.on('update_chunks', function(msg) {
		if(Array.isArray(msg)) {
			updateEntities(msg);
		}
		else(console.log("bad chunk update, should be array but is ", typeof msg));
	});

	//Kill the given entity
	socket.on('kill_entity', function(msg) {
		console.log('kill entity');
		killEntity(msg);
	});

	//Receive and retransmit the given list of bullets to all players
	socket.on('spawn_bullets', function(msg) {
		console.log('spawn bullets');
		spawnBullets(msg, socket);
	});
});
