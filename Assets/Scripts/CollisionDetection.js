// @input Physics.BodyComponent playerBody {"label": "Player Body"}
// @input Component.AnimationPlayer animPlayer {"label": "Animation Player"}
// @input Component.ScriptComponent gameController {"label": "Face Controller"}
// @input Component.ScriptComponent levelGenerator {"label": "Level Generator"}

// @ui {"widget":"separator"}
// @input string deathAnimName = "Death"
// @input string obstacleTag = "Collider"

var isDead = false;
var isInvincible = false; // New flag

function onStart() {
    if (!script.playerBody) {
        print("ERROR: Player Body needed");
        return;
    }
    script.playerBody.onOverlapEnter.add(onCollision);
}

function onCollision(eventData) {
    // 1. Ignore collision if invincible OR dead
    if (isInvincible || isDead) return; //

    var hitCollider = eventData.overlap.collider;
    if (hitCollider) {
        var hitObject = hitCollider.getSceneObject();
        if (hitObject && hitObject.name.indexOf(script.obstacleTag) !== -1) {
            print("💥 CRASH! Hit: " + hitObject.name);
            handleDeath();
        }
    }
}

function handleDeath() {
    if (isDead) return;
    isDead = true;
    print("💀 GAME OVER");

    // Play Death Animation
    if (script.animPlayer) {
        script.animPlayer.playClip(script.deathAnimName);
    }

    // Stop the game
    if (script.gameController && script.gameController.api.triggerDeath) {
        script.gameController.api.triggerDeath();
    }
    
    // Stop the Road
    if (script.levelGenerator && script.levelGenerator.api.setSpeedZero) {
        script.levelGenerator.api.setSpeedZero();
    }
}

// --- PUBLIC RESET FUNCTION ---
script.api.resetCollision = function() {
    isDead = false;
    isInvincible = true; // Enable god mode
    print("🛡️ Invincibility Active");
    
    // Turn off god mode after 1.5 seconds
    var delayEvent = script.createEvent("DelayedCallbackEvent");
    delayEvent.bind(function() {
        isInvincible = false;
        print("🛡️ Invincibility Ended");
    });
    delayEvent.reset(1.5);
};

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);