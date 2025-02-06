import { FireTrail, GoldenTrail, setEffect, TrailEffect } from "./particles.js";
import { Gradient } from "./utils.js";
import * as Prop from './prop_component.js';

export class Player {
    constructor(
            game, 
            { baseSpeed=5, hue=185, size=20, startPos, effectProps }={}
        ) {
        this.game = game;
        this.track = game.track;
        this.context = game.context;

        this.x = startPos ? startPos.x : this.track.trackRects[2].x + this.track.width*0.5;
        this.y = startPos ? startPos.y : this.track.trackRects[2].y + this.track.width*0.5;
        this.size = size;
        this.collisionOffset = 0; //size*0.5;

        this.start = false;
        this.baseSpeed = baseSpeed;
        this.maxSpeed = 10;
        this.maxedOutSpeed = 15;
        this.speedX = 0;
        this.speedY = 0;
        this.currentAngle = 0;

        this.startDistance = this.x + this.y;
        this.distanceMark = 500;
        this.distanceMarked = 0;
        this.speedIncrease = 2;

        this.playerColor = hue;

        this.keyPressed = false;
        window.addEventListener('keydown', e => this.#handleKeyDown(e));
        window.addEventListener('keyup', () => this.keyPressed=false);

        // Effects Trail
        this.effectsCanvas = game.effectsCanvas;
        this.effectsContext = game.effectsContext;

        if(effectProps) this.effect = setEffect(this, effectProps);

        this.iterations = 0;
        this.timeElapsed = 0;
        this.updateFrameRateInterval = 500;
        this.frameRate = 0;
    }

    setEffect(effectProps) {
        const trails = { 
            "bubbleTrail": TrailEffect,  
            "fireTrail": FireTrail, 
            'goldenTrail': GoldenTrail
        };
        return new trails[effectProps.trailName](this, effectProps)
    }

    #handleKeyDown(e) {
        const keyPressed = e.code;
        if(keyPressed === 'Space' && !this.keyPressed) {
            this.keyPressed = true;
            if (this.start) {
                this.speedX = this.speedX > 0 ? 0 : this.baseSpeed;
                this.speedY = this.speedY > 0 ? 0 : this.baseSpeed;
            } else {
                this.speedX = this.baseSpeed;
                this.start = true;
            }
        }
    }

    #isPlayerOnTrack() {
        this.context.beginPath();
        for(const rect of this.track.trackRects) {
            rect.drawPath(this.context, this.collisionOffset);
        }

        let isPointOutside = false;
        let outsidePoint = null;
        for(const point of this.body) {
            const x = this.x + point.x;
            const y = this.y + point.y;
            if(!this.context.isPointInPath(x, y)){
                isPointOutside = true;
                outsidePoint = point;
                break
            }
        }

        if(isPointOutside) {
            this.game.setGameOver();
            do {
                if(this.speedX > 0) this.x -= 1;
                if(this.speedY > 0) this.y -= 1;
            } while (!this.context.isPointInPath(this.x + outsidePoint.x, this.y + outsidePoint.y));
            this.speedX = this.speedY = 0;
        }
    }

    changeSize(newSize) {
        this.size = newSize;
        this.track.playerSize = newSize;
        this.collisionOffset
    }

    getDistanceCovered() {
        return Math.ceil((this.x + this.y - this.startDistance) * 0.01);
    }

    update(deltaTime, loopFactor) {
        this.timeElapsed += deltaTime;
        if(this.timeElapsed >= this.updateFrameRateInterval) {
            this.frameRate = Math.round(this.iterations / (this.updateFrameRateInterval * 0.001));
            this.timeElapsed -= this.updateFrameRateInterval;
            this.iterations = 0;
        }
        this.iterations++;
        
        if(this.start) {
            this.x += this.speedX * loopFactor;
            this.y += this.speedY * loopFactor;

            if(this.baseSpeed >= this.maxSpeed) this.baseSpeed = this.maxSpeed;
            else if(this.baseSpeed < this.maxSpeed) this.baseSpeed *= 1.0002 ** loopFactor;

            if( this.maxSpeed <= this.maxedOutSpeed && 
                this.getDistanceCovered() - this.distanceMarked >= this.distanceMark) {
                this.maxSpeed += this.speedIncrease;
                if(this.maxSpeed > this.maxedOutSpeed) this.maxSpeed = this.maxedOutSpeed;
                this.distanceMarked += this.distanceMark;
            }

            this.#isPlayerOnTrack();
            if(this.effect) this.effect.update(deltaTime, loopFactor);
        }
    }

    drawStats() {
        this.context.save();
        this.context.shadowOffsetX = 1.5;
        this.context.shadowOffsetY = 1.5;
        this.context.shadowBlur = 2;
        this.context.shadowColor = 'hsl(0,0%,0%)';
        this.context.font = '20px Arial';
        this.context.fillStyle = 'hsl(184, 100.00%, 90.60%)';
        this.context.fillText(`Speed: ${this.baseSpeed.toFixed(1)}`, 20, 40);
        this.context.fillText(`Distance: ${this.getDistanceCovered()}`, 20, 70);
        this.context.fillText(`Frame Rate: ${this.frameRate}`, 20, 100);
        // this.context.fillText(`Trail Size: ${this.effect.particles.length}`, 20, 100);
        // this.context.fillText(`Current Angle: ${this.currentAngle/(Math.PI*0.5)}`, 20, 100);
        this.context.restore();
    }

    draw() {
        if(this.effect.type === 'normal') {
            this.effect.draw(this.context);
        }
        this.drawPlayer();
        if(this.effect.type === 'overlay') {
            this.effect.draw(this.effectsContext);
        }
    }
}

