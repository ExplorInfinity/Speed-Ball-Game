import { Gradient } from "./utils.js";
import { TrailEffect, FireTrail, GoldenTrail, setEffect } from "./particles.js";
import * as Prop from './prop_component.js';

export class PreviewPlayer {
    constructor( playerType, context, effectContext, 
                { baseSpeed=5, hue=185, size=30, startPos, effectProps }={}) {
        this.playerType = playerType;

        this.canvas = context.canvas;
        this.context = context;
        this.effectsCanvas = effectContext.canvas;
        this.effectsContext = effectContext;

        this.fixedPos = startPos??{
            x: this.canvas.width*0.625, 
            y: this.canvas.height*0.5
        };

        this.x = 0;
        this.y = 0;
        this.size = size;

        this.baseSpeed = baseSpeed;
        this.speedX = 5;
        this.speedY = 0;
        this.currentAngle = 0;

        this.playerColor = hue;
        if(effectProps) this.effect = setEffect(this, effectProps);        
    }

    addCustomization() {
        this.controller = new AbortController();
        const signal = this.controller.signal;

        const properties = [
            Prop.createProperty('Player Color', 'playerColor', this, 'playerColor', 0, 360, 1, signal), 
            Prop.createProperty('Player Size', 'playerSize', this, 'size', this.size, 75, 1, signal)
        ];
        
        this.effect.setPreviewType();

        const bubbleTrail = document.getElementById('bubble');
        const fireTrail = document.getElementById('fire');
        const goldenTrail = document.getElementById('golden');
        const trails = { bubbleTrail, fireTrail, goldenTrail };
        
        this.#setTrailType(trails);
        [bubbleTrail, fireTrail, goldenTrail].forEach(t => 
            t.addEventListener('change', e => 
                this.#changeTrail(e.target.value), { signal }));

        this.abort = () => {
            this.controller.abort();
            this.effect.abort();
            for(const prop of properties) prop.abort();
        }
    }

    getProps() {
        const { playerType, playerColor: hue, size } = this;
        return { playerType, hue, size }
    }

    #setTrailType(trails) {
        switch(true) {
            case this.effect instanceof TrailEffect:
                trails.bubbleTrail.checked = true;
                break
            case this.effect instanceof FireTrail:
                trails.fireTrail.checked = true;
                break
            case this.effect instanceof GoldenTrail:
                trails.goldenTrail.checked = true;
                break
        }
    }

    #changeTrail(trailValue) {
        // console.log(this.effect.properties);
        this.effect.abort();
        // console.log(this.effect.properties);
        
        switch(trailValue) {
            case 'golden':
                this.effect = new GoldenTrail(this);
                break
            case 'fire':
                this.effect = new FireTrail(this);
                break
            case 'bubble':
                this.effect = new TrailEffect(this);
                break
        }
        // console.log(this.effect);
        
        this.effect.setPreviewType();
    }

    drawOnEffectsCanvas() {
        this.effectsContext.save();
        this.effectsContext.translate(this.fixedPos.x, this.fixedPos.y);

        this.effectsContext.translate(-this.x, -this.y);
        this.effect.draw(this.effectsContext);
        this.effectsContext.restore();
    }

    update(deltaTime, loopFactor) {        
        this.x += this.speedX * loopFactor;
        this.effect.update(deltaTime, loopFactor);
    }

    draw() {
        this.effectsContext.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.context.save();
        this.context.translate(this.fixedPos.x, this.fixedPos.y);
        this.context.translate(-this.x, -this.y);

        if(this.effect && this.effect.type === 'normal')
            this.effect.draw(this.context);

        this.drawPlayer();

        this.context.restore();

        if(this.effect && this.effect.type === 'overlay') 
            this.drawOnEffectsCanvas();
    }
}

export class PreviewBall extends PreviewPlayer{
    constructor(context, effectContext, 
        { baseSpeed=5, hue=185, size=30, startPos, effectProps }={}) {
        super('ball', context, effectContext, 
              { baseSpeed, hue, size, startPos, effectProps });
        if(!effectProps) this.effect = new TrailEffect(this, {maxParticles:100, particleCount: 10});
        this.addCustomization();        
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

export class PreviewStar extends PreviewPlayer{
    constructor(context, effectContext, 
        { baseSpeed=5, hue=60, size=60, startPos, effectProps }={}) {
        super('star', context, effectContext, 
              { baseSpeed, hue, size, startPos, effectProps });
        this.rotationOffset = Math.PI*0.5;
        this.rotationSpeed = 0.2;

        if(!effectProps) this.effect = new GoldenTrail(this);
        this.addCustomization();
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

    #createGradient() {
        this.gradient = this.context.createRadialGradient(0, 0, 0, 0, 0, this.size);
        Gradient.glow(this.gradient, this.playerColor);
    }

    #drawStar() {
        this.context.save();
        this.context.translate(this.x, this.y);

        this.context.beginPath();
        this.#makeStarBody();
        for(const point of this.body) {
            this.context.lineTo(point.x, point.y);
        }
        this.#createGradient();
        this.context.fillStyle = this.gradient;
        this.context.fill();

        this.context.restore();
    }

    #drawStarFace() {
        this.#setSmileAttributes();
        this.context.save();
        this.context.fillStyle = this.starFaceColor;
        this.context.lineWidth = this.faceOutlineWidth;
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

        this.context.restore();
    }

    drawPlayer() {
        this.#drawStar();
        this.#drawStarFace();
    }
}