/*******************************************************************************
 * Asteroids - using HTML5 canvas
 *
 * Gary Kerr, 19/11/2010
 ******************************************************************************/

function Asteroids() {
    // html5 canvas stuff
    this.canvas = null;
    this.context = null;
    // canvas (game) dims
    this.WIDTH = 500;
    this.HEIGHT = 400;

    // the ui menus
    this.main_menu = null;
    this.highscore_menu = null;
    this.pause_menu = null;
    this.gameover_menu = null;

    this.high_scores_table = new Array();

    // asteroid sizes
    this.sizes = {
        LARGE: 25,
        MEDIUM: 12,
        SMALL: 5
    };

    // asteroid speeds
    this.speeds = {
        LARGE: 3,
        MEDIUM: 5,
        SMALL: 6
    };

    // asteroid scores
    this.scores = {
        LARGE: 20,
        MEDIUM: 50,
        SMALL: 100
    };

    // array of asteroids
    this.asteroids = null;

    this.ship = null;
    // array of ship bullets
    this.bullets = null;
    this.TOTAL_LIVES = 3;
    this.lives = this.TOTAL_LIVES;

    this.level = null;

    var ufo = null;
    // array of ufo bullets
    this.bullets_ufo = null;

    // timeout objects (interval IDs - from window.setInterval)
    this.t = null;
    this.t_b = null;

    // is a game currently in progress
    this.playing = false;
    // is the game paused
    this.paused = false;

    // the score
    this.score = 0;
}

/*******************************************************************************
 * UFOs - there are two types of ufos.
 *  1. stupid: fire in random direction
 *  2. intelligent: fire at ship
 ******************************************************************************/
Asteroids.prototype.UFO = function(game) {
    if (Math.random() < 0.33) {
        // intelligent ufos are less common
        this.intelligent = true;
        this.score = 1000;
    }
    else {
        this.intelligent = false;
        this.score = 200;
    }

    // initial position
    this.x = -10;
    this.y = (game.HEIGHT - 30)*Math.random() + 15;

    // velocity
    this.dx = 2.5;

    this.move = function() {
        this.x += this.dx;
    };

    this.boundary = function(game) {
        if (this.x > game.WIDTH + 10) {
            game.ufo = null;
            delete this;
        }
    };

    // ufo fires bullet
    this.fire = function(game) {
        var rotation = 0;

        if (this.intelligent) {
            if (this.x - game.ship.x !== 0) {
                rotation = Math.atan((game.ship.y - this.y)/(game.ship.x - this.x));
            }
        }
        else {
            rotation = 2*Math.PI*Math.random();
        }

        var b = new game.Bullet(this.x, this.y, rotation);
        game.bullets_ufo.push(b);
    };

    // collision with ship bullets
    this.collision = function(game) {
        for (var bullet in game.bullets) {
            var dx = this.x - game.bullets[bullet].x;
            var dy = this.y - game.bullets[bullet].y;
            var dist = Math.sqrt(dx*dx + dy*dy);

            //console.debug(dist);

            // TODO: fix collision detection method for ufo
            if (dist < 9) {
                game.score += this.score;
                delete game.bullets[bullet];
                delete this;
                game.ufo = null;
                // exit for loop early since ufo is destroyed
                break;
            }
        }
    };

    this.draw = function(context) {
        context.save();

        context.strokeStyle = "rgb(255, 255, 255)";
        //context.fillStyle = "rgba(200, 200, 100, 0.4)";
        context.translate(this.x, this.y);

        context.beginPath();
        //context.arc(this.x, this.y, 6, 0, 2*Math.PI, true);
        context.moveTo(-8, 4);
        context.lineTo(8, 4);
        context.moveTo(9, 3);
        context.lineTo(9, 0);
        context.moveTo(8, -1);
        context.lineTo(4, -1);
        context.lineTo(4, 1);
        context.lineTo(-4, 1);
        context.lineTo(-4, -1);
        context.lineTo(-8, -1);
        context.moveTo(-9, 0);
        context.lineTo(-9, 3);
        context.closePath();
        context.stroke();
        //context.fill();

        context.moveTo(-4, -1);
        context.lineTo(0, -4);
        context.lineTo(4, -1);
        context.stroke();

        context.restore();
    };
};

