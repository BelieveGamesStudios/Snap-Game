// @input Physics.BodyComponent playerBody {"label": "Player Body"}
// @input Component.AnimationPlayer animPlayer {"label": "Animation Player"}
// @input string deathAnimName = "Death"
// @input string obstacleTag = "Obstacle
// @input Component.ScriptComponent levelGeneratorScript

function onStart() {
    if (!script.playerBody) {
        print("ERROR: Please drag the Character's Physics Body into the script.");
        return;
    }

    // Check if animation player is assigned
    if (!script.animPlayer) {
        print("WARNING: Animation Player is not assigned. Death animation won't play.");
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
            if (script.levelGeneratorScript && script.levelGeneratorScript.api.setSpeedZero) {
                script.levelGeneratorScript.api.setSpeedZero();
            }
        }
    }
}

var isDead = false;

function handleDeath() {
    if (isDead) return;
    isDead = true;

    print("Player has died.");

    // --- NEW: PLAY DEATH ANIMATION ---
    if (script.animPlayer) {
        // Optional: Check if clip exists to prevent errors
        if (script.animPlayer.getClip(script.deathAnimName)) {
            script.animPlayer.playClip(script.deathAnimName);
        } else {
            print("Error: Could not find animation clip named '" + script.deathAnimName + "'");
        }
    }
}

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);