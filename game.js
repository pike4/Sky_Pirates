//Client script, run by every player in browser
	var dead = false;

	var logo;
	var pirates = new Map();
	var otherPlayers = new Map();
	var bullets = new Map();
	var playerBullets = new Map();
	var bases = new Map();
	var bulletOutBox = [];
	var player;
	var speed = 0;
	var gold = 0;
	var game;
	var coords;
	var loginText;
	var loginText2;
	var needsLogin;
	var hasUsername;
	var usernameText;
	var username;
	var passwordText;
	var idDisplay;
	var ownerInfo;
	var owned;
	var totalEnts;
	var myBullets;
	var goldText;

	//Player weapon icon sprite objects
	var MG_Ico_1;
	var MG_Ico_2;
	var SG_Ico_1;
	var SG_Ico_2;
	var MS_Ico_1;
	var MS_Ico_2;

	const SHOTGUN = 1;
	const MACHINE_GUN = 2;
	const MISSILE = 3;

	function preload () {
		//REMOVE THE WHITE BORDER FROM THESE IMAGES, REPLACE WITH TRANSPARENT
		game.load.image('logo', 'phaser.png');
		game.load.image('spr_player_1', 'spr_player_1.png');
		game.load.image('spr_pirate_1', 'spr_pirate_1.png');
		game.load.image('spr_pirate_2', 'spr_pirate_2.png');
		game.load.image('spr_base_1', 'spr_base_1.png');
		game.load.image('spr_base_2', 'spr_base_2.png');
		game.load.image('spr_shop', 'spr_shop.png');
		game.load.image('spr_bullet', 'spr_bullet.png');
		game.load.image('spr_missile', 'spr_missile.png');

		//IMPLEMENT THESE PLS
		game.add.image('ico_shotgun', 'ico_shotgun.png');
		game.add.image('ico_shotgun_faded', 'ico_shotgun_faded.png');
		game.add.image('ico_machinegun', 'ico_machinegun.png');
		game.add.image('ico_machinegun_faded', 'ico_machinegun_faded.png');
		game.add.image('ico_missile', 'ico_missile.png');
		game.add.image('ico_missile_faded', 'ico_missile_faded.png');
	}

	function create () {
		// logo = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
		// logo.anchor.setTo(0.5, 0.5);

				needsLogin = true;
		username = "";
		game.input.keyboard.addCallbacks(this, null, null, insertChar);

		socket = io('http://138.197.91.94');		
								 
		socket.on('send_chunks', function(msg) { receiveChunks(msg); } );

		player = new Player(0, game.world.centerX, game.world.centerY, 5, 5);
		
		coords =    game.add.text(20, 20, "x: y: ");
		coords.addColor("#ff0000", 0);
		//idDisplay = game.add.text(20, 40, "ID: " + player.id, { fill: "#ff0000"});
		ownerInfo= game.add.text(20, 80, "My Bullets: ", { fill : "#ff0000"});
		goldText = game.add.text(20, 100, "Gold: ", { fill : "#ff0000"});
		
		
		SG_Ico_1 = game.add.sprite(100, game.world.height - 100, 'ico_shotgun');
		SG_Ico_2 = game.add.sprite(100, game.world.height - 100, 'ico_shotgun_faded');
		//SG_Ico_2.width = 1000;
		MG_Ico_1 = game.add.sprite(150, game.world.height - 100, 'ico_machinegun');
		MG_Ico_2 = game.add.sprite(150, game.world.height - 100, 'ico_machinegun_faded');
		MS_Ico_1 = game.add.sprite(200, game.world.height - 100, 'ico_missile');
		MS_Ico_2 = game.add.sprite(200, game.world.height - 100, 'ico_missile_faded');

		MG_Ico_1.alpha = 1;
		MG_Ico_2.alpha = 0;
		SG_Ico_1.alpha = 0;
		SG_Ico_2.alpha = 1;
		MS_Ico_1.alpha = 0;
		MS_Ico_2.alpha = 1;
		game.stage.backgroundColor = "#4488AA";

		setInterval(getSurrounding, 250);
		setInterval(updateChildren, 250);
		setInterval(storePlayer, 250);
	}

	function selectWeapon(weapon) {
		player.curWeapon = weapon;
		
		MG_Ico_1.alpha = 0;
		MG_Ico_2.alpha = 1;
		SG_Ico_1.alpha = 0;
		SG_Ico_2.alpha = 1;
		MS_Ico_1.alpha = 0;
		MS_Ico_2.alpha = 1;
		
		if(weapon == SHOTGUN) {
			SG_Ico_1.alpha = 1;
			SG_Ico_2.alpha = 0;
		}

		else if(weapon == MACHINE_GUN) {
			MG_Ico_1.alpha = 1;
			MG_Ico_2.alpha = 0;
		}

		else if(weapon == MISSILE) {
			MS_Ico_1.alpha = 1;
			MS_Ico_2.alpha = 0;
		}
	}


	//Get keyboard input and update player accordingly
	function controls() 
	{
		if(dead) { return; }
		if(game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
			player.img.angle-= 3;
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
			player.img.angle+= 3;
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
			if( player.speed > -10) {
				player.speed -= 1;
			}
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
			if(player.speed < 10) {
			player.speed += 1;
			}
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.E)) { 
			player.fire();
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.ONE)) { 
			selectWeapon(SHOTGUN);
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.TWO)) { 
			selectWeapon(MACHINE_GUN);
		}
		
		if(game.input.keyboard.isDown(Phaser.Keyboard.THREE)) { 
			selectWeapon(MISSILE);
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
			player.speed = 0;
		}
	}

	function updateOtherPlayer(player) {
	//TODO: update another player from the network
	}

	function update() {
		owned = 0;
		totalEnts = 0;
		controls();
		player.update();
		
		if (needsLogin) {
			askForLogin();
		}

	
		//Update pirates, other players, and bullets
		pirates.forEach(function(value, key, map) {
			value.update();

			if(value.owner - player.id < 0.01) { 
				owned++;
			}
			totalEnts++;
		});

		otherPlayers.forEach(function(value, key, map) {
			value.update();
		});

		bullets.forEach(function(value, key, map) {
			value.update();
		});

		playerBullets.forEach(function(value, key, map) {
			value.update();
		});


		bases.forEach(function(value, key, map) {
			value.update();
		});

		//z-indexing for weapon icons
		game.world.bringToTop(MG_Ico_1);
		game.world.bringToTop(MG_Ico_2);
		game.world.bringToTop(SG_Ico_1);
		game.world.bringToTop(SG_Ico_2);
		game.world.bringToTop(MS_Ico_1);
		game.world.bringToTop(MS_Ico_2);
		game.world.bringToTop(player.img);

		ownerInfo.setText("Owned: "+ owned+ " total: "+ totalEnts);
		goldText.setText("Gold: " + gold);
	}

	function askForLogin() {
		//loginText = game.add.text(game.world.width/2, game.world.height/2+30, "Enter Username");
		//loginText.addColor("#ffffff", 0);
		//var newChar = game.keyboard.lastChar();
		//usernameText = game.add
	}

	function insertChar(c) {
		username += c;	
	}