/*******************************************************************************
 * Asteroid
 ******************************************************************************/
Asteroids.prototype.Asteroid = function(x, y, dx, dy, r) {
    // the asteroid's position
    this.x = x;
    this.y = y;
    // the asteroid's velocity
    this.dx = dx;
    this.dy = dy;
    // the asteroid's radius
    this.r = r;

    // move the asteroid by changing the position (x, y) by (dx, dy)
    this.move = function() {
        this.x += this.dx;
        this.y += this.dy;
    };

    // draw the asteroid using the 2d context object
    this.draw = function(context) {
        context.strokeStyle = "rgb(255, 255, 255)";
        context.fillStyle = "rgba(200, 100, 100, 0.4)";

        context.beginPath();
        context.arc(this.x, this.y, this.r, 0, 2*Math.PI, true);
        context.stroke();
        context.fill();
    };

    // check for boundary conditions
    this.boundary = function(game) {
        //alert(game);
        if (this.x < 0) {
            this.x = game.WIDTH;
        }
        else if (this.x > game.WIDTH) {
            this.x = 0;
        }

        if (this.y < 0) {
            this.y = game.HEIGHT;
        }
        else if (this.y > game.HEIGHT) {
            this.y = 0;
        }
    };

    // check for collisions
    // TODO: refactor this to remove duplication for bullet arrays
    this.collision = function(game) {
        var bullet, dx, dy, dist;

        // check ship bullets
        for (bullet in game.bullets) {
            dx = this.x - game.bullets[bullet].x;
            dy = this.y - game.bullets[bullet].y;
            // the '-2' provides a bit of fuzziness
            dist = dx*dx + dy*dy - 2;

            if (dist <= this.r*this.r) {
                // collision with bullet
                delete game.bullets[bullet];
                this.destroy(1, game);

                // this asteroid doesn't exist anymore so quit method before
                // checking collision with ship;
                return;
            }
        }

        // check ufo bullets
        for (bullet in game.bullets_ufo) {
            dx = this.x - game.bullets_ufo[bullet].x;
            dy = this.y - game.bullets_ufo[bullet].y;
            // the '-2' provides a bit of fuzziness
            dist = dx*dx + dy*dy - 2;

            if (dist <= this.r*this.r) {
                // collision with bullet
                delete game.bullets_ufo[bullet];
                this.destroy(0, game);

                // this asteroid doesn't exist anymore so quit method before
                // checking collision with ship;
                return;
            }
        }

        // check collision with ship
        dx = this.x - game.ship.x;
        dy = this.y - game.ship.y;
        dist = Math.sqrt(dx*dx + dy*dy);

        // 7 is size of ship!! fudge - need to create better way of detecting
        // collision
        if (dist <= this.r + 7) {
            game.lives -= 1;
            game.ship.reset(game);
            this.destroy(1, game);
        }
    };

    // destroy asteroid - helper function for this.collision()
    // if scoring is 1 then asteroid was destroyed by ship so increase score,
    // otherwise don't increase score
    this.destroy = function(scoring, game) {
        delete game.asteroids[game.asteroids.indexOf(this)];

        // create child asteroids and update score
        if (this.r == game.sizes.LARGE) {
            // large asteroid creates 2 medium asteroids
            game.score += game.scores.LARGE*scoring;
            game.create_asteroids(2, this.x, this.y, game.sizes.MEDIUM, game.speeds.MEDIUM);
        }
        else if (this.r == game.sizes.MEDIUM) {
            // medium asteroid creates 2 small asteroids
            game.score += game.scores.MEDIUM*scoring;
            game.create_asteroids(2, this.x, this.y, game.sizes.SMALL, game.speeds.SMALL);
        }
        else {
            game.score += game.scores.SMALL*scoring;
        }
    };
};

/*******************************************************************************
 * The ship
 ******************************************************************************/
