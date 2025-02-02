import { Ball, Star } from "./js/player.js";
import { PreviewBall, PreviewPlayer, PreviewStar } from "./js/previewPlayer.js";
import { PowerUps } from "./js/powerups.js";
import { Track } from "./js/track.js";
import { Color, drawStarBody, Gradient, roundOff, setShadow } from "./js/utils.js";
import { TrailEffect } from "./js/particles.js";
import { Setup } from "./setup.js";
import { StarAnimation } from "./js/progressStars.js";

const canvas = document.getElementById('canvas');
const effectsCanvas = document.getElementById('effectsCanvas');
const gameStatsCanvas = document.getElementById('gameStatsCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const previewEffects = document.getElementById('previewEffects');
previewCanvas.width = previewEffects.width = 650;

class Game {
    constructor(handler, context, effectsContext, gameStatsContext, { trackWidth=150, playerSize=60, setupIndex }={}) {
        this.setupIndex = setupIndex;        
        const setup = setupIndex >= 0 ? Setup.retrieveSetup(setupIndex) : null;

        this.handler = handler;
        this.canvas = context.canvas;
        this.context = context;
        this.effectsCanvas = effectsContext.canvas;
        this.effectsContext = effectsContext;
        this.gameStatsCanvas = gameStatsContext.canvas;
        this.gameStatsContext = gameStatsContext;

        if(setup) {
            this.track = new Track(this, context, trackWidth, { playerSize: setup.playerProps.size });
            this.#setPlayer(setup.playerProps, setup.effectProps);
        } else {
            this.track = new Track(this, context, trackWidth, { playerSize });
            this.player = new Star(this, { size: playerSize });
        }

        this.trackStart = {
            x: this.canvas.width*0.5, 
            y: this.canvas.height*0.7, 
        };
        this.trackRotation = -0.75*Math.PI;
        this.trackOffscreen = {
            width: this.canvas.width, 
            height: this.canvas.height, 
        };

        this.start = false;
        this.gameOver = false;

        this.debug = false;
        
        this.starsSize = 25;
        this.starsHue = 60;
        this.starsPos = { x: this.canvas.width*0.5, y: this.canvas.height*0.6 };
        
        // this.setGameOver();
    }

    #setPlayer(playerProps, effectProps) {
        const props = { ...playerProps, effectProps };
        switch(playerProps.playerType) {
            case 'ball':
                this.player = new Ball(this, props);
                break
            case 'star':
                this.player = new Star(this, props);
                break
        }
    }

    setGameOver() {
        this.gameOver = true;
        const distanceTravelled = this.player.getDistanceCovered();
        const starsEarned = this.track.distanceMilestone.reduce(
            (acc, current, i) => distanceTravelled >= current ? i+1 : acc, 0);
        this.progressStars = new StarAnimation(
            this.gameStatsContext, this.starsPos, this.starsSize, 
            starsEarned, this.track.distanceMilestone.length, { starHue: this.starsHue });

        const controller = new AbortController();
        const signal = controller.signal;
        window.addEventListener('keydown', e => {
            const keyPressed = e.key;            
            if(keyPressed === 'Enter') {
                this.handler.createNewGame(this.setupIndex);
                controller.abort();
            }
        }, { signal });
    }

    resize() {
        this.trackStart = {
            x: this.canvas.width*0.5, 
            y: this.canvas.height*0.7, 
        };
        this.trackOffscreen = {
            width: this.canvas.width, 
            height: this.canvas.height, 
        };
        this.track.resize();
        this.starsPos = { x: this.canvas.width*0.5, y: this.canvas.height*0.6 };
        if(this.gameOver) {
            this.progressStars.resize(this.starsPos);
        }
    }

    update(deltaTime) {
        const loopFactor = roundOff(deltaTime*0.0625, 1);
        if (!this.gameOver) {
            this.player.update(deltaTime, loopFactor);
            this.track.update(deltaTime, {
                x: this.player.x, 
                y: this.player.y, 
            });
        } else {
            this.progressStars.update(deltaTime);
        }
    }

    #drawGameOver() {
        // const fontSize = Math.max(20, Math.min(70 * (this.canvas.width * 0.000625), 70));
        // const fontSize2 = Math.max(5, Math.min(17 * (this.canvas.width * 0.000625), 17));
        const fontSize = 70, fontSize2 = 17;
        const rectHeight = 350;
        this.gameStatsContext.fillStyle = 'rgba(0,0,0,0.5)';
        this.gameStatsContext.fillRect(0, this.canvas.height*0.425 - rectHeight*0.35, this.canvas.width, rectHeight)
        this.gameStatsContext.save();
        this.gameStatsContext.textBaseline = 'middle';
        this.gameStatsContext.textAlign = 'center';
        this.gameStatsContext.font = `${fontSize}px Cursive`;
        setShadow(this.gameStatsContext, 2, 2, 1, 'black');
        this.gameStatsContext.fillStyle = 'lightgreen';
        // this.gameStatsContext.fillStyle = 'lightblue';
        
        const pixelRatio = window.devicePixelRatio || 1;
        this.gameStatsContext.scale(pixelRatio, pixelRatio);
        this.gameStatsContext.fillText('Game Over!', canvas.width*0.5 / pixelRatio, canvas.height*0.425 / pixelRatio);
        
        this.gameStatsContext.font = `${fontSize2}px Cursive`;
        this.gameStatsContext.fillText(`Press 'Enter' to start new game.` , canvas.width*0.5 / pixelRatio, (canvas.height*0.425 + 80) / pixelRatio);
        this.gameStatsContext.restore();

        this.progressStars.draw();
    }

    #drawGame() {
        this.context.save();
        this.context.translate(this.trackStart.x, this.trackStart.y);
        this.context.rotate(this.trackRotation);

        this.effectsContext.save();
        this.effectsContext.translate(this.trackStart.x, this.trackStart.y);
        this.effectsContext.rotate(this.trackRotation);

        this.context.translate(-this.player.x, -this.player.y);
        this.effectsContext.translate(-this.player.x, -this.player.y);

        this.track.draw(this.context);
        this.player.draw(this.context);

        if(this.debug) this.#drawDebug();

        this.context.restore();
        this.effectsContext.restore();
    }

    #drawStats() {
        this.player.drawStats();
    }

    #drawDebug() {
        this.context.beginPath();
        for(const rect of this.track.trackRects) {
            rect.drawPath(this.context, this.player.size*0.5);
        }
        this.context.stroke();
    }

    draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.effectsContext.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
        this.gameStatsContext.clearRect(0, 0, this.gameStatsCanvas.width, this.gameStatsCanvas.height);
        this.#drawGame();
        this.#drawStats();
        if (this.gameOver) this.#drawGameOver();
    }
}

