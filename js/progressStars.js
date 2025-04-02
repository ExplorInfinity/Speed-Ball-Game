import { createStarBody, drawStarBody, Gradient, roundOff } from "./utils.js";

export class StarAnimation {
    constructor(context, pivot, starSize=30, starShowCount=3, starCount=3, { starHue=60 }={}) {        
        this.context = context;
        this.starSize = starSize;
        this.starBody = createStarBody(starSize, starSize*0.5);
        
        this.starCount = starCount;
        this.starShowCount = Math.min(starShowCount, starCount);
        this.starShownCounter = 0;
        
        this.pivot = pivot;
        this.starPadding = 10;
        this.#createStarPivots();

        this.starStartingSize = 300;
        this.currentStarSize = this.starStartingSize;
        this.currentAngle = 0;

        this.sizeReduceSpeed = 0.96; // [0, 1]
        this.rotationAmp = 2.5;

        this.starStrokeStyle = 'gray';
        this.starLineWidth = 2;
        this.starHue = starHue;

        this.timer = 0;
        this.timeInterval = 50;
    }

    #createStarPivots() {
        this.starPivots = [];        
        for(let i = -(this.starCount-1)*0.5; i <= (this.starCount-1)*0.5; i++) {
            this.starPivots.push({
                x: this.pivot.x + (this.starSize*2 + this.starPadding) * i, 
                y: this.pivot.y, 
            });
        }        
    }

    createGlowGradient(pivot, radius) {
        const gradient = this.context.createRadialGradient(pivot.x, pivot.y, 0, pivot.x, pivot.y, radius);
        Gradient.glow(gradient, this.starHue, 0.9);
        return gradient
    }

    resize(pivot) {
        this.pivot = pivot;
        this.#createStarPivots();
    }

    update(deltaTime) {
        this.timer += deltaTime;

        if (this.timer >= this.timeInterval && 
            this.starShownCounter < this.starShowCount) {
            const loopFactor = roundOff(deltaTime*0.125, 1);

            if(this.currentStarSize > this.starSize) {
                this.currentStarSize *= this.sizeReduceSpeed ** loopFactor;
                this.currentAngle = (this.starSize / this.currentStarSize - 1) * this.rotationAmp;
            } else {
                this.starShownCounter++;
                this.currentStarSize = this.starStartingSize;
                this.currentAngle = 0;
                this.timer = 0;
            }
        }
    }

    draw() {
        const { context } = this;
        for(let i = 0; i < this.starPivots.length; i++) {
            const currentPivot = this.starPivots[i];            
            drawStarBody(context, this.starBody, currentPivot.x, currentPivot.y);
            if(i < this.starShownCounter) {
                context.fillStyle = this.createGlowGradient(currentPivot, this.starSize);
                context.fill();
            } else {
                context.strokeStyle = this.starStrokeStyle;
                context.lineWidth = this.starLineWidth;
                context.stroke();
            }
        }

        if( this.timer >= this.timeInterval && 
            this.starShownCounter < this.starShowCount) {
            const currentStarPivot = this.starPivots[this.starShownCounter];

            context.save();
            context.translate(currentStarPivot.x, currentStarPivot.y);
            context.rotate(this.currentAngle);

            const newStarBody = createStarBody(this.currentStarSize, this.currentStarSize*0.5);
            drawStarBody(context, newStarBody, 0, 0);
            context.fillStyle = this.createGlowGradient({x: 0, y: 0}, this.currentStarSize);
            context.fill();

            context.restore();
        }
    }
}