// @input Asset.ObjectPrefab groundPrefab
// @input float forwardSpeed = 8.0 {"label": "Speed (Z)"}
// @input float spawnBuffer = 40.0
// @input float chunkLength = 20.0
// @input float destroyZ = 10.0

var chunks = [];
var isStopped = false;
var initialSpeed = 10.0; // Variable to store your real speed

function onStart() {
    // Save the speed you set in Inspector
    initialSpeed = script.forwardSpeed; 

    script.api.setSpeedZero = function() {
        script.forwardSpeed = 0;
        isStopped = true;
        print("⛔ Road Speed set to 0");
    };
    
    // ... (rest of onStart) ...
    if (!script.groundPrefab) return;
    spawnInitialRoad();
}

function spawnInitialRoad() {
    var currentZ = 0.0; 
    while (currentZ > -script.spawnBuffer * 1.5) {
        spawnChunk(currentZ);
        currentZ -= script.chunkLength;
    }
}

function onUpdate(eventData) {
    if (isStopped) return; // Stop processing if speed is 0

    var deltaTime = eventData.getDeltaTime();
    
    // Move all chunks
    for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];
        if (chunk) {
            var pos = chunk.getTransform().getLocalPosition();
            pos.z += script.forwardSpeed * deltaTime;
            chunk.getTransform().setLocalPosition(pos);
        }
    }
    
    // Cleanup and Spawning logic...
    cleanupAndSpawn();
}

// ... (rest of your existing helper functions like spawnChunk) ...

function cleanupAndSpawn() {
    if (chunks.length > 0) {
        // Destroy old
        if (chunks[0].getTransform().getLocalPosition().z > script.destroyZ) {
            chunks[0].destroy();
            chunks.shift();
        }
        // Spawn new
        var lastChunk = chunks[chunks.length - 1];
        if (lastChunk.getTransform().getLocalPosition().z > -script.spawnBuffer) {
            spawnChunk(lastChunk.getTransform().getLocalPosition().z - script.chunkLength);
        }
    }
}

function spawnChunk(zPos) {
    var newChunk = script.groundPrefab.instantiate(script.getSceneObject());
    var transform = newChunk.getTransform();
    var pos = transform.getLocalPosition();
    pos.z = zPos;
    pos.x = 0; pos.y = 0;
    transform.setLocalPosition(pos);
    chunks.push(newChunk);
}

script.createEvent("UpdateEvent").bind(onUpdate);
script.createEvent("OnStartEvent").bind(onStart);

script.api.resetLevel = function() {
    // 1. Clear existing chunks
    for (var i = 0; i < chunks.length; i++) {
        if (chunks[i]) chunks[i].destroy();
    }
    chunks = [];
    
    // 2. Reset speed to the SAVED value
    script.forwardSpeed = initialSpeed; 
    isStopped = false;
    
    // 3. Respawn Road
    spawnInitialRoad();
    
    print("✅ Road Reset with Speed: " + initialSpeed);
};