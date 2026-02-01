// @input SceneObject obstacleLeft
// @input SceneObject obstacleCenter
// @input SceneObject obstacleRight
// @input float spawnChance = 0.6 {"label": "Density (0-1)", "min":0.0, "max":1.0}

function onStart() {
    // 1. Create a list of the 3 existing objects
    var obstacles = [script.obstacleLeft, script.obstacleCenter, script.obstacleRight];

    // 2. Loop through each one
    for (var i = 0; i < obstacles.length; i++) {
        var obs = obstacles[i];
        
        if (obs) {
            // First, assume it is OFF to clean up previous states
            obs.enabled = false;
            
            // Roll the dice
            // If random value (0.0 to 1.0) is less than our density (e.g., 0.6)
            // turn the object ON.
            if (Math.random() < script.spawnChance) {
                obs.enabled = true;
            }
        }
    }
}
print(script.spawnChance);
var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);