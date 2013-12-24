var signals = {
    WaitForPlayer: function WaitForPlayer() {},
    EnemyNoHealth: function EnemyNoHealth(enemy) {
        this.enemy = enemy;
    },
    NoMoreEnemies: function NoMoreEnemies() {},
    PlayerNoHealth: function PlayerNoHealth() {}
};

var stage = new Stage(new Player());

$(document).ready(function documentReady(e) {
    $(window).on("resize", function windowResize(e) {
        $("#battleStage").height($("#battleStage").width() * 0.75);
    });
    $("#battleStage").height($("#battleStage").width() * 0.75);
    function initBattle() {
        var right = (stage.enemies.length - 1) * 20;
        for (var i in stage.enemies) {
            // add health bar
            var enemy = stage.enemies[i];
            var progress = $("<div/>").addClass("progress").data("enemy", enemy);
            progress.append($("<div/>").addClass("prog-on progress-bar progress-bar-success"));
            progress.append($("<div/>").addClass("prog-off progress-bar progress-bar-danger"));
            progress.append($("<span/>").html(enemy.name + " (" + enemy.healthPoints + " / " + enemy.maxHealth + ")"));
            $("#enemyList").append(progress);
            // add stage entity
            var img = $("<div/>").addClass("enemy").data("enemy", enemy);
            img.css({
                "background-image": "url(" + enemy.image + ")",
                "right": right + "%"
            });
            right -= 20;
            if (enemy.flying === 1) {
                img.addClass("enemy-flying-low");
            } else if (enemy.flying === 2) {
                img.addClass("enemy-flying-high");
            }
            img.tooltip({
                placement: "bottom",
                title: enemy.tooltip
            });
            $("#battleEnemies").append(img);
        }
        updateAll();
    }
    function updateAll() {
        updateProgress($("#playerHP"), "HP", stage.player.healthPoints, stage.player.maxHealth);
        updateProgress($("#playerBP"), "BP", stage.player.battlePoints, stage.player.maxBattle);
        updateProgress($("#playerSP"), "SP", stage.player.specialPoints, stage.player.maxSpecial);
        updateProgress($("#playerLevel"), "Level " + stage.player.level, stage.player.levelPoints, 100);
        $("#enemyList .progress").each(function(index, progress) {
            var enemy = $(progress).data("enemy");
            updateProgress($(progress), enemy.name, enemy.healthPoints, enemy.maxHealth);
        });
    }
    function updateProgress(bar, msg, curr, max) {
        var percent = 100 * (curr / max);
        if (max === 0) {
            bar.addClass("progress-greyed");
        } else {
            bar.removeClass("progress-greyed");
        }
        $(".prog-on", bar).css("width", percent + "%");
        $(".prog-off", bar).css("width", (100 - percent) + "%");
        $("span", bar).html(msg + " (" + curr + " / " + max + ")");
    }
    var battleControlTypes = {
        jump: 1,
        hammer: 2
    };
    function addBattleControls(type) {
        $("#battlePlayer").fadeTo("fast", 0.5);
        switch (type) {
            case battleControlTypes.jump:
                $("#battleEnemies .enemy").each(function(index, image) {
                    var enemy = $(image).data("enemy");
                    if (enemy.healthPoints) {
                        if (enemy.flying === 0 || enemy.flying === 1 || enemy.flying === 2) {
                            $(image).css("cursor", "pointer").on("click", function(e) {
                                clearBattleControls();
                                hidePlayerTurnPanel();
                                playerJumpAttack(enemy);
                            });
                        } else {
                            $(image).fadeTo("fast", 0.5);
                        }
                    }
                });
                break;
            case battleControlTypes.hammer:
                var done = false;
                $("#battleEnemies .enemy").each(function(index, image) {
                    var enemy = $(image).data("enemy");
                    if (enemy.healthPoints) {
                        if (done) {
                            $(image).fadeTo("fast", 0.5);
                        } else {
                            if (enemy.flying === 0 || enemy.flying === 1) {
                                $(image).css("cursor", "pointer").on("click", function(e) {
                                    clearBattleControls();
                                    hidePlayerTurnPanel();
                                    playerHammerAttack(enemy);
                                });
                                done = true;
                            } else {
                                $(image).fadeTo("fast", 0.5);
                            }
                        }
                    }
                });
                break;
        }
    }
    function clearBattleControls() {
        $("#battlePlayer").off("click").css("cursor", "").fadeTo("fast", 1);
        $("#battleEnemies .enemy").each(function(index, image) {
            var enemy = $(image).data("enemy");
            if (enemy.healthPoints) {
                $(image).off("click").css("cursor", "").fadeTo("fast", 1);
            }
        });
    }
    function hidePlayerTurnPanel() {
        $("#playerTurnPanel").fadeOut("fast", function postPlayerTurnFadeOut(e) {
            $("#playerTurnJumpMenu").hide();
            $("#playerTurnHammerMenu").hide();
            $("#playerTurnMainMenu").show();
        });
    }
    function playerJumpAttack(target) {
        $("#canvasModalCanvas").drawImage({
            layer: true,
            source: target.image,
            x: 279, y: 225,
            fromCenter: false
        }).drawImage({
            layer: true,
            name: "player",
            source: "player_jump.png",
            x: 149, y: 200,
            fromCenter: false
        });
        $("#canvasModal").on("shown.bs.modal", function playerJumpCanvasModalShow(e) {
            $("#canvasModal").off("shown.bs.modal");
            var canHit = false;
            var hit = false;
            $(document).on("click", function documentClickPlayerJump(e) {
                e.stopPropagation();
                if (canHit) {
                    hit = true;
                }
            });
            $("#canvasModalCanvas")
                .animateLayer("player", {y: -100}, 400)
                .animateLayer("player", {x: 239}, 400,
                    function playerJumpCanvasTime1(e) {
                        setTimeout(function playerJumpCanvasTime2() {
                            canHit = true;
                        }, 300);
                    })
                .animateLayer("player", {y: 150}, 600,
                    function playerJumpCanvasTime3(e) {
                        canHit = false;
                        $(document).off("click");
                        if (hit) {
                            $("#canvasModalCanvas")
                                .animateLayer("player", {y: 50}, 300)
                                .animateLayer("player", {y: 150}, 300)
                        }
                        $("#canvasModalCanvas").animateLayer("player", {y: -100}, 400,
                            function playerJumpCanvasTimeEnd(e) {
                                postPlayerJumpAttack(target, hit);
                            });
                    });
        }).modal("show");
    }
    function postPlayerJumpAttack(target, hit) {
        closeCanvasModal();
        try {
            stage.player.jumpAttack(target, hit);
        } catch (e) {
            checkEnemyHealth(e);
        }
        playTurns();
    }
    function playerHammerAttack(target) {
        $("#canvasModalCanvas").drawEllipse({
            layer: true,
            name: "count1",
            strokeStyle: "#ddd",
            strokeWidth: 1,
            x: 219, y: 75,
            width: 20, height: 20
        }).drawEllipse({
            layer: true,
            name: "count2",
            strokeStyle: "#ddd",
            strokeWidth: 1,
            x: 249, y: 75,
            width: 20, height: 20
        }).drawEllipse({
            layer: true,
            name: "count3",
            strokeStyle: "#ddd",
            strokeWidth: 1,
            x: 279, y: 75,
            width: 20, height: 20
        }).drawEllipse({
            layer: true,
            name: "count4",
            strokeStyle: "#ddd",
            strokeWidth: 1,
            x: 319, y: 75,
            width: 40, height: 40
        }).drawImage({
            layer: true,
            name: "enemy",
            source: target.image,
            x: 279, y: 150,
            fromCenter: false
        }).drawImage({
            layer: true,
            name: "player",
            source: "player.png",
            x: 149, y: 125,
            fromCenter: false
        });
        $("#canvasModal").on("shown.bs.modal", function playerJumpCanvasModalShow(e) {
            $("#canvasModal").off("shown.bs.modal");
            $(document).on("mousedown", function documentMouseDownPlayerHammer(e) {
                e.stopPropagation();
                $(document).off("mousedown");
                var hit = false;
                $("#canvasModalCanvas").removeLayer("player").drawImage({
                    layer: true,
                    name: "player",
                    source: "player_hammer_prep.png",
                    x: 149, y: 125,
                    fromCenter: false
                }).drawLayers();
                var time1 = setTimeout(function playerHammerTime1() {
                    $("#canvasModalCanvas").animateLayer("count1", {
                        fillStyle: "red",
                        strokeStyle: "red"
                    }, 100);
                }, 600);
                var time2 = setTimeout(function playerHammerTime1() {
                    $("#canvasModalCanvas").animateLayer("count2", {
                        fillStyle: "orange",
                        strokeStyle: "orange"
                    }, 100);
                }, 1200);
                var time3 = setTimeout(function playerHammerTime1() {
                    $("#canvasModalCanvas").animateLayer("count3", {
                        fillStyle: "yellow",
                        strokeStyle: "yellow"
                    }, 100);
                }, 1800);
                var time4 = setTimeout(function playerHammerTime1() {
                    hit = true;
                    $("#canvasModalCanvas").animateLayer("count4", {
                        fillStyle: "green",
                        strokeStyle: "green"
                    }, 100);
                }, 2400);
                var timeEnd = setTimeout(function playerHammerTimeEnd() {
                    hit = false;
                    $(document).off("mouseup");
                    $("#canvasModalCanvas").removeLayer("enemy").removeLayer("player").drawImage({
                        layer: true,
                        name: "player",
                        source: "player_hammer_miss.png",
                        x: 179, y: 125,
                        fromCenter: false
                    }).drawLayers();
                    setTimeout(function postPlayerHammerAttackTrigger() {
                        postPlayerHammerAttack(target, hit);
                    }, 600);
                }, 2700);
                $(document).on("mouseup", function documentMouseUpPlayerHammer(e) {
                    e.stopPropagation();
                    $(document).off("mouseup");
                    clearTimeout(time1);
                    clearTimeout(time2);
                    clearTimeout(time3);
                    clearTimeout(time4);
                    clearTimeout(timeEnd);
                    $("#canvasModalCanvas").removeLayer("enemy").removeLayer("player").drawImage({
                        layer: true,
                        name: "player",
                        source: "player_hammer_" + (hit ? "hit" : "miss") + ".png",
                        x: 179, y: 125,
                        fromCenter: false
                    }).drawLayers();
                    setTimeout(function postPlayerHammerAttackTrigger() {
                        postPlayerHammerAttack(target, hit);
                    }, 600);
                });
            });
        }).modal("show");
    }
    function postPlayerHammerAttack(target, hit) {
        closeCanvasModal();
        try {
            stage.player.hammerAttack(target, hit);
        } catch (e) {
            checkEnemyHealth(e);
        }
        playTurns();
    }
    function closeCanvasModal() {
        $("#canvasModal").modal("hide");
        $("#canvasModal").on("hidden.bs.modal", function canvasModalHide(e) {
            $("#canvasModal").off("hidden.bs.modal");
            $("#canvasModalCanvas").removeLayers().clearCanvas();
        });
    }
    function checkEnemyHealth(e) {
        if (e instanceof signals.EnemyNoHealth) {
            $("#battleEnemies .enemy").each(function(index, image) {
                var enemy = $(image).data("enemy");
                if (enemy === e.enemy) {
                    $(image).fadeOut("fast");
                }
            });
        } else {
            throw e;
        }
    }
    $("#playerTurnJump").on("click", function playerTurnJumpOnClick(e) {
        $("#playerTurnMainMenu").hide();
        $("#playerTurnJumpMenu").fadeIn("fast");
        addBattleControls(battleControlTypes.jump);
    });
    $("#playerTurnJumpBack").on("click", function playerTurnJumpBackOnClick(e) {
        clearBattleControls();
        $("#playerTurnJumpMenu").hide();
        $("#playerTurnMainMenu").fadeIn("fast");
    });
    $("#playerTurnHammer").on("click", function playerTurnHammerOnClick(e) {
        $("#playerTurnMainMenu").hide();
        $("#playerTurnHammerMenu").fadeIn("fast");
        addBattleControls(battleControlTypes.hammer);
    });
    $("#playerTurnHammerBack").on("click", function playerTurnHammerBackOnClick(e) {
        clearBattleControls();
        $("#playerTurnHammerMenu").hide();
        $("#playerTurnMainMenu").fadeIn("fast");
    });
    function playTurns() {
        try {
            updateAll();
            stage.setNext();
            stage.nextToPlay.playTurn();
            setTimeout(playTurns, 1000);
        } catch (e) {
            if (e instanceof signals.WaitForPlayer) {
                $("#playerTurnPanel").fadeIn();
            } else if (e instanceof signals.NoMoreEnemies) {
                updateAll();
                $("#battlePanel").hide();
                $("#gameOverPanel").fadeIn();
                $("#gameOverPanel span").html("You win!");
            } else if (e instanceof signals.PlayerNoHealth) {
                updateAll();
                $("#battlePanel").hide();
                $("#gameOverPanel").fadeIn();
                $("#gameOverPanel span").html("You lose...");
            } else {
                throw e;
            }
        }
    }
    stage.enemies = [new Goomba, new Paragoomba, new KoopaTroopa];
    initBattle();
    playTurns();
});
