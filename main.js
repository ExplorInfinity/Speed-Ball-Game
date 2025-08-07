import { Ball, players, Star } from "./js/player.js";
import { PreviewBall, previewPlayers, PreviewStar } from "./js/previewPlayer.js";
import { Track } from "./js/track.js";
import { Color, drawStarBody, Gradient, isMobile, roundOff, setShadow } from "./js/utils.js";
import { Setup } from "./setup.js";
import { StarAnimation } from "./js/progressStars.js";
import { RadialMenu } from "./js/radialMenu.js";
import { WorleyHandler } from "./js/worleyNoiseGen.js";
import settingsController from "./js/settings.js";

const canvas = document.getElementById('canvas');
const effectsCanvas = document.getElementById('effectsCanvas');
const gameStatsCanvas = document.getElementById('gameStatsCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const previewEffects = document.getElementById('previewEffects');
previewCanvas.width = previewEffects.width = 650;

class Game {
    constructor(
        handler, context, effectsContext, gameStatsContext, 
        { trackWidth=150, setupIndex, defaultPlayer=Ball }={}) {

        this.setupIndex = setupIndex;        
        const setup = setupIndex >= 0 ? Setup.retrieveSetup(setupIndex) : null;

        this.handler = handler;
        this.canvas = context.canvas;
        this.context = context;
        this.effectsCanvas = effectsContext.canvas;
        this.effectsContext = effectsContext;
        this.gameStatsCanvas = gameStatsContext.canvas;
        this.gameStatsContext = gameStatsContext;

        this.track = new Track(this, context, trackWidth);
        this.defaultPlayer = defaultPlayer;
        if(setup) this.#setPlayer(setup);
        else this.player = new defaultPlayer(this);

        this.background = new WorleyHandler(this, context);
        if(localStorage.getItem('betaTester')) {
            this.background.start();
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
        
        this.starsSize = isMobile() ? 20 : 25;
        this.starsHue = 60;
        this.starsPos = { x: this.canvas.width*0.5, y: this.canvas.height*0.5 + 100};        
    }

    #setPlayer(setup) {
        const { playerProps, effectProps } = setup;
        const { playerType } = playerProps;
        const props = { ...playerProps, effectProps };
        this.player = new players[playerType](this, props);
    }

    setGameOver() {
        this.gameOver = true;
        this.player.eventListeners.abort();

        const distanceCovered = this.player.getDistanceCovered();
        const starsEarned = this.track.distanceMilestone.reduce(
            (acc, current, i) => distanceCovered >= current ? i+1 : acc, 0);
        this.progressStars = new StarAnimation(
            this.gameStatsContext, this.starsPos, this.starsSize, 
            starsEarned, this.track.distanceMilestone.length, { starHue: this.starsHue });

        this.handler.setGameStats(distanceCovered, starsEarned, this.track.powerHandler.powersTaken);

        const controller = new AbortController();
        const signal = controller.signal;
        window.addEventListener('keydown', e => {
            const keyPressed = e.key;            
            if(keyPressed === 'Enter') {
                this.handler.createNewGame(this.setupIndex, this.defaultPlayer);
                controller.abort();
            }
        }, { signal });

        let lastTouch;
        let registerTouch = false;
        this.gameStatsCanvas.addEventListener('touchstart', () => {
            registerTouch = true;
        }, { signal });
        this.gameStatsCanvas.addEventListener('touchend', () => {
            if(registerTouch) {
                if(lastTouch && Date.now() - lastTouch < 300) {
                    this.handler.createNewGame(this.setupIndex, this.defaultPlayer);
                    controller.abort();
                }
                lastTouch = Date.now();
                registerTouch = false;
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
        this.starsPos = { x: this.canvas.width*0.5, y: this.canvas.height*0.5 + 100 };
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
            this.background.update(deltaTime);
        } else {
            this.progressStars.update(deltaTime);
        }
    }

    #drawGameOver() {
        const { gameStatsCanvas: canvas, gameStatsContext: context } = this;
        
        context.save();
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        if(isMobile()) {
            const getFontSize = (text) => {
                let fontSize = 5;
                let width = 0;
                while(width < window.innerWidth * 0.225) {
                    context.font = `${fontSize}px Arial`;
                    width = context.measureText(text).width;
                    fontSize++;
                }

                return fontSize
            }
            const offset = 0, offset2 = -2;
            const rectHeight = 275;
            const rectOffset = 20;
            context.fillStyle = 'rgba(0,0,0,0.5)';
            context.fillRect(0, (this.canvas.height - rectHeight)*0.5 + rectOffset, this.canvas.width, rectHeight);
    
            const mainText = 'Game Over!';
            const fontSize = getFontSize(mainText);
            setShadow(context, 2, 2, 1, 'black');
            context.fillStyle = 'lightgreen';
            // context.fillStyle = 'lightblue'
            
            const pixelRatio = window.devicePixelRatio || 1;
            context.scale(pixelRatio, pixelRatio);
            context.fillText(mainText, canvas.width*0.5 / pixelRatio, canvas.height*0.5 / pixelRatio - fontSize*0.5 + offset);

            const description = 'Double Tap to start new game.'
            getFontSize(description);
            context.fillText(description, 
                canvas.width * 0.5 / pixelRatio, 
                canvas.height * 0.5 / pixelRatio + fontSize*0.5 + offset2);
            } else {
                const fontSize = 70, fontSize2 = 17;
                const offset = 0, offset2 = -25;
                const rectHeight = 375;
                context.fillStyle = 'rgba(0,0,0,0.5)';
                context.fillRect(0, (this.canvas.height - rectHeight)*0.5, this.canvas.width, rectHeight);
        
                context.font = `${fontSize}px Cursive`;
                setShadow(context, 2, 2, 1, 'black');
                context.fillStyle = 'lightgreen';
                // context.fillStyle = 'lightblue';
                
                const pixelRatio = window.devicePixelRatio || 1;
                context.scale(pixelRatio, pixelRatio);
                context.fillText('Game Over!', canvas.width*0.5 / pixelRatio, canvas.height*0.5 / pixelRatio - fontSize*0.5 + offset);
                
                context.font = `${fontSize2}px Cursive`;
                context.fillText(`Press 'Enter' to start new game.`, canvas.width*0.5 / pixelRatio, (canvas.height) * 0.5 / pixelRatio + fontSize*0.5 + offset2);
            }
        context.restore();
        
        this.progressStars.draw();
    }

    #drawBackground() {
        this.background.draw();
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
            rect.drawPath(this.context, this.player.collisionOffset);
        }
        this.context.stroke();
    }

    draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.effectsContext.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
        this.gameStatsContext.clearRect(0, 0, this.gameStatsCanvas.width, this.gameStatsCanvas.height);
        this.#drawBackground();
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

        this.canvases = [canvas, effectsCanvas, gameStatsCanvas]; // main game canvases

        // Animation Loop
        this.mainScreen = false;
        this.pause = true;
        this.lastTime = 0;

        // Cursor
        const cursorTimeout = 3000;
        this.#addAutoCursorHide(cursorTimeout);

        // Canvas Size
        this.setFullScreenCanvas();
        window.addEventListener('resize', () => {
            this.setFullScreenCanvas()
            if(this.game) this.game.resize();
            if(this.radialMenu) this.radialMenu.resize();
        });

        // Saved Setups
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

        const showSavedSetupsBtn = document.getElementById('showSavedSetups');
        showSavedSetupsBtn.addEventListener('click', () => {
            document.getElementById('savedSetups').showModal();
            this.#removeFocusFromOptions();
        });

        // Customisation
        const openCustomisationPanelBtn = document.getElementById('openCustomisationPanel');
        openCustomisationPanelBtn.addEventListener('click', () => this.openCustomisationPanel());

        // Screenshot
        this.downloads = [];
        this.takeScreenShot = false;
        let isKeyPressed = false;
        window.addEventListener('keydown', e => {
            if(isKeyPressed) return;
            const key = e.key.toLowerCase();
            if(key === 's') {
                this.takeScreenShot = true;
            } else if(key === 'd') {
                this.downloadScreenShots();
            }
            isKeyPressed = true;
        });
        window.addEventListener('keyup', () => {
            isKeyPressed = false;
        });
        
        // Stats
        const showStatsBtn = document.getElementById('showStats');
        showStatsBtn.addEventListener('click', () => {
            showStatsBtn.addEventListener('focusin', e => e.target.blur(), { once: true })
        });
        this.getGameStats();

        // Background options (Radial Menu)
        this.radialMenu = new RadialMenu(this, this.gameStatsContext);
    }

    #addAutoCursorHide(timeout) {
        let timer = 0;
        window.addEventListener('mousemove', () => {
            clearTimeout(timer);
            document.body.style.cursor = 'auto';
            timer = setTimeout(() => {
                document.body.style.cursor = 'none';
            }, timeout);
        });
    }

    setGameStats(newDistanceCovered=0, newStarsEarned=0, newStarsCollected=0) {
        this.bestRun = this.bestRun < newDistanceCovered ? newDistanceCovered : this.bestRun;
        this.distanceCovered += newDistanceCovered;
        this.starsEarned += newStarsEarned;
        this.starsCollected += newStarsCollected;
        const { bestRun, distanceCovered, starsEarned, starsCollected } = this;
        const stats = { bestRun, distanceCovered, starsEarned, starsCollected };
        localStorage.setItem('stats', JSON.stringify(stats));
        this.updateGameStats();
    }

    getGameStats() {
        const stats = localStorage.getItem('stats') || '{}';
        const { bestRun=0, distanceCovered=0, starsEarned=0, starsCollected=0 } = JSON.parse(stats);
        this.bestRun = bestRun;
        this.distanceCovered = distanceCovered;
        this.starsEarned = starsEarned;
        this.starsCollected = starsCollected;            
        this.updateGameStats();
    }

    updateGameStats() {
        document.getElementById('bestRun').textContent = `Best Run: ${this.bestRun}`;
        document.getElementById('distanceCovered').textContent = `Distance Covered: ${this.distanceCovered}`;
        document.getElementById('starsEarned').textContent = `Stars Earned: ${this.starsEarned}`;
        document.getElementById('starsCollected').textContent = `Stars Collected: ${this.starsCollected}`;
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

    downloadScreenShots() {
        for(const link of this.downloads) link.click();
        this.downloads.length = 0;
    }

    #removeFocusFromOptions() {
        document.getElementById('options').addEventListener('focusin', e => e.target.blur(), { once: true });
    }

    setFullScreenCanvas() {
        for(const canvas of this.canvases) {
            if(isMobile()) {
                canvas.width = screen.width;
                canvas.height = screen.height;
            } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        }
    }

    createNewGame(setupIndex, defaultPlayer) {  
        this.game = new Game(this, this.context, this.effectsContext, 
            this.gameStatsContext, { setupIndex, defaultPlayer });
    }

    initialize() {
        const setDisplay = (id, display) => {
            const element = document.getElementById(id);
            element.style.display = display;
        }
        this.createNewGame();

        play.addEventListener('click', () => {
            setDisplay('loadingScreen', 'none');
            setDisplay('options', 'flex');
            settingsController.abort();
            this.pause = false;
            this.mainScreen = true;
            this.animate(0);
        }, { once: true });

        requestIdleCallback(() => {
            setDisplay('loadingText', 'none');
            setDisplay('play', 'block');
        }, { timeout: 500 })
    }

    setPreviewSettings() {
        const ballPlayer = document.getElementById('ball');
        const starPlayer = document.getElementById('star');

        const players = {
            'ball': { unlocked: true }, 
            'star': { unlocked: true }, 
        };

        const controller = new AbortController();
        const signal = controller.signal;
        ballPlayer.checked = true;
        for(const btn of [ballPlayer, starPlayer]) {
            btn.addEventListener('change', e => {
                if(players[e.target.value].unlocked) {
                    this.previewPlayer.abort();
                    this.#setPlayer(e.target.value);
                } else {
                    const buyPopup = document.getElementById('buyPopup');
                    buyPopup.showModal();
                }
            }, { signal });
        }

        this.stopPreview = () => {
            this.previewPlayer.abort();
            controller.abort();
            document.getElementById('customisationPanel').close();
            this.previewing = false;
            this.previewPlayer = null;
        };

        // Customisation Panel Actions
        const closeBtn = document.getElementById('customTabClosebtn');
        closeBtn.addEventListener('click', () => this.stopPreview(), { signal });
        const startGameBtn = document.getElementById('startGame');
        startGameBtn.addEventListener('click', () => {
            const setupIndex = this.#saveCustomSetup('Once', true);
            this.stopPreview();
            this.createNewGame(setupIndex);
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
            this.createNewGame(-1, this.previewPlayer instanceof PreviewBall ? Ball : Star);
            this.stopPreview();
        }, { signal });
    }

    #saveCustomSetup(setupName, once=false) {
        const playerProps = this.previewPlayer.getProps();
        const effectProps = this.previewPlayer.effect.getProps();
        const setup = { playerProps, effectProps, setupName };
        const setupIndex = Setup.saveSetup(setup, once);
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
        const { previewContext: context, previewEffectsContext: effectsContext } = this;
        this.previewPlayer = new previewPlayers[playerType](context, effectsContext);
    }

    preview(timestamp) {
        if(this.previewing) {
            const deltaTime = timestamp - this.previewLastTime;
            this.previewLastTime = timestamp;
    
            const loopFactor = deltaTime * 0.0625;

            const isSmallDevice = isMobile(); 
            const previewContexts = [this.previewContext, this.previewEffectsContext];
            if(isSmallDevice) {
                for(const context of previewContexts) {
                    context.save();
                    context.translate(-context.canvas.width * 0.25, -context.canvas.height * 0.25);
                    context.scale(1.5, 1.5);
                }
            }
            
            this.previewPlayer.update(deltaTime, loopFactor);
            this.previewPlayer.draw();
            
            if(isSmallDevice) {
                for(const context of previewContexts) {
                    context.restore();
                }
            }
            requestAnimationFrame((time) => this.preview(time));
        }
    }

    animate(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (document.hasFocus() || !this.game.start) {
            // Update
            if(!this.pause) this.game.update(deltaTime);
            this.radialMenu.update(deltaTime);

            // Draw
            this.game.draw();
            this.radialMenu.draw();

            // Screenshot after drawing
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