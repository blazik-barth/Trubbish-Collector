
let canvas;
let context;
let player;
let gameObjects;
let score = 0;
let name;

window.onload = titleScreen;

let secondsPassed = 0;
let oldTimeStamp = 0;

let moveX = 50;
let moveY = 30;

const img = new Image();
img.src="images/pokeball.png";

var db = new Dexie("ScoreData");
db.version(1).stores({
	scores: `
 		name,
	 	score`,
})

db.scores.toArray()
.then(arr => {
	let ul = document.createElement("ul");
	arr.forEach(score => {
		let node = document.createTextNode(score.name + ": " + score.score + " points\n");
		let li = document.createElement("li");
		li.appendChild(node);
		ul.appendChild(li);
	});
	document.querySelector("#high-scores").append(ul);
});

class GameObject
	{
		constructor(context, image_src, x, y, width, vx = 0, vy = 0) {
			this.context = context;
			this.image = new Image();
			this.image.src = image_src;
			this.x = x;
			this.y = y;
			this.vx = vx;
			this.vy = vy;
			this.width = width;
			this.height = width;
			
			this.canvas = this.context.canvas;
			this.radius = this.width / 2;
			this.centerX = this.x + this.radius;
			this.centerY = this.y + this.radius;
			
		}

		draw() {
			this.context.drawImage(this.image, this.x, this.y, this.width, this.height);
		}

		updateCoords(secondsPassed) {
			this.x += (this.vx * secondsPassed);
			this.y += (this.vy * secondsPassed);
	
			if (this.x < 0 && this.vx < 0) {
				this.vx *= -1;
				this.x = 0;
			} else if ((this.x + this.width) > this.canvas.width && this.vx > 0) {
				this.vx *= -1;
				this.x = this.canvas.width - this.width;
			}
			if (this.y < 0 && this.vy < 0) {
				this.vy *= -1;
				this.y = 0;
			} else if ((this.y + this.height) > this.canvas.height && this.vy > 0) {
				this.vy *= -1;
				this.y = this.canvas.height - this.height;
			}

			this.centerX = this.x + this.radius;
			this.centerY = this.y + this.radius;
		}
	}

class BenefitObject extends GameObject {
	constructor(context, x, y, width, points, vx = 0, vy = 0) {
		super(context, "images/trubbish.png", x, y, width, vx, vy);
		this.points = points;
	}
}

class HarmObject extends GameObject {
	constructor(context, x, y, width, vx = 0, vy = 0) {
		super(context, "images/yungoos.png", x, y, width, vx, vy);
		this.points = -1;
	}
}

class Player extends GameObject {
	constructor(context, x, y, width, height) {
		super(context, "images/pokeball.png", x, y, width, height);
		this.changeX = true;
		this.changeY = true;
		this.lives = 4;
	}
}

function titleScreen() {
	canvas = document.getElementById('game-canvas');
	context = canvas.getContext('2d');

	context.fillStyle = "black";
	context.font = "30px Roboto Condensed";
	context.fillText("Click the canvas to start!", 100, 235)

	canvas.addEventListener("click", (e) => {init();});
}
function init() {
	canvas = document.getElementById('game-canvas');
	context = canvas.getContext('2d');

	player = new Player(context, 225, 225, 50)

	gameObjects = [
		new BenefitObject(context, 100, 100, 50, 1),
		new BenefitObject(context, 300, 400, 50, 1),
		new HarmObject(context, 350, 350, 50, 50, 25),
		new HarmObject(context, 100, 200, 50, 10, -30),
		new HarmObject(context, 400, 50, 50, 0, 40),
	]

	gameObjects.forEach(obj => {
		obj.draw();
	});

	document.addEventListener('keydown', (e) => {
		switch(e.key) {
			case "w":
			case "ArrowUp":
				if (player.vy >= -150) {
					player.vy -= 20;
					player.changeY = false;
				}
				break;
			case "s":
			case "ArrowDown":
				if (player.vy <= 150) {
					player.vy += 20;
					player.changeY = false;
				}
				break;
			case "d":
			case "ArrowRight":
				if (player.vx <= 150) {
					player.vx += 20;
					player.changeX = false;
				}
				break;
			case "a":
			case "ArrowLeft":
				if (player.vx >= -150) {
					player.vx -= 20;
					player.changeX = false;
				}
		}
	});

	document.addEventListener('keyup', (e) => {
		switch(e.key) {
			case "w":
			case "ArrowUp":
			case "s":
			case "ArrowDown":
				player.changeY = true;
				break;
			case "d":
			case "ArrowRight":
			case "a":
			case "ArrowLeft":
				player.changeX = true;
				break;
		}
	});

	window.requestAnimationFrame(gameLoop);
}

