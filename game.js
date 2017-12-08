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
	var gold = 10000000000000;
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

	var menuOpen = false;

	var upgradeScreen;
	//Upgrade Screen Buttons
	var upgradeShipSpeedButton;
	var upgradeHullButton;
	var upgradeMGDamageButton;
	var upgradeMGSpeedButton;
	var upgradeSGSpeedButton;
	var upgradeSGDamageButton;
	var upgradeSGCountButton;
	var upgradeMissileSpeedButton;
	var upgradeMissileTurnButton;

	//Upgrade Screen Labels
	var upgradeText;
	var goldText;
	var upgradeShipSpeedLabel;
	var upgradeHullLabel;
	var upgradeMGDamageLabel;
	var upgradeMGSpeedLabel;
	var upgradeSGSpeedLabel;
	var upgradeSGDamageLabel;
	var upgradeSGCountLabel;
	var upgradeMissileSpeedLabel;
	var upgradeMissileTurnLabel;

	//Ship Parameters
	var hullLevel = 1;
	var speedLevel = 1;
	var MGDamageLevel = 1;
	var MGSpeedLevel = 1;
	var SGDamageLevel = 1;
	var SGCountLevel = 1;
	var SGSpeedLevel = 1;
	var missileSpeedLevel = 1;
	var missileTurnLevel = 1;

	//Upgrade menu event handlers
	function upgradeShipSpeed() {
		if(gold < speedLevel * 50) { return; }
		gold -= speedLevel * 50;
		speedLevel++;
		updateMenu();
	}

	function upgradeHull() {
		if(gold < hullLevel * 50) { return; }
		gold -= hullLevel * 50;
		player.health = ((++hullLevel) * 50) + 100;
		updateMenu();
	}
	function upgradeMGDamage() {
		if(gold < MGDamageLevel* 50) { return; }
		gold -= MGDamageLevel* 50;
		MGDamageLevel++;
		updateMenu();
	}
	function upgradeMGSpeed() {
		if(gold < MGSpeedLevel * 50) { return; }
		gold -= MGSpeedLevel * 50;
		MGSpeedLevel++;
		updateMenu();
	}
	function upgradeSGSpeed() {
		if(gold < SGSpeedLevel* 50) { return; }
		gold -= SGSpeedLevel * 50;
		SGSpeedLevel++;
		updateMenu();
	}
	function upgradeSGDamage() {
		if(gold < SGDamageLevel * 50) { return; }
		gold -= SGDamageLevel * 50;
		SGDamageLevel++;
		updateMenu();
	}
	function upgradeSGCount() {
		if(gold < SGCountLevel * 50) { return; }
		gold -= SGCountLevel * 50;
		SGCountLevel++;
		updateMenu();
	}
	function upgradeMissileSpeed() {
		if(gold < missileSpeedLevel * 50) { return; }
		gold -= missileSpeedLevel* 50;
		missileSpeedLevel++;
		updateMenu();
	}
	function upgradeMissileTurn() {
		if(gold < missileTurnLevel* 50) { return; }
		gold -= missileTurnLevel * 50;
		missileTurnLevel++;
		updateMenu();
	}
	
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

		game.load.image('spr_plus', 'spr_plus.png');
		game.load.image('spr_menu', 'spr_menu.png');
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
		game.load.image('ico_shotgun', 'ico_shotgun.png');
		game.load.image('ico_shotgun_faded', 'ico_shotgun_faded.png');
		game.load.image('ico_machinegun', 'ico_machinegun.png');
		game.load.image('ico_machinegun_faded', 'ico_machinegun_faded.png');
		game.load.image('ico_missile', 'ico_missile.png');
		game.load.image('ico_missile_faded', 'ico_missile_faded.png');
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
		ownerInfo= game.add.text(20, 80, "Health: " , { fill : "#ff0000"});
		coords.addColor("#ff0000", 0);
		//idDisplay = game.add.text(20, 40, "ID: " + player.id, { fill: "#ff0000"});
		//ownerInfo= game.add.text(20, 80, "My Bullets: ", { fill : "#ff0000"});
		
		SG_Ico_1 = game.add.sprite(25, game.world.height - 50, 'ico_shotgun');
		SG_Ico_2 = game.add.sprite(25, game.world.height - 50, 'ico_shotgun_faded');
		MG_Ico_1 = game.add.sprite(75, game.world.height - 50, 'ico_machinegun');
		MG_Ico_2 = game.add.sprite(75, game.world.height - 50, 'ico_machinegun_faded');
		MS_Ico_1 = game.add.sprite(125, game.world.height - 50, 'ico_missile');
		MS_Ico_2 = game.add.sprite(125, game.world.height - 50, 'ico_missile_faded');

		SG_Ico_1.alpha = 1;
		SG_Ico_2.alpha = 0;
		MG_Ico_1.alpha = 0;
		MG_Ico_2.alpha = 1;
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

	function createMenu() {
		player.img.alpha = 0;
		upgradeMenu = game.add.sprite(0, 0, "spr_menu");
	
		upgradeShipSpeedButton  = game.add.button(40, 160, "spr_plus");
		upgradeHullButton  = game.add.button(40, 190,  "spr_plus");
		upgradeMGDamageButton = game.add.button(40, 220, "spr_plus");
		upgradeMGSpeedButton  = game.add.button(40, 250, "spr_plus");
		upgradeSGSpeedButton   = game.add.button(40, 280, "spr_plus");
		upgradeSGDamageButton  = game.add.button(40, 310, "spr_plus");
		upgradeSGCountButton  = game.add.button(40, 340, "spr_plus");
		upgradeMissileSpeedButton  = game.add.button(40, 370, "spr_plus");
		upgradeMissileTurnButton  = game.add.button(40, 400, "spr_plus");

		upgradeLabel 			= game.add.text(40, 20, "Upgrades Available:", {fontSize:40});
		goldText 				= game.add.text(90, 65, "Gold: " + gold);
		upgradeShipSpeedLabel 	= game.add.text(70, 160, "Ship Speed: " + speedLevel);
		upgradeHullLabel		= game.add.text(70, 190, "Hull Integrity: " + hullLevel);
		upgradeMGDamageLabel	= game.add.text(70, 220, "Machine Gun Damage: " + MGDamageLevel);
		upgradeMGSpeedLabel		= game.add.text(70, 250, "Machine Gun Firing Rate: " + MGSpeedLevel);
		upgradeSGSpeedLabel		= game.add.text(70, 280, "Shotgun Firing Rate: " + SGSpeedLevel);
		upgradeSGDamageLabel	= game.add.text(70, 310, "Shotgun Damage: " + SGDamageLevel);
		upgradeSGCountLabel		= game.add.text(70, 340, "Shotgun Bullet Count: " + SGCountLevel);
		upgradeMissileSpeedLabel= game.add.text(70, 370, "Missile Flight Speed: " + missileSpeedLevel);
		upgradeMissileTurnLabel	= game.add.text(70, 400, "Missile Turning Rate: " + missileTurnLevel);


		upgradeHullButton.onInputUp.add(upgradeHull, this);
		upgradeShipSpeedButton.onInputUp.add(upgradeShipSpeed, this);
		upgradeMGSpeedButton.onInputUp.add(upgradeMGSpeed, this);
		upgradeMGDamageButton.onInputUp.add(upgradeMGDamage, this);
		upgradeSGSpeedButton.onInputUp.add(upgradeSGSpeed, this);
		upgradeSGCountButton.onInputUp.add(upgradeSGCount, this);
		upgradeSGDamageButton.onInputUp.add(upgradeSGDamage, this);
		upgradeMissileSpeedButton.onInputUp.add(upgradeMissileSpeed, this);
		upgradeMissileTurnButton.onInputUp.add(upgradeMissileTurn, this);
	}

	function destroyMenu() {
		player.img.alpha = 1;
		upgradeMenu.destroy();
		upgradeShipSpeedButton.destroy();
		upgradeHullButton.destroy();
		upgradeMGDamageButton.destroy();
		upgradeMGSpeedButton.destroy();
		upgradeSGSpeedButton.destroy();
		upgradeSGDamageButton.destroy();
		upgradeSGCountButton.destroy();
		upgradeMissileSpeedButton.destroy();;
		upgradeMissileTurnButton.destroy();

		//Upgrade Screen Labels
		upgradeLabel.destroy();
		goldText.destroy();
		upgradeShipSpeedLabel.destroy();
		upgradeHullLabel.destroy();
		upgradeMGDamageLabel.destroy();
		upgradeMGSpeedLabel.destroy();
		upgradeSGSpeedLabel.destroy();
		upgradeSGDamageLabel.destroy();
		upgradeSGCountLabel.destroy();
		upgradeMissileSpeedLabel.destroy();
		upgradeMissileTurnLabel.destroy();
	}

	function updateMenu() {
		goldText.setText("Gold: " + gold);
		upgradeShipSpeedLabel.setText("Ship Speed: " + speedLevel);
		upgradeHullLabel.setText("Hull Integrity: " + hullLevel);
		upgradeMGDamageLabel.setText("Machine Gun Damage: " + MGDamageLevel);
		upgradeMGSpeedLabel.setText("Machine Gun Firing Rate: " + MGSpeedLevel);
		upgradeSGSpeedLabel.setText("Shotgun Firing Rate: " + SGSpeedLevel);
		upgradeSGDamageLabel.setText("Shotgun Damage: " + SGDamageLevel);
		upgradeSGCountLabel.setText("Shotgun Bullet Count: " + SGCountLevel);
		upgradeMissileSpeedLabel.setText("Missile Flight Speed: " + missileSpeedLevel);
		upgradeMissileTurnLabel.setText("Missile Turning Rate: " + missileTurnLevel);
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
			if( player.speed > -5 - (speedLevel )) {
				player.speed -= 1;
			}
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
			if(player.speed < 10 + (speedLevel * 2)) {
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

		if(game.input.keyboard.isDown(Phaser.Keyboard.Q)) {
			if(!menuOpen) {
				createMenu();
				menuOpen = true;
			}
		}

		if(game.input.keyboard.isDown(Phaser.Keyboard.A)) {
			if(menuOpen) {
				destroyMenu();
				menuOpen = false;
			}
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
			//console.log("others: " + otherPlayers.size);
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

		ownerInfo.setText("Health: " + player.health);
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



