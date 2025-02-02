import { PowerUps } from "./powerups.js";
import { ColorRect, Rectangle } from "./rectangle.js";
import { Gradient } from "./utils.js";

export class Track {
    constructor(game, context, width=150, { playerSize=60 }={}) {
        this.game = game;
        this.context = context;
        this.width = width;
        this.playerSize = playerSize;

        this.trackRects = [];
        this.maxTrackRectsGen = 
            Math.floor(window.innerHeight / this.width)*2;
        this.currentRectIndex = 0;
        this.difficulity = 2;
        this.max_difficulity = 3;
        this.trackX = 0;
        this.trackY = 0;
        this.trackHues = [197, 344, 160, 35, 330, 180];
        this.borderHues = ['skyblue', 'crimson', 'lightgreen', 'hsl(30, 100%, 75%)', 'hsl(330, 100%, 70%)', 'hsl(175, 100%, 40%)'];
        this.distanceMilestone = [200, 500, 1000, 1500, 2000];
        this.gradientTypesIndex = [0, 0, 0, 1, 1, 0];
        this.gradientTypes = [Gradient.darkToDarkest, Gradient.dark_35ToDarkest];
        this.milestoneIndex = 1;
        this.checkMilestones = false;
        this.drawGuides = false;

        this.#generateTrack();
        this.powerHandler = new PowerUps(this.game, this);
    }

    resize() {
        this.maxTrackRectsGen = 
            Math.floor(window.innerHeight / this.width)*2;
    }

    #getTrackLength() {
        return this.width * (2 + Math.random()*this.difficulity + (this.max_difficulity-this.difficulity))
    }

    #generateTrack() {
        for(let i = 0; i < this.maxTrackRectsGen; i++) this.#addRect();        
        this.checkMilestones = true;
    }

    #addRect() {
        const length = this.#getTrackLength();
        const trackHue = this.trackHues[this.milestoneIndex];
        const borderHue = this.borderHues[this.milestoneIndex];
        const gradientType = this.gradientTypes[this.gradientTypesIndex[this.milestoneIndex]];
        if(this.currentRectIndex % 2 === 0) {
            this.trackRects.push(
                new Rectangle(this.trackX, this.trackY, length, this.width, 
                trackHue, borderHue, gradientType));
            this.trackX += length - this.playerSize;
        } else {
            this.trackRects.push(
                new Rectangle(this.trackX, this.trackY, this.width, length, 
                trackHue, borderHue, gradientType));
            this.trackY += length - this.playerSize;
        }
        this.currentRectIndex++;
        
        if( this.checkMilestones && this.milestoneIndex < this.distanceMilestone.length && 
            ((this.trackX + this.trackY) - this.game.player.startDistance)*0.01 >= this.distanceMilestone[this.milestoneIndex]) {
                this.milestoneIndex++;
        }
    }

    update(deltaTime, playerPos) {
        for(const rect of this.trackRects) {
            if( playerPos.x - (rect.x + rect.width) > this.game.trackOffscreen.width || 
                playerPos.y - (rect.y + rect.height) > this.game.trackOffscreen.height
            ) rect.offScreen = true;
        }
        this.trackRects = this.trackRects.filter(r => !r.offScreen);
        
        if(this.trackRects.length < this.maxTrackRectsGen) this.#addRect();

        this.powerHandler.update(deltaTime);
    }

    draw() {
        for(const rect of this.trackRects) {
            rect.draw(this.context, this.drawGuides);
        }
        this.powerHandler.draw(this.context)
    }
}