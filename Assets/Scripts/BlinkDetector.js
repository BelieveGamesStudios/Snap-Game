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

// State variables
var currentLane = 0;
var lastNoseX = 0;
var canInput = true; 
var isGameOver = false; // Flag to freeze the game
var score = 0; // Score variable moved here

function onStart() {
    if (!script.animPlayer) {
        print("ERROR: Please assign Animation Player");
        return;
    }
    
    // Initialize Nose X
    if (script.headObj) {
        lastNoseX = script.headObj.getTransform().getLocalPosition().x;
    } else {
        print("ERROR: Please assign Head Binding Object");
    }   
    
    // Start running
    playAnimation(script.runAnimName);
    changeLane(-1); 
    
    // --- PUBLIC API: Called by CollisionDetector ---
    script.api.triggerDeath = function() {
        if (isGameOver) return;
        
        // 1. LOCK STATE
        isGameOver = true;
        canInput = false; // Explicitly kill input
        
        print("🛑 GAME OVER: Input and Movement Stopped");

        // 2. Play Death Animation (Overrides Run)
        playAnimation(script.deathAnimName);
        
        // 3. Stop the Road (Call LevelGenerator)
        if (script.levelGenerator && script.levelGenerator.api.setSpeedZero) {
            script.levelGenerator.api.setSpeedZero();
        }
    };
}

function onUpdate(eventData) {
    // --- STOP GAME BLOCK ---
    // If Game Over is true, we RETURN immediately. 
    // This stops physics AND stops the score from increasing below.
    if (isGameOver) 
    {
       script.animPlayer.setClipEnabled(script.runAnimName,false);
       return;
    }
    // ------------------------
    
    // --- SCORE LOGIC ---
    // This is now inside the safety check, so it stops when isGameOver = true
    if (script.scoreText) {
        score += script.increaseRate;
        script.scoreText.text = Math.floor(score).toString();
    }
    // -------------------

    if (!script.headObj || !script.character) return;
    
    var deltaTime = eventData.getDeltaTime();
    
    // Get current nose/head X position
    var headTransform = script.headObj.getTransform();
    var currentNosePos = headTransform.getLocalPosition();
    
    // --- NOSE SWIPE LOGIC ---
    if (canInput) {
        var movementDelta = currentNosePos.x - lastNoseX;

        // Swipe Left
        if (movementDelta < -script.sensitivity && currentLane > -1) {
            changeLane(-1); 
            startInputCooldown();
        } 
        // Swipe Right
        else if (movementDelta > script.sensitivity && currentLane < 1) {
            changeLane(1);
            startInputCooldown();
        }
    }

    // Update tracking for next frame
    lastNoseX = currentNosePos.x;
    
    updatePhysics(deltaTime);
}

function startInputCooldown() {
    // Even if cooldown finishes, isGameOver check in Update prevents input
    canInput = false;
    var delayEvent = script.createEvent("DelayedCallbackEvent");
    delayEvent.bind(function() {
        if (!isGameOver) canInput = true;
    });
    delayEvent.reset(script.inputDelay);
}

function changeLane(direction) {
    // Double check to prevent movement after death
    if (isGameOver) return;
    currentLane += direction;
    currentLane = Math.max(-1, Math.min(1, currentLane));
    
    // Play side animation
    var animToPlay = (direction > 0) ? script.rightAnimName : script.leftAnimName;
    
    if (animToPlay) {
        playAnimation(animToPlay);
        
        // Schedule return to Run
        var returnEvent = script.createEvent("DelayedCallbackEvent");
        returnEvent.bind(function() {
            // CRITICAL: Don't go back to 'Run' if we died during the swipe
            if (!isGameOver) {
                playAnimation(script.runAnimName);
            }
        });
        returnEvent.reset(0.4);
    }
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

function playAnimation(clipName) {
    if (script.animPlayer && clipName) {
        var clip = script.animPlayer.getClip(clipName);
        if (clip) {
            script.animPlayer.playClip(clipName);
        }
    }
}

script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("OnStartEvent").bind(onStart);