Asteroids.prototype.Ship = function(game) {
    // keep a reference to the game
    this.game = game;
    // position
    this.x = game.WIDTH/2;
    this.y = game.HEIGHT/2;
    // velocity
    this.dx = 0;
    this.dy = 0;
    // direction the ship is facing
    this.rotation = -Math.PI/2;
    // direction increment - when user presses buttons, this is how much to
    // change this.rotation for each key press
    this.rot_inc = 0.1;
    // is the ship current firing a bullet
    this.firing = false;
    // keep track of when the last bullet was fired
    this.last_bullet_timer = 10;
    // is the ship currently moving
    this.thruster = false;
    // is the ship rotating
    this.rotate_left = false;
    this.rotate_right = false;

    // draw the ship using the 2d context object
    this.draw = function(context) {
        context.save();
        context.strokeStyle = "rgb(255, 255, 255)";
        context.translate(this.x, this.y);
        context.rotate(this.rotation + Math.PI/2);

        context.beginPath();
        context.moveTo(-8, 10);
        context.lineTo(0, -10);
        context.lineTo(8, 10);
        context.lineTo(0, 6);
        context.closePath();
        context.stroke();

        context.restore();
    };

    // rotate the ship
    this.rotate = function() {
        if (!this.rotate_left && this.rotate_right) {
            this.rotation += this.rot_inc;
        } else if (this.rotate_left && !this.rotate_right) {
            this.rotation -= this.rot_inc;
        }
    };

    // fire a bullet
    this.fire = function() {
        // increment bullet timer
        this.last_bullet_timer += 1;
        if (this.firing && this.last_bullet_timer > 5) {
            this.last_bullet_timer = 0;
            var b = new game.Bullet(this.x, this.y, this.rotation);
            if (this.game.bullets.length < 15) {
                this.game.bullets.push(b);
            }
        }
    };

    // create thrust
    this.thrust = function() {
        // only apply thrust if speed is not too high (ie a max speed)
        if (this.thruster && this.dx < 5 && this.dy < 5) {
            this.dx += 2*Math.cos(this.rotation);
            this.dy += 2*Math.sin(this.rotation);
        }
        
        this.x += this.dx;
        this.y += this.dy;

        // deceleration (ship will always slow down when no thrust applied)
        this.dx *= 0.90;
        this.dy *= 0.90;
    };

    // check for boundary conditions
    this.boundary = function(game) {
        if (this.x < 0) {
            this.x = game.WIDTH;
        }
        else if (this.x > game.WIDTH) {
            this.x = 0;
        }

        if (this.y < 0) {
            this.y = game.HEIGHT;
        }
        else if (this.y > game.HEIGHT) {
            this.y = 0;
        }
    };

    // check collision with ufo bullets
    this.collision = function(game) {
        for (var bullet in game.bullets_ufo) {
            var dx = this.x - game.bullets_ufo[bullet].x;
            var dy = this.y - game.bullets_ufo[bullet].y;
            var dist = Math.sqrt(dx*dx + dy*dy);
            // TODO: fix ship collision detection
            // 7 is size of ship!
            if (dist < 7) {
                game.lives -= 1;
                this.reset(game);
                delete game.bullets_ufo[bullet];
            }
        }
    };

    // reset the ship to the centre of the screen
    this.reset = function(game) {
        this.x = game.WIDTH/2;
        this.y = game.HEIGHT/2;
        this.dx = 0;
        this.dy = 0;
        this.rotation = -Math.PI/2;
    };
};

/*******************************************************************************
 * Bullets
 ******************************************************************************/
Asteroids.prototype.Bullet = function(x, y, rotation) {
    // velocity
    this.dx = 6*Math.cos(rotation);
    this.dy = 6*Math.sin(rotation);
    // position - use dx and dy to position the bullet at the front of the ship
    this.x = x + this.dx;
    this.y = y + this.dy;
    // a bullet has a liftime - keep track of its age
    this.age = 0;

    // move the bullet and increase its age by one
    this.move = function() {
        this.x += this.dx;
        this.y += this.dy;

        this.age += 1;
    };

    // draw the bullet on the canvas
    this.draw = function(context) {
        context.strokeStyle = "rgb(255, 255, 255)";
        context.strokeRect(this.x, this.y, 1, 1);
    };

    // check for boundary conditions
    this.boundary = function(game) {
        if (this.x < 0) {
            this.x = game.WIDTH;
        }
        else if (this.x > game.WIDTH) {
            this.x = 0;
        }

        if (this.y < 0) {
            this.y = game.HEIGHT;
        }
        else if (this.y > game.HEIGHT) {
            this.y = 0;
        }
    };
};

/*******************************************************************************
 * loader - initialise the game when the html is loaded.
 ******************************************************************************/