export class Ball extends Player {
    constructor(
        game, 
        { baseSpeed=5, hue=185, size=35, startPos, effectProps }={}
    ) {        
        super(game, { baseSpeed, hue, size, startPos, effectProps });
        this.#createBody();
        if(!effectProps) this.effect = new TrailEffect(this);
    }

    #createBody() {
        this.body = [];
        for(let i = 0; i < 2*Math.PI; i += Math.PI*0.1) {
            this.body.push({
                x: Math.cos(i) * this.size * 0.5, 
                y: Math.sin(i) * this.size * 0.5, 
            });
        }
    }

    #createGradient() {
        this.gradient = this.context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        Gradient.lightToDark(this.gradient, this.playerColor);
        // Gradient.glow(this.gradient, this.playerColor);
    }

    drawPlayer() {
        this.#createGradient();
        this.context.fillStyle = this.gradient;

        this.context.beginPath();
        this.context.arc(this.x, this.y, this.size*0.5, 0, 2*Math.PI);
        this.context.fill();
    }
}

export class Star extends Player {
    constructor(
        game, 
        { baseSpeed=5, hue=60, size=60, startPos, effectProps }={}
    ) {
        super(game, { baseSpeed, hue, size, startPos, effectProps });

        this.body = [];
        this.#makeStarBody();
        this.#setSmileAttributes();

        this.rotationOffset = Math.PI*0.5;
        this.rotationSpeed = 0.2;

        if(!effectProps) this.effect = new GoldenTrail(this);
    }

    #createGradient() {
        this.gradient = this.context.createRadialGradient(0, 0, 0, 0, 0, this.size);
        Gradient.glow(this.gradient, this.playerColor);
    }

    changeSize(newSize) {
        super.changeSize(newSize);
        this.#makeStarBody();
        this.#setSmileAttributes();
    }

    update(deltaTime, loopFactor) {
        super.update(deltaTime, loopFactor);

        const offset = (this.speedX > 0 || this.speedY === 0) ? 0 : this.rotationOffset;
        const rotationSpeed = this.rotationSpeed * loopFactor;
        if (!this.game.gameOver) {    
            if(Math.abs(this.currentAngle-offset) <= rotationSpeed) this.currentAngle = offset;
            else if(offset > this.currentAngle) this.currentAngle += rotationSpeed;
            else if (offset < this.currentAngle) this.currentAngle -= rotationSpeed;
        }
    }

    #setSmileAttributes() {
        this.starFaceColor = 'black';
        const sizeFactor = this.size * 0.025;
        this.eyePos1 = {x: 3 * sizeFactor, y: -3 * sizeFactor};
        this.eyePos2 = {x: 3 * sizeFactor, y: 3 * sizeFactor};
        this.eyeSize = 1.5;

        this.smilePos1 = {x: -3 * sizeFactor, y: -3 * sizeFactor};
        this.smilePos2 = {x: -3 * sizeFactor, y: 3 * sizeFactor};
        this.smileControlPos = {x: -6 * sizeFactor, y: 0};
        this.smileOutlineWidth = 1.5;
    }

    #makeStarBody() {
        this.body = [];
        const radius = this.size*0.5;
        const innerRadius = this.size*0.25;

        for(let i = this.currentAngle; i < 2*Math.PI + this.currentAngle + 0.01; i += Math.PI*0.4) {
            const outerPoint = {
                x: Math.cos(i)*radius, 
                y: Math.sin(i)*radius
            };
            const innerPoint = {
                x: Math.cos(i+Math.PI*0.2)*innerRadius, 
                y: Math.sin(i+Math.PI*0.2)*innerRadius
            };
            this.body.push(outerPoint, innerPoint);
        }        
    }

    #drawStar() {
        // const radius = this.size*0.5;
        // const innerRadius = this.size*0.25;

        // this.context.beginPath();
        // for(let i = this.currentAngle; i < 2*Math.PI + this.currentAngle + 0.01; i += Math.PI*0.4) {
        //     const x = this.x + Math.cos(i)*radius;
        //     const y = this.y + Math.sin(i)*radius;
        //     const innerX = this.x + Math.cos(i+Math.PI*0.2)*innerRadius;
        //     const innerY = this.y + Math.sin(i+Math.PI*0.2)*innerRadius;
        //     this.context.lineTo(x, y);
        //     this.context.lineTo(innerX, innerY);
        // }

        this.context.save();
        this.context.translate(this.x, this.y);
        this.context.rotate(this.currentAngle);

        this.context.beginPath();
        for(const point of this.body) {
            this.context.lineTo(point.x, point.y);
        }
        this.#createGradient();
        this.context.fillStyle = this.gradient;
        this.context.fill();

        this.context.restore();
    }

    #drawStarFace() {
        this.context.save();
        this.context.fillStyle = this.starFaceColor;
        this.context.strokeStyle = this.starFaceColor;
        this.context.lineWidth = this.smileOutlineWidth;
        this.context.translate(this.x, this.y);
        this.context.rotate(this.currentAngle);

        // Eyes
        this.context.beginPath();
        this.context.arc(this.eyePos1.x, this.eyePos1.y, this.eyeSize, 0, 2*Math.PI);
        this.context.arc(this.eyePos2.x, this.eyePos2.y, this.eyeSize, 0, 2*Math.PI);
        this.context.fill();

        // Smile
        this.context.beginPath();
        this.context.moveTo(this.smilePos1.x, this.smilePos1.y);
        this.context.quadraticCurveTo(
            this.smileControlPos.x, this.smileControlPos.y, 
            this.smilePos2.x, this.smilePos2.y);
        this.context.stroke();

        // this.context.translate(-this.x, -this.y);
        // this.context.rotate(-this.currentAngle);
        this.context.restore();
    }

    drawPlayer() {
        this.#drawStar();
        this.#drawStarFace();
    }
}