class Handler {
    constructor(canvas, effectsCanvas, gameStatsCanvas, previewCanvas, previewEffects) {
        this.canvas = canvas;
        this.effectsCanvas = effectsCanvas;
        this.gameStatsCanvas = gameStatsCanvas;
        this.previewCanvas = previewCanvas;
        this.previewEffects = previewEffects;

        this.context = canvas.getContext('2d');
        this.effectsContext = effectsCanvas.getContext('2d');
        this.gameStatsContext = gameStatsCanvas.getContext('2d');
        this.previewContext = previewCanvas.getContext('2d');
        this.previewEffectsContext = previewEffects.getContext('2d');

        this.canvases = [canvas, effectsCanvas, gameStatsCanvas];

        this.setFullScreenCanvas();
        window.addEventListener('resize', () => {
            this.setFullScreenCanvas()
            if(this.game) this.game.resize();
        });

        this.lastTime = 0;

        const setupListItems = document.querySelectorAll('.setupName');
        for(const setupListItem of setupListItems) {
            setupListItem.addEventListener('click', e => {
                const setupNumber = Number(e.target.getAttribute('setupNumber'));            
                
                if(setupNumber >= 0 && !isNaN(setupNumber)) {
                    this.createNewGame(setupNumber);
                    document.getElementById('savedSetups').close();
                }
            });
        }

        const openCustomisationPanelBtn = document.getElementById('openCustomisationPanel');
        openCustomisationPanelBtn.addEventListener('click', () => this.openCustomisationPanel());

        const showSavedSetupsBtn = document.getElementById('showSavedSetups');
        showSavedSetupsBtn.addEventListener('click', () => {
            document.getElementById('savedSetups').showModal();
            this.#removeFocusFromOptions();
        });

        this.downloads = [];
        this.takeScreenShot = false;
        let isKeyPressed = false;
        window.addEventListener('keydown', e => {
            if(isKeyPressed) return
            const keyPressed = e.key.toLowerCase();
            if(keyPressed === 's') this.takeScreenShot = true;
            if(keyPressed === 'd') this.downloadScreenShots();
            isKeyPressed = true;
        });
        window.addEventListener('keyup', e => {
            isKeyPressed = false;
        });
    }

    downloadScreenShots() {
        for(const link of this.downloads) link.click();
        this.downloads.length = 0;
    }