Asteroids.prototype.loader = function() {
    var this_ast = this;
    // create high_scores_table from XMLHttpRequest
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // items is array of strings - each string contains name & score
            var items = xhr.responseText.split("\n");

            for (var i = 0; i < items.length; i++) {
                // create array - name & score
                var score_split = items[i].split("\t");
                //alert(this);
                this_ast.high_scores_table[i + 1] = {name: score_split[0],
                                        score: parseInt(score_split[1], 10)};
            }
        }
    };

    xhr.open("GET", "asteroids.txt", true);
    // this line to stop browser caching
    //xhr.setRequestHeader("If-Unmodified-Since", "Mon, 4 Jul 2011 23:00:00 GMT");
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.send();

    // initialise the canvas
    this.canvas = document.getElementById("canvas");
    this.canvas.width = this.WIDTH;
    this.canvas.height = this.HEIGHT;

    // initialise the context object
    this.context = this.canvas.getContext('2d');

    // menus
    this.main_menu = document.getElementById("main");
    this.highscore_menu = document.getElementById("high");
    this.pause_menu = document.getElementById("pause");
    this.gameover_menu = document.getElementById("gameover");

    // add event listeners
    var docel = document.getElementById;
    window.addEventListener('keydown', function(event) {this_ast.keydown(event);});
    window.addEventListener('keyup', function(event) {this_ast.keyup(event);});
    document.getElementById('highscoretable').addEventListener('click',
        function() {this_ast.high_scores();});
    document.getElementById('startbutton').addEventListener('click',
        function() {this_ast.go();});
    document.getElementById('highscorereturn').addEventListener('click',
        function() {this_ast.display_menus(10, -10, -10, -10);});
    document.getElementById('newscorebutton').addEventListener('click',
        function() {this_ast.new_high_score();});
    document.getElementById('noscorebutton').addEventListener('click',
        function() {this_ast.main();});

    this.main();
};

/*******************************************************************************
 * main - show main menu and animate background
 ******************************************************************************/
Asteroids.prototype.main = function() {
    var this_ast = this;
    // display the main menu
    this.display_menus(10, -10, -10, -10);

    // asteroids for the background animation
    this.asteroids = new Array();
    this.create_asteroids(4, null, null, this.sizes.LARGE, this.speeds.LARGE);
    this.create_asteroids(4, null, null, this.sizes.MEDIUM, this.speeds.MEDIUM);
    this.create_asteroids(6, null, null, this.sizes.SMALL, this.speeds.SMALL);

    // start background animation
    if (!this.t_b) {
        this.t_b = window.setInterval(function() {this_ast.animate_background();}, 50);
    }
};

/*******************************************************************************
 * high_scores - update the html high score table
 ******************************************************************************/
Asteroids.prototype.high_scores = function() {
    for (var i = 1; i <= 8; i++) {
        document.getElementById("name" + i).innerHTML = this.high_scores_table[i]["name"];
        document.getElementById("score" + i).innerHTML = this.high_scores_table[i]["score"];
    }

    // display the high score menu
    this.display_menus(-10, 10, -10, -10);
};

/*******************************************************************************
 * new_high_score - update the high score table
 ******************************************************************************/
Asteroids.prototype.new_high_score = function() {
    var new_score = this.score;
    var new_name = document.getElementById("name").value;

    for (var i = 1; i <= 8; i++) {
        if (new_score > this.high_scores_table[i].score ||
                (new_score < this.score && new_score >= this.high_scores_table[i].score)) {
            // keep a record of current score and name in temp vars
            var temp_score = this.high_scores_table[i].score;
            var temp_name = this.high_scores_table[i].name;

            // replace with new values
            this.high_scores_table[i].name = new_name;
            this.high_scores_table[i].score = new_score;

            // transfer temp vars
            new_name = temp_name;
            new_score = temp_score;
        }
    }

    this.main();
};

/*******************************************************************************
 * game_over - display the game over menu at the end of a game
 ******************************************************************************/
