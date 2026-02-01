// @input SceneObject headObj {"label": "Head Binding"}
// @input SceneObject character
// @input Component.AnimationPlayer animPlayer
// @input Component.ScriptComponent levelGenerator {"label": "Level Gen Script"}

// @ui {"widget":"separator"}
// @input string runAnimName = "Run"
// @input string leftAnimName = "left"
// @input string rightAnimName = "right"
// @input string deathAnimName = "Death"

// @ui {"widget":"separator"}
// @input float sensitivity = 0.3 {"label": "Nose Swipe Distance"}
// @input float inputDelay = 0.6 {"label": "Input Cooldown (Secs)"}

// @ui {"widget":"separator"}
// @input float laneWidth = 1.5
// @input float moveSpeed = 10.0

// @ui {"widget":"separator"}
// @ui {"label":"Scoring"}
// @input Component.Text scoreText
// @input float increaseRate = 0.5

// @ui {"widget":"separator"}
// @ui {"label":"Game Over UI"}
// @input SceneObject gameOverUI
// @input Component.Text finalScoreText {"label": "GO Score Text"}
// @input Component.Text highScoreText {"label": "GO High Score Text"}

// State variables
var currentLane = 0;
var lastNoseX = 0;
var canInput = true; 
var isGameOver = false; 
var score = 0; 
var store = global.persistentStorageSystem.store; // Access Device Storage

function onStart() {
    if (!script.animPlayer) {
        print("ERROR: Please assign Animation Player");
        return;
    }
    
    // Initialize Nose X
    if (script.headObj) {
        lastNoseX = script.headObj.getTransform().getLocalPosition().x;
    }   
    
    // Start Running Logic
    currentLane = 0; 
    playAnimation(script.runAnimName);
    
    // --- PUBLIC API: Called by CollisionDetector ---
    script.api.triggerDeath = function() {
        if (isGameOver) return;
        
        isGameOver = true;
        canInput = false; 
        
        // 1. Calculate Final Score & Update UI (Keep your existing score logic here)
        var finalScore = Math.floor(score);
        var currentHighScore = store.getFloat("BestScore") || 0;
        
        if (finalScore > currentHighScore) {
            currentHighScore = finalScore;
            store.putFloat("BestScore", currentHighScore);
            print("🏆 New High Score Saved: " + currentHighScore);
        }

        if (script.gameOverUI) script.gameOverUI.enabled = true;
        if (script.finalScoreText) script.finalScoreText.text = "Score: " + finalScore.toString();
        if (script.highScoreText) script.highScoreText.text = "High Score: " + currentHighScore.toString();

        // 2. CRITICAL CHANGE: Disable Run, Play Death
        if (script.animPlayer) {
            // Force the "Run" animation to STOP completely
            script.animPlayer.setClipEnabled(script.runAnimName, false);
            
            // Play "Death" once (because it's set to 'Single' in Inspector)
            script.animPlayer.playClip(script.deathAnimName);
        }
        
        // 3. Stop Road
        if (script.levelGenerator && script.levelGenerator.api.setSpeedZero) {
            script.levelGenerator.api.setSpeedZero();
        }
    };
}

function onUpdate(eventData) {
    if (isGameOver) {
       // Optional: Ensure run animation stops if needed, though Death anim usually overrides it
       return;
    }
    
    // Update Score (Live)
    if (script.scoreText) {
        score += script.increaseRate;
        script.scoreText.text = Math.floor(score).toString();
    }

    if (!script.headObj || !script.character) return;
    
    var deltaTime = eventData.getDeltaTime();
    
    // Track Head Movement
    var headTransform = script.headObj.getTransform();
    var currentNosePos = headTransform.getLocalPosition();
    
    if (canInput) {
        var movementDelta = currentNosePos.x - lastNoseX;

        if (movementDelta < -script.sensitivity && currentLane > -1) {
            changeLane(-1); 
            startInputCooldown();
        } 
        else if (movementDelta > script.sensitivity && currentLane < 1) {
            changeLane(1);
            startInputCooldown();
        }
    }

    lastNoseX = currentNosePos.x;
    updatePhysics(deltaTime);
}

function startInputCooldown() {
    canInput = false;
    var delayEvent = script.createEvent("DelayedCallbackEvent");
    delayEvent.bind(function() {
        if (!isGameOver) canInput = true;
    });
    delayEvent.reset(script.inputDelay);
}

function changeLane(direction) {
    // 1. Safety Check
    if (isGameOver) return;
    
    // 2. Update the Lane Number
    currentLane += direction;
    currentLane = Math.max(-1, Math.min(1, currentLane));
    
    // 3. REMOVED: The logic that tries to play 'right' or 'left' animation.
    // The character will now just slide to the new lane while continuing to "Run".
}

function updatePhysics(deltaTime) {
    if (isGameOver) return;

    var transform = script.character.getTransform();
    var currentPos = transform.getLocalPosition();
    var targetX = currentLane * script.laneWidth;
    
    currentPos.x = MathUtils.lerp(currentPos.x, targetX, deltaTime * script.moveSpeed);
    currentPos.y = 0; // Ensure character stays on ground
    
    transform.setLocalPosition(currentPos);
}

function playAnimation(clipName) {
    if (script.animPlayer && clipName) {
        script.animPlayer.playClip(clipName);
    }
}

// --- PUBLIC RESET API ---
script.api.isGameOver = function() {
    return isGameOver;
};

// --- PUBLIC RESET API ---
script.api.resetPlayer = function() {
    isGameOver = false;
    canInput = true;
    score = 0;
    currentLane = 0;
    
    // Reset Live Score UI
    if (script.scoreText) {
        script.scoreText.text = "0";
    }

    // Reset Position
    if (script.character) {
        script.character.getTransform().setLocalPosition(new vec3(0, 0, 0)); 
    }
    
    // CRITICAL CHANGE: Re-enable Run, Start Playing
    if (script.animPlayer) {
        // Turn "Run" back ON so it loops again
        script.animPlayer.setClipEnabled(script.runAnimName, true);
        
        // Play it immediately
        script.animPlayer.playClip(script.runAnimName);
    }
    
    print("✅ Player Reset & Running");
};

script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("OnStartEvent").bind(onStart);