    #removeFocusFromOptions() {
        document.getElementById('options').addEventListener('focusin', e => e.target.blur(), { once: true });
    }

    setFullScreenCanvas() {
        for(const canvas of this.canvases) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    createNewGame(setupIndex) {  
        this.game = new Game(this, this.context, this.effectsContext, this.gameStatsContext, { setupIndex });
    }

    initialize(setupIndex) {
        this.createNewGame(setupIndex);
        this.animate(0);
    }

    setPreviewSettings() {
        const ballPlayer = document.getElementById('ball');
        const starPlayer = document.getElementById('star');

        const controller = new AbortController();
        const signal = controller.signal;
        ballPlayer.checked = true;
        [ballPlayer, starPlayer].forEach(btn => 
            btn.addEventListener('change', e => {
                this.previewPlayer.abort();
                this.#setPlayer(e.target.value);
            }, { signal })
        );

        this.stopPreview = () => {
            document.getElementById('panel').textContent = '';
            this.previewing = false;
            this.previewPlayer = null;
            controller.abort();
            document.getElementById('customisationPanel').close();
        };

        // Customisation Panel Actions
        const closeBtn = document.getElementById('customTabClosebtn');
        closeBtn.addEventListener('click', () => this.stopPreview(), { signal });
        const startGameBtn = document.getElementById('startGame');
        startGameBtn.addEventListener('click', () => {
            const setupName = window.prompt('Name your Setup: ');

            if(setupName.trim().length > 0) {
                const setupIndex = this.#saveCustomSetup(setupName.trim());
                this.stopPreview();
                this.initialize(setupIndex);
            }
        }, { signal });
        const saveSetupBtn = document.getElementById('saveSetup');
        saveSetupBtn.addEventListener('click', () => {
            const setupName = window.prompt('Name your Setup: ');
            if(setupName.trim().length > 0) {
                this.#saveCustomSetup(setupName.trim());
            }
        }, { signal });
        const playDefaultBtn = document.getElementById('playDefault');
        playDefaultBtn.addEventListener('click', () => {
            this.initialize();
            this.stopPreview();
        }, { signal });
    }

    #saveCustomSetup(setupName) {
        const playerProps = this.previewPlayer.getProps();
        const effectProps = this.previewPlayer.effect.getProps();
        const setup = { playerProps, effectProps, setupName };
        const setupIndex = Setup.saveSetup(setup);
        return setupIndex
    }

    openCustomisationPanel() {
        this.setPreviewSettings();
        this.customisationPanel = document.getElementById('customisationPanel');
        this.customisationPanel.showModal();
        this.#removeFocusFromOptions();

        // Player and effect preview
        this.#setPlayer('ball');
        this.previewing = true;
        this.previewLastTime = 0;
        this.preview(0);
    }

    #setPlayer(playerType) {
        switch(playerType) {
            case 'ball':
                this.previewPlayer = new PreviewBall(this.previewContext, this.previewEffectsContext);
                break
            case 'star':
                this.previewPlayer = new PreviewStar(this.previewContext, this.previewEffectsContext);
                break
        }
    }

    preview(timestamp) {
        if(this.previewing) {
            const deltaTime = timestamp - this.previewLastTime;
            this.previewLastTime = timestamp;
    
            const loopFactor = deltaTime * 0.0625; 
    
            this.previewPlayer.update(deltaTime, loopFactor);
            this.previewPlayer.draw();

            requestAnimationFrame((time) => this.preview(time));
        }
    }

    #getScreenShot() {
        const photoCanvas = document.createElement('canvas');
        const ctx = photoCanvas.getContext('2d');
        photoCanvas.width = window.innerWidth;
        photoCanvas.height = window.innerHeight;

        ctx.fillStyle = 'hsl(0,0%,10%)';
        ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
        ctx.drawImage(this.canvas, 0, 0);
        ctx.save();
        ctx.filter = 'blur(5px)';
        ctx.drawImage(this.effectsCanvas, 0, 0);
        ctx.restore();
        ctx.drawImage(this.gameStatsCanvas, 0, 0);

        photoCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Screenshot-SpeedBall-Milestone-${this.game.track.milestoneIndex}`;
            this.downloads.push(a);
        }, 'image.png', 1);     
    }

    animate(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (document.hasFocus() || !this.game.start) {
            this.game.update(deltaTime);
            this.game.draw();
            if(this.takeScreenShot) {
                this.#getScreenShot();
                this.takeScreenShot = false;
            }
        }

        requestAnimationFrame((t) => this.animate(t));
    }
}

const handler = new Handler(canvas, effectsCanvas, gameStatsCanvas, previewCanvas, previewEffects);

window.addEventListener('load', () => {
    handler.initialize();
}, { once: true });