Asteroids.prototype.game_over = function() {
    var this_ast = this;

    // clear game loop
    window.clearInterval(this_ast.t);

    // start background animation
    this.t_b = window.setInterval(function() {this_ast.animate_background();}, 50);

    // set the score
    document.getElementById("score").innerHTML = this.score;

    // current 8th position score
    var score8 = this.high_scores_table[8].score;

    if (this.score > score8) {
        // new score in high score table
        document.getElementById("newhighscore").style.display = "block";
        document.getElementById("nohighscore").style.display = "none";
    }
    else {
        // not a new high score
        document.getElementById("newhighscore").style.display = "none";
        document.getElementById("nohighscore").style.display = "block";
    }

    // display the game over menu
    this.display_menus(-10, -10, -10, 10);
};

/*******************************************************************************
 * go - starts the game
 ******************************************************************************/
Asteroids.prototype.go = function() {
    var this_ast = this;

    // hide the menus
    this.display_menus(-10, -10, -10, -10);

    // stop the background animation
    window.clearInterval(this.t_b);
    this.t_b = null;

    // create the ship
    this.ship = new this.Ship(this);

    // the bullets arrays
    this.bullets = new Array();
    this.bullets_ufo = new Array();

    // reset the score
    this.score = 0;

    // reset the number of lives
    this.lives = 3;

    // reset the level (level is the number of asteroids to create 4 - 12)
    this.level = 4;

    // empty the asteroids array before starting
    this.asteroids = new Array();

    // create the asteroids
    this.create_asteroids(this.level, null, null, this.sizes.LARGE, this.speeds.LARGE);

    this.ufo = null;

    if (!this.playing) {
        this.playing = true;
        this.t = window.setInterval(function() {this_ast.play();}, 30);
    }
};

/*******************************************************************************
 * play - play the game, the main loop
 ******************************************************************************/
Asteroids.prototype.play = function() {
    var bullet, ast;

    // clear the canvas
    this.context.fillStyle = "rgb(0, 0, 0)";
    this.context.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // remove old bullets
    this.bullets = this.bullets.filter(function(el, ind, arr) {return el.age < 55;});
    this.bullets_ufo = this.bullets_ufo.filter(function(el, ind, arr) {return el.age < 50;});

    // draw bullets
    for (bullet in this.bullets) {
        this.bullets[bullet].move();
        this.bullets[bullet].boundary(this);
        this.bullets[bullet].draw(this.context);
    }

    // draw ufo bullets
    for (bullet in this.bullets_ufo) {
        this.bullets_ufo[bullet].move();
        this.bullets_ufo[bullet].boundary(this);
        this.bullets_ufo[bullet].draw(this.context);
    }

    // deal with ufos
    if (this.ufo) {
        this.ufo.draw(this.context);
        // only fire 2% of the time
        if (Math.random() < 0.02) {
            this.ufo.fire(this);
        }
        this.ufo.move();
        this.ufo.collision(this);
        // ufo may be destroyed by collision
        if (this.ufo) {
            this.ufo.boundary(this);
        }
    }
    else if (Math.random() < 0.002) {
        // create a ufo once every 500 frames - approx 25s.
        this.ufo = new this.UFO(this);
    }

    // remove dead asteroids from array
    this.asteroids = this.asteroids.filter(function(el, ind, arr) {return el;});

    // draw asteroids
    for (ast in this.asteroids) {
        this.asteroids[ast].draw(this.context);
        this.asteroids[ast].move();
        this.asteroids[ast].boundary(this);
        this.asteroids[ast].collision(this);
        //asteroids[ast].draw(context);
    }

    // move and draw the ship
    this.ship.thrust();
    this.ship.rotate();
    this.ship.fire();
    this.ship.boundary(this);
    this.ship.collision(this);
    this.ship.draw(this.context);

    // draw the score
    this.draw_score(this.context);

    // check for end of level
    if (this.asteroids.length === 0) {
        this.level++;
        // maximum difficulty level is 12
        if (this.level > 12) {
            this.level = 12;
        }

        // create asteroids for new level
        this.create_asteroids(this.level, null, null, this.sizes.LARGE, this.speeds.LARGE);
    }

    // check if game over
    if (this.lives <= 0) {
        this.playing = false;
        this.game_over();
    }
};

/*******************************************************************************
 * animate_background - draw some asteroids on the canvas when the menus are
 * being displayed
 ******************************************************************************/
