// @input SceneObject headObj {"label": "Head Binding"}
// @input SceneObject character
// @input Component.AnimationPlayer animPlayer
// @input Component.ScriptComponent levelGenerator {"label": "Level Gen Script"}

// @ui {"widget":"separator"}
// @input string runAnimName = "Run"
// @input string leftAnimName = "left"
// @input string rightAnimName = "right"
// @input string deathAnimName = "Death"
// @input string idleAnimName = "Idle"

// @ui {"widget":"separator"}
// @input float sensitivity = 0.3 {"label": "Nose Swipe Distance"}
// @input float inputDelay = 0.6 {"label": "Input Cooldown (Secs)"}

// @ui {"widget":"separator"}
// @input float laneWidth = 250.0
// @input float moveSpeed = 10.0

// @ui {"widget":"separator"}
// @ui {"label":"Scoring"}
// @input Component.Text scoreText
// @input float increaseRate = 0.5

// @ui {"widget":"separator"}
// @ui {"label":"UI Elements"}
// @input SceneObject gameOverUI
// @input SceneObject tutorialUI  {"label": "Tutorial UI"}
// @input Component.Text finalScoreText {"label": "GO Score Text"}
// @input Component.Text highScoreText {"label": "GO High Score Text"}

// @input SceneObject tutorialUI
// @input Component.ScriptComponent levelGenerator

// State variables
var currentLane = 0;
var lastNoseX = 0;
var canInput = true; 
var isGameOver = false; 
var isGameStarted = false; // NEW FLAG: Tracks if tutorial is done
var score = 0; 
var store = global.persistentStorageSystem.store; 

script.scoreText.text = "0";
function onStart() {
    // 1. Pause Road Immediately
    if (script.levelGenerator && script.levelGenerator.api.setSpeedZero) {
        script.levelGenerator.api.setSpeedZero();
    }
    
    // 2. Show Tutorial / Hide Game Over
    if (script.tutorialUI) script.tutorialUI.enabled = true;
    if (script.gameOverUI) script.gameOverUI.enabled = false;

    // 3. FREEZE ANIMATION
    // We play it first so it's ready, then immediately stop it.
    if (script.animPlayer) {
        script.animPlayer.playClip(script.idleAnimName); 
    }   

    // 4. Init Variables
    if (script.headObj) {
        lastNoseX = script.headObj.getTransform().getLocalPosition().x;
    }   
    currentLane = 0; 

    // --- Define Trigger Death Logic ---
    script.api.triggerDeath = function() {
        if (isGameOver) return;
        isGameOver = true;
        canInput = false; 
        
        // Calculate Scores
        var finalScore = Math.floor(score);
        var currentHighScore = store.getFloat("BestScore") || 0;
        if (finalScore > currentHighScore) {
            currentHighScore = finalScore;
            store.putFloat("BestScore", currentHighScore);
        }

        // Update UI
        if (script.gameOverUI) script.gameOverUI.enabled = true;
        if (script.finalScoreText) script.finalScoreText.text = "score: "+finalScore.toString();
        if (script.highScoreText) script.highScoreText.text = "High Score: "+currentHighScore.toString();

        // Play Death Animation & Stop Run
        if (script.animPlayer) {
            script.animPlayer.setClipEnabled(script.runAnimName, false);
            script.animPlayer.playClip(script.deathAnimName);
        }
        
        // Stop Road
        if (script.levelGenerator) {
            script.levelGenerator.api.setSpeedZero();
        }
    };
}

// --- TAP TO START (FIRST TIME ONLY) ---
var startTap = script.createEvent("TapEvent");
startTap.bind(function() {
    if (!isGameStarted) {
        script.animPlayer.setClipEnabled(script.idleAnimName,false);
        print("👆 Tutorial Tap: Starting Game...");
        isGameStarted = true;
        
        if (script.tutorialUI) script.tutorialUI.enabled = false;
        
        if (script.animPlayer) {
            script.animPlayer.setClipEnabled(script.runAnimName, true);
            script.animPlayer.playClip(script.runAnimName);
        }
        
        // Unpause Road
        if (script.levelGenerator) {
            script.levelGenerator.api.startLevel();
        }

    }
});

function onUpdate(eventData) {
    // BLOCK if game hasn't started OR is over
    if (!isGameStarted || isGameOver) return;
    
    // Update Score
    if (script.scoreText) {
        score += script.increaseRate;
        script.scoreText.text = Math.floor(score).toString();
    }

    if (!script.headObj || !script.character) return;
    
    var deltaTime = eventData.getDeltaTime();
    
    // Head Tracking
    var headTransform = script.headObj.getTransform();
    var currentNosePos = headTransform.getLocalPosition();
    
    if (canInput) {
        var movementDelta = currentNosePos.x - lastNoseX;
        if (movementDelta < -script.sensitivity && currentLane > -1) {
            changeLane(-1); 
            startInputCooldown();
        } else if (movementDelta > script.sensitivity && currentLane < 1) {
            changeLane(1);
            startInputCooldown();
        }
    }
    
    lastNoseX = currentNosePos.x;
    updatePhysics(deltaTime);

    // DELETE THE LINE BELOW:
    // script.animPlayer.playClip(script.runAnimName); 
}
// ... (Keep changeLane, startInputCooldown, updatePhysics, resetPlayer same as before) ...
function changeLane(direction) {
    if (isGameOver) return;
    currentLane += direction;
    currentLane = Math.max(-1, Math.min(1, currentLane));
}

function startInputCooldown() {
    canInput = false;
    var delayEvent = script.createEvent("DelayedCallbackEvent");
    delayEvent.bind(function() { if (!isGameOver) canInput = true; });
    delayEvent.reset(script.inputDelay);
}

function updatePhysics(deltaTime) {
    if (isGameOver) return;
    var transform = script.character.getTransform();
    var currentPos = transform.getLocalPosition();
    var targetX = currentLane * script.laneWidth;
    currentPos.x = MathUtils.lerp(currentPos.x, targetX, deltaTime * script.moveSpeed);
    currentPos.y = 0; 
    transform.setLocalPosition(currentPos);
}

// --- PUBLIC RESET API ---
script.api.isGameOver = function() { return isGameOver; };

script.api.resetPlayer = function() {
    isGameOver = false;
    canInput = true;
    score = 0;
    currentLane = 0;
    
    // NOTE: We do NOT reset isGameStarted here.
    if (script.scoreText) script.scoreText.text = "0";
    if (script.character) script.character.getTransform().setLocalPosition(new vec3(0, 0, 0)); 
    
    if (script.animPlayer) {
        script.animPlayer.setClipEnabled(script.runAnimName, true);
        script.animPlayer.playClip(script.runAnimName);
    }
    print("✅ Player Reset & Running");
};

script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("OnStartEvent").bind(onStart);