function Stage(player) {
    this.player = player;
    this.allies = [];
    this.char1 = this.player;
    this.char2 = null;
    this.enemies = [];
    this.nextToPlay = null;
    this.enemySelectTarget = function enemySelectTarget(prob) {
        // only the main player, target them
        if (!this.allies.length) {
            return this.player;
        }
        if (typeof prob !== "number" || prob < 0 || prob > 1) {
            prob = 0.5;
        }
        // target character 1 (front) with given probability
        return (Math.random() < prob ? this.char1 : this.char2);
    }
    this.setNext = function setNext() {
        // player is first to play
        if (!this.nextToPlay) {
            this.nextToPlay = this.player;
            return true;
        }
        var liveEnemies = [];
        for (var i in this.enemies) {
            if (this.enemies[i].healthPoints) {
                liveEnemies.push(this.enemies[i]);
            }
        }
        if (liveEnemies.length) {
            // previously character 1, move to character 2
            if (this.nextToPlay == this.char1 && this.char2) {
                this.nextToPlay = this.char2;
            }
            // previously character 2, or character 1 with no character 2, move to the first enemy
            else if (this.nextToPlay === this.char1 || this.nextToPlay === this.char2) {
                this.nextToPlay = liveEnemies[0];
            }
            // previously an enemy
            else {
                var index = liveEnemies.indexOf(this.nextToPlay);
                // previously the last enemy, move back to character 1
                if (index === liveEnemies.length - 1) {
                    this.nextToPlay = this.char1;
                    return true;
                }
                // move to the next enemy
                else {
                    this.nextToPlay = liveEnemies[index + 1];
                }
            }
            return false;
        } else {
            throw new signals.NoMoreEnemies;
        }
    }
};

function Player(props) {
    var defaults = {
        maxHealth: 10,
        maxBattle: 5,
        maxSpecial: 0,
        jumpStrength: 1,
        hammerStrength: 2,
        defense: 0,
        level: 1,
        levelPoints: 0
    };
    $.extend(this, defaults, props);
    this.healthPoints = this.maxHealth;
    this.battlePoints = this.maxBattle;
    this.specialPoints = this.maxSpecial;
    this.playTurn = function playTurn() {
        throw new signals.WaitForPlayer;
    };
    this.jumpAttack = function jumpAttack(target) {
        target.reduceHealth(this.jumpStrength);
        target.reduceHealth(this.jumpStrength);
    };
    this.hammerAttack = function hammerAttack(target) {
        target.reduceHealth(this.hammerStrength);
    };
    this.reduceHealth = function reduceHealth(damage) {
        var adjDamage = damage - this.defense;
        if (adjDamage < 0) {
            adjDamage = 0;
        }
        this.healthPoints -= adjDamage;
        if (this.healthPoints === 0) {
            throw new signals.PlayerNoHealth;
        }
    };
};

function Enemy(props) {
    var defaults = {
        name: "Enemy",
        image: "enemy.png",
        maxHealth: 1,
        defense: 0,
        flying: 0,
        spiked: false
    };
    $.extend(this, defaults, props);
    this.healthPoints = this.maxHealth;
    this.actions = [];
    this.playTurn = function playTurn() {
        if (this.healthPoints) {
            var rand = Math.random();
            var total = 0;
            for (var i in this.actions) {
                if (rand < this.actions[i].prob + total) {
                    this.actions[i].action();
                    break;
                } else {
                    total += this.actions[i].prob;
                }
            }
        }
    };
    this.reduceHealth = function reduceHealth(damage) {
        var adjDamage = damage - this.defense;
        if (adjDamage < 0) {
            adjDamage = 0;
        }
        this.healthPoints -= adjDamage;
        if (this.healthPoints <= 0) {
            this.healthPoints = 0;
            throw new signals.EnemyNoHealth(this);
        }
    };
    // use bind to fix subclass scope issues
    this.tooltip = (function tooltip() {
        return this.name + " (" + this.healthPoints + " / " + this.maxHealth + ")";
    }).bind(this);
};