Asteroids.prototype.animate_background = function() {
    // clear the canvas
    this.context.fillStyle = "rgb(0, 0, 0)";
    this.context.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // move the asteroids
    for (var ast in this.asteroids) {
        this.asteroids[ast].draw(this.context);
        this.asteroids[ast].move();
        this.asteroids[ast].boundary(this);
    }
};

/*******************************************************************************
 * create_asteroids - helper function to create n asteroids with radius r at
 * location (x_in, y_in). If location not specified, then random locations
 * are chosen.
 ******************************************************************************/
Asteroids.prototype.create_asteroids = function(n, x_in, y_in, r, speed)
{
    var create_coords = x_in ? false : true;

    for (var i = 0; i < n; i++) {
        if (create_coords) {
            x_in = Math.floor(this.WIDTH*Math.random()/2 - this.WIDTH/4);
            if (x_in < 0) {
                x_in += this.WIDTH;
            }

            y_in = Math.floor(this.HEIGHT*Math.random()/2 - this.HEIGHT/4);
            if (y_in < 0) {
                y_in += this.HEIGHT;
            }
        }
        var x = x_in;
        var y = y_in;

        var dx = speed*(Math.random() - 0.5);
        var dy = speed*(Math.random() - 0.5);

        this.asteroids.push(new this.Asteroid(x, y, dx, dy, r));
    }
};

/*******************************************************************************
 * draw_score - writes the score on the canvas
 ******************************************************************************/
Asteroids.prototype.draw_score = function(context) {
    context.fillStyle = "rgb(255, 255, 255)";
    context.font = "11pt Verdana";
    context.textAlign = "right";
    context.fillText(this.score, this.WIDTH/2, 30);

    // draw the number of lives remaining
    context.save();
    context.strokeStyle = "rgb(255, 255, 255)";
    context.translate(20, 20);
    context.beginPath();
    context.moveTo(-8, 10);
    context.lineTo(0, -10);
    context.lineTo(8, 10);
    context.lineTo(0, 6);
    context.closePath();
    context.stroke();
    context.restore();

    context.fillText("x " + this.lives, 57, 30);
};

/*******************************************************************************
 * display_menus: change the zIndex of menus
 ******************************************************************************/
Asteroids.prototype.display_menus = function(main, high, pause, gameover) {
    this.highscore_menu.style.zIndex = high;
    this.main_menu.style.zIndex = main;
    this.pause_menu.style.zIndex = pause;
    this.gameover_menu.style.zIndex = gameover;
};

/*******************************************************************************
 * keydown - react to key presses
 ******************************************************************************/
Asteroids.prototype.keydown = function(event) {
    var this_ast = this;
    var keynum = event.which;

    //alert(keynum);

    switch (keynum) {
        case 37:
            // left arrow
            this.ship.rotate_left = true;
            break;
        case 39:
            // right arrow
            this.ship.rotate_right = true;
            break;
        case 40:
            // down arrow - fire
            this.ship.firing = true;
            break;
        case 38:
            // up arrow - thrust
            this.ship.thruster = true;
            break;
        case 65:
            // 'a' key - pause
            if (this.playing) {
                if (!this.paused) {
                    this.paused = true;
                    window.clearInterval(this.t);
                    this.display_menus(-10, -10, 10, -10);
                }
                else {
                    this.paused = false;
                    this.t = window.setInterval(function() {this_ast.play();}, 50);
                    this.display_menus(-10, -10, -10, -10);
                }
            }
            break;
        case 79:
            // 'o' key - quit game
            if (this.playing) {
                this.playing = false;
                window.clearInterval(this.t);
                this.main();
            }
            break;
        /*
        case 49:
            ufo = new UFO();
            ufo.intelligent = false;
            break;
        case 50:
            ufo = new UFO();
            ufo.intelligent = true;
            break;
        */
        default:
            break;
    }
};

Asteroids.prototype.keyup = function(event) {
    //console.log('key up');
    var keynum = event.which;
    
    switch (keynum) {
        case 37:
            // left arrow
            this.ship.rotate_left = false;
            break;
        case 39:
            // right arrow
            this.ship.rotate_right = false;
            break;
        case 40:
            // down arrow - fire
            this.ship.firing = false;
            break;
        case 38:
            // up arrow - thrust
            this.ship.thruster = false;
            break;
    }
}

window.addEventListener(
    'load',
    function() {
        var ast = new Asteroids();
        ast.loader();},
    false);