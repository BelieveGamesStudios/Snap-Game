// @input Component.ScriptComponent blinkDetector
// @input Component.ScriptComponent levelGenerator
// @input Component.ScriptComponent collisionDetector
// @input SceneObject gameOverUI

var tapEvent = script.createEvent("TapEvent");

tapEvent.bind(function() {
    if (script.blinkDetector && script.blinkDetector.api.isGameOver()) {
        print("👆 Tap Detected: Restarting...");
        
        // Hide the Game Over screen immediately on restart
        if (script.gameOverUI) {
            script.gameOverUI.enabled = false;
        }

        if (script.collisionDetector && script.collisionDetector.api.resetCollision) {
            script.collisionDetector.api.resetCollision();
        }
        if (script.levelGenerator && script.levelGenerator.api.resetLevel) {
            script.levelGenerator.api.resetLevel();
        }
        if (script.blinkDetector && script.blinkDetector.api.resetPlayer) {
            script.blinkDetector.api.resetPlayer();
        }
    }
});