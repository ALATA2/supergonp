import Game from './classes/Game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    
    // Instantiate the Game engine
    // It will automatically bind events and wait for input to start
    window.gameEngine = new Game(canvas);
});
