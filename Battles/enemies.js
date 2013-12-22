function Goomba() {
    Enemy.call(this, {
        name: "Goomba",
        image: "goomba.png",
        maxHealth: 2
    });
    this.actions = [{
        action: function mainAttack() {
            stage.enemySelectTarget().reduceHealth(1);
        },
        prob: 0.9
    }, {
        action: function powerAttack() {
            stage.enemySelectTarget().reduceHealth(2);
        },
        prob: 0.1
    }];
};

function Paragoomba() {
    Enemy.call(this, {
        name: "Paragoomba",
        image: "paragoomba.png",
        flying: (Math.random() < 0.5 ? 1 : 2),
        maxHealth: 2
    });
    this.actions = [{
        action: function mainAttack() {
            stage.enemySelectTarget().reduceHealth(1);
        },
        prob: 1
    }];
};

function KoopaTroopa() {
    Enemy.call(this, {
        name: "Koopa Troopa",
        image: "koopa.png",
        maxHealth: 4,
        defense: 1
    });
    this.actions = [{
        action: function mainAttack() {
            stage.char1.reduceHealth(1);
        },
        prob: 0.8
    }, {
        action: function powerAttack() {
            if (stage.char1 && stage.char1.healthPoints) {
                stage.char1.reduceHealth(1);
            }
            if (stage.char2 && stage.char2.healthPoints) {
                stage.char2.reduceHealth(1);
            }
        },
        prob: 0.2
    }];
};
