import { clamp, createStarBody, drawStarBody, getRandomInteger, Gradient, roundOff } from "./utils.js";

export class PowerUps {
    constructor(game, track) {
        this.game = game;
        this.track = track;
        this.context = game.context;

        this.distanceTravelled = -100;
        this.distanceInterval = 100;

        this.powers = [];
        this.powersTaken = 0;
        this.timer = 0;
        this.trackLightsInterval = 7000;
    }

    #addPowerUpToMap() {
        const trackRects = this.track.trackRects;
        const player = this.game.player;
        const aheadDist = getRandomInteger(10, 20);
        const selectedRect = 
            trackRects.find(rect => (rect.x + rect.y)*0.01 > (player.x + player.y)*0.01 + aheadDist) ??
            trackRects[trackRects.length-1];
        const playerSize = this.game.player.size*0.5;
        const x = (selectedRect.x + playerSize) + Math.random() * (selectedRect.width - playerSize*2);
        const y = (selectedRect.y + playerSize) + Math.random() * (selectedRect.height - playerSize*2);
            
        this.powers.push(new PowerUp(x, y));
    }

    update(deltaTime) {
        const distance = this.game.player.getDistanceCovered();
        
        if(distance - this.distanceTravelled >= this.distanceInterval) {
            this.#addPowerUpToMap();
            this.distanceTravelled = distance - (distance % this.distanceInterval);
        }

        const player = this.game.player;
        for(const power of this.powers) {
            if(!power.taken) {
                const dx = player.x - power.x;
                const dy = player.y - power.y;
                const distance = dx**2 + dy**2;
                const minDist = (player.size + power.size)**2;

                if(distance <= minDist) {
                    power.taken = true;
                    this.powersTaken++;
                    this.track.drawGuides = true;
                    this.timer = 0;
                }
            }
            power.update(deltaTime);
        }

        this.powers = this.powers.filter(p => !p.offScreen);

        if(this.track.drawGuides) {
            this.timer += deltaTime;
            if(this.timer >= this.trackLightsInterval) this.track.drawGuides = false;
        }
    }

    draw() {
        for(const power of this.powers) {
            power.draw(this.context);
        }
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.minSize = 15;
        this.maxSize = 30;

        this.starHue = 197;
        this.starBody = createStarBody(this.size, this.size*0.5);

        this.angle = 0;
        this.angleSpeed = 0.05;
        
        this.taken = false;
        this.offScreen = false;
    }

    createGlowGradient(context) {
        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, this.size);
        Gradient.glow(gradient, this.starHue, 0.9);
        return gradient
    }

    update(deltaTime) {
        const loopFactor = roundOff(deltaTime * 0.0625, 1);
        if(this.taken) {
            this.size += 0.5 * loopFactor;
            this.angle += 0.07 * loopFactor;
            this.starBody = createStarBody(this.size, this.size*0.5);
            if(this.size >= this.maxSize) this.offScreen = true;
        } else {
            this.angle += this.angleSpeed * loopFactor;
            if(Math.abs(this.angle) >= Math.PI*0.25) this.angleSpeed *= -1;
        }
    }

    draw(context) {
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.angle);
        if(this.taken) context.globalAlpha = 1 - ((this.size-this.minSize) / (this.maxSize-this.minSize)); 
        context.fillStyle = this.createGlowGradient(context);
        drawStarBody(context, this.starBody, 0, 0);
        context.fill();
        context.restore();
    }
}