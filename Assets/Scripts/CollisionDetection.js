// @input Physics.BodyComponent playerBody {"label": "Player Body"}
// @input Component.AnimationPlayer animPlayer {"label": "Animation Player"}
// @input Component.ScriptComponent gameController {"label": "Face Controller"}
// @input Component.ScriptComponent levelGenerator {"label": "Level Generator"}

// @ui {"widget":"separator"}
// @input string deathAnimName = "Death"
// @input string obstacleTag = "Collider"

function onStart() {
    if (!script.playerBody) {
        print("ERROR: Please assign the Player Physics Body.");
        return;
    }

    // Bind the collision event
    script.playerBody.onOverlapEnter.add(onCollision);
}

function onCollision(eventData) {
    var hitCollider = eventData.overlap.collider;
    
    if (hitCollider) {
        var hitObject = hitCollider.getSceneObject();

        // Check if the object we hit is tagged as an obstacle
        if (hitObject && hitObject.name.indexOf(script.obstacleTag) !== -1) {
            print("💥 CRASH! Hit: " + hitObject.name);
            handleDeath();
        }
    }
}

var isDead = false;

function handleDeath() {
    if (isDead) return;
    isDead = true;

    print("💀 GAME OVER");

    // 1. Play Death Animation
    if (script.animPlayer) {
        if (script.animPlayer.getClip(script.deathAnimName)) {
            script.animPlayer.playClip(script.deathAnimName);
        } else {
            print("Warning: Death animation clip not found.");
        }
    }

    // 2. Disable Inputs (Stop Swiping)
    if (script.gameController && script.gameController.api.triggerDeath) {
        script.gameController.api.triggerDeath();
    } else {
        print("Warning: Face Controller not assigned.");
    }

    // 3. Stop the Road (Set Speed to 0)
    if (script.levelGenerator && script.levelGenerator.api.setSpeedZero) {
        script.levelGenerator.api.setSpeedZero();
    } else {
        print("Warning: Level Generator not assigned.");
    }
}

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);