function gameLoop(timeStamp) {
	secondsPassed = (timeStamp - oldTimeStamp) / 1000;
	oldTimeStamp = timeStamp;
	
	context.clearRect(0, 0, canvas.width, canvas.height);

	player.updateCoords(secondsPassed);

	friction(player);
	
	context.fillStyle='#FFFFFF';
	player.draw();
	gameObjects.forEach(obj => {
		obj.updateCoords(secondsPassed);
		obj.draw();
	});

	handleCollisions(gameObjects);

	context.fillStyle = "black";
	context.font = "30px Roboto Condensed";
	context.fillText("Lives: " + player.lives, 5, 35);
	context.fillText("Score: " + score, 5, 495);

	if (player.lives <= 0) {
		gameOver(context);
	}
	else window.requestAnimationFrame(gameLoop);
	
}

function isColliding(obj1, obj2) {

	const x = obj1.centerX - obj2.centerX;
	const y = obj1.centerY - obj2.centerY;

	const dist = Math.sqrt (x*x + y*y);

	return (dist <= obj1.radius + obj2.radius);
}

function friction(player) {
	if (player.changeY) {	
		if (player.vy <= 5 && player.vy >= -5)
			player.vy = 0;
		else {
			if (player.vy > 0) {
				player.vy -= 5;
			} else {
				player.vy += 5;
			}
		}
	}
	if (player.changeX) {
		if (player.vx <= 5 && player.vx >= -5)
			player.vx = 0;
		else {
			if (player.vx > 0) {
				player.vx -= 5;
			} else {
				player.vx += 5;
			}
		}
	}
}

function handleCollisions(gameObjects){
	let enemy_size = 50;
	for (let i = 0; i < gameObjects.length; i++) {
		let obj = gameObjects[i];
		if (isColliding(obj, player)) {
			if (obj.points < 0) {
				player.lives--;
				gameObjects.splice(i, 1);
				if (score < 5) {
					enemy_size = 50;
					enemy_vx = Math.floor(Math.random() * 30) + 10;
					if (Math.random() >= 0.5)
						enemy_vx *= -1;
					enemy_vy = Math.floor(Math.random() * 30) + 10;
					if (Math.random() >= 0.5)
						enemy_vy *= -1;
				}
				else if (score < 25) {
					enemy_size = 65;
					enemy_vx = Math.floor(Math.random() * 35) + 20;
					if (Math.random() >= 0.5)
						enemy_vx *= -1;
					enemy_vy = Math.floor(Math.random() * 35) + 20;
					if (Math.random() >= 0.5)
						enemy_vy *= -1;
				}
				else if (score < 40) {
					enemy_size = 80;
					enemy_vx = Math.floor(Math.random() * 40) + 30;
					if (Math.random() >= 0.5)
						enemy_vx *= -1;
					enemy_vy = Math.floor(Math.random() * 40) + 30;
					if (Math.random() >= 0.5)
						enemy_vy *= -1;
				}
				else {
					enemy_size = 100;
					enemy_vx = Math.floor(Math.random() * 50) + 50;
					if (Math.random() >= 0.5)
						enemy_vx *= -1;
					enemy_vy = Math.floor(Math.random() * 50) + 50;
					if (Math.random() >= 0.5)
						enemy_vy *= -1;
				}
				let new_obj;
				do {
					let max_x = (canvas.width - enemy_size);
					let max_y = (canvas.height - enemy_size);
					let enemy_x = Math.floor(Math.random() * max_x);
					let enemy_y = Math.floor(Math.random() * max_y);
					new_obj = new HarmObject(context, enemy_x, enemy_y, enemy_size, enemy_vx, enemy_vy);
				} while (isColliding(player, new_obj));
				gameObjects.push(new_obj);
			}
			else {
				let points;
				score += obj.points;
				gameObjects.splice(i, 1);
				
				if (score < 5)
					points = 1;
				else if (score < 25)
					points = 2;
				else if (score < 40)
					points = 4;
				else points = 5;

				let new_obj;
				do {
				let max_x = canvas.width - 50;
				let max_y = canvas.height - 50;
				let obj_x = Math.floor(Math.random() * max_x);
				let obj_y = Math.floor(Math.random() * max_y);
				new_obj = new BenefitObject(context, obj_x, obj_y, 50, points, 0, 0);
				} while (isColliding(new_obj, player));
				gameObjects.push(new_obj);

				
				player.width += (points * 2);
				player.height = player.width;
				player.radius = player.width / 2;
			}
		}
	}
}

function gameOver(context) {
	context.fillStyle = "red";
	context.fillText("GAME OVER!", 150, 235);

	name = prompt("Game over! Please enter your name to record your score.", name);
	if(name) {
		db.scores.add({"name":name,"score":score});
		alert("Your score has been recorded. Refresh the page to see it and try again!");
	} else {
		alert("Your score will not be recorded.");
	}
}