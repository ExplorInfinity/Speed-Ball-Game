import * as Prop from "./prop_component.js";
import { createConsecutiveLines, getRandomInteger, Gradient } from "./utils.js";

export class Particle {
    constructor(player, x, y, size, hue=185, playerSpeed) {
        this.player = player;
        this.x = x;
        this.y = y;
        this.defaultSize = size;
        this.size = size;
        this.maxSize = 5;
        this.maxSize = size*2;
        this.hue = hue;
        this.Hue = `hsl(${hue}, ${getRandomInteger(70, 100)}%, ${getRandomInteger(70, 85)}%)`;

        this.playerSpeed = playerSpeed;
        this.speedX = playerSpeed.x*0.1 + (Math.random()-0.5);
        this.speedY = playerSpeed.y*0.1 + (Math.random()-0.5);
        this.friction = 0.98;
        this.sizeSpeed = Math.random() * 0.01 + 1.015;

        this.offscreen = false;
    }

    reset() {
        this.size = this.defaultSize; 
        this.x = this.player.x + (Math.random()-0.5)*this.player.size;
        this.y = this.player.y + (Math.random()*1.2 - 0.5)*this.player.size;
        this.Hue = `hsl(185, ${getRandomInteger(70, 100)}%, ${getRandomInteger(70, 85)}%)`;
        this.speedX = this.playerSpeed[0]*0.1 + Math.random() - 0.5;
        this.speedY = this.playerSpeed[1]*0.1 + Math.random() - 0.5;
        this.sizeSpeed = Math.random() * 0.01 + 1.015;
        this.offscreen = false;
    }

    update(loopFactor) {
        this.x += (this.speedX*=(this.friction ** loopFactor)) * loopFactor;
        this.y += (this.speedY*=(this.friction ** loopFactor)) * loopFactor;

        this.size *= this.sizeSpeed ** loopFactor;

        if(this.size >= this.maxSize) this.offscreen = true;
        // if(this.size >= this.maxSize) this.reset();
    }

    draw(context) {
        context.save();
        context.globalAlpha = (1 - (this.size/this.maxSize));
        context.fillStyle = this.Hue;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, 2*Math.PI);
        context.fill();
        context.restore();
    }
}

export class TrailEffect {
    constructor(player, { trailHue=185, particleSize=9, particleCount=10, maxParticles=100 }={}) {
        this.trailName = 'bubbleTrail';
        this.game = player.game;
        this.player = player;
        this.particles = [];
        this.timer = 0;
        this.timeInterval = 50;
        this.type = 'overlay';

        this.trailHue = trailHue;

        this.particleSize = particleSize;
        this.particleCount = particleCount;
        this.maxParticles = maxParticles;
    }

    setPreviewType() {
        this.controller = new AbortController();
        const signal = this.controller.signal;
        this.properties = [
            Prop.createProperty('Trail Hue', 'trailHue', this, 'trailHue', 0, 360, 1, signal),
            Prop.createProperty('Max Particles', 'maxParticles', this, 'maxParticles', 10, 150, 2, signal),
            Prop.createProperty('Particle Size', 'particleSize', this, 'particleSize', 1, 20, 1, signal),
            Prop.createProperty('Particle Generation', 'particleCount', this, 'particleCount', 1, 20, 1, signal)
        ];

        this.abort = () => {
            this.controller.abort();
            for(const prop of this.properties) {
                prop.abort();
            }
        }
    }

    getProps() {
        const { trailName, trailHue, particleSize, particleCount, maxParticles } = this;
        return { trailName, trailHue, particleSize, particleCount, maxParticles }
    }

    #addParticles(count=1) {
        for (let i = 0; i < count; i++) {
            this.particles.push(
                new Particle(
                    this.player,
                    this.player.x + (Math.random()-0.5)*this.player.size, 
                    this.player.y + (Math.random()*1.2 - 0.5)*this.player.size, 
                    this.particleSize, 
                    this.trailHue, 
                    {x: this.player.speedX, y: this.player.speedY}));
        }
    }

    update(deltaTime, loopFactor) {
        this.timer += deltaTime;

        if( this.particles.length <= this.maxParticles && 
            this.timer >= this.timeInterval) {
            this.#addParticles(this.particleCount);
            this.timer = 0;            
        }

        for(const particle of this.particles) {
            particle.update(loopFactor);
        }

        this.particles = this.particles.filter(p => !p.offscreen);
    }

    draw(context) {
        for(const particle of this.particles) particle.draw(context);
    }
}

export class Tracer {
    constructor(trailName, player, { trailHue=197, maxPoints=20 }={}) {
        this.trailName = trailName;
        this.player = player;
        this.trailHue = trailHue;
        this.points = [{x: this.player.x, y: this.player.y}];
        this.timer = 0;
        this.timeInterval = 30;
        this.type = 'normal';

        this.maxPoints = maxPoints;
    }

    setPreviewType() {
        this.controller = new AbortController();
        const signal = this.controller.signal;
        this.properties = [
            Prop.createProperty('Trail Hue', 'trailHue', this, 'trailHue', 0, 360, 1, signal)
        ];

        this.abort = () => {
            this.controller.abort();
            for(const prop of this.properties) {
                prop.abort();
            }
        }
    }
    
    #addPoint() {
        const point = {
            x: this.player.x + (this.player.speedX > 0 ? this.pointOffset.x : 0), 
            y: this.player.y + (this.player.speedY > 0 ? this.pointOffset.y : 0)
        };

        // Removing an curves
        const prevPoint = this.points[this.points.length-1];
        if(prevPoint.x !== point.x && prevPoint.y !== point.y) {
            this.points.push({
                x: (this.player.speedX > 0 ? prevPoint.x : point.x) , 
                y: (this.player.speedY > 0 ? prevPoint.y : point.y) 
            });
            // console.log('Extra Point Added', prevPoint, {
            //     x: (this.player.speedX > 0 ? prevPoint.x : point.x) , 
            //     y: (this.player.speedY > 0 ? prevPoint.y : point.y) ,
            //     addedPoint: true
            // },point); 
        }
        this.points.push(point);
    }

    update(deltaTime) {
        this.timer += deltaTime;

        if( this.points.length <= this.maxPoints && 
            this.timer >= this.timeInterval) {
            this.#addPoint();
            this.timer = 0;            
        }

        while(this.points.length > this.maxPoints) this.points.shift();
    }
}

export class FireTrail extends Tracer {
    constructor(player, 
        { trailHue=60, maxPoints=20, trailBlurness=2, 
          trailWidth=12, minTrailWidth=0.3, lineResolution=5 }={}
    ) {
        super('fireTrail', player, { trailHue, maxPoints });
        this.pointOffset = {
            x: this.player.size*0.25, 
            y: this.player.size*0.25
        };
        
        this.trailLines = [];
        this.trailBlurness = trailBlurness;
        this.trailWidth = trailWidth;
        this.minTrailWidth = minTrailWidth; // [0, 1]
        this.lineResolution = lineResolution;
    }

    setPreviewType() {
        super.setPreviewType();

        const signal = this.controller.signal;
        this.properties.push(
            Prop.createProperty('Trail Blurness', 'trailBlurness', this, 'trailBlurness', 0, 10, 0.5, signal), 
            Prop.createProperty('Trail Width', 'trailWidth', this, 'trailWidth', 5, 50, 1, signal), 
            Prop.createProperty("Trail's Tail Width", 'minTrailWidth', this, 'minTrailWidth', 0, 1, 0.1, signal), 
            Prop.createProperty('Trail Resolution', 'lineResolution', this, 'lineResolution', 1, 10, 0.1, signal), 
            Prop.createProperty('Trail Length', 'maxPoints', this, 'maxPoints', 10, 50, 1, signal), 
        )        
    }

    getProps() {
        const { trailName, trailHue, trailBlurness, trailWidth, minTrailWidth, lineResolution, maxPoints } = this;
        return { trailName, trailHue, trailBlurness, trailWidth, minTrailWidth, lineResolution, maxPoints }
    }

    #createGradient(context) {
        const gradient = context.createRadialGradient(
            this.player.x, this.player.y, 0, this.player.x, this.player.y, 
            ((this.player.x-this.points[0].x)**2 + (this.player.y-this.points[0].y)**2)**0.5);
        Gradient.visibleToInvisible(gradient, this.trailHue);
        return gradient
    }

    #createTrailPoints() {
        let currentPoint = this.points[0];
        const points = [currentPoint];
        for(let i = 1; i < this.points.length; i++) {
            const point = this.points[i];

            if( point.x === currentPoint.x || 
                point.y === currentPoint.y ) continue

            points.push(this.points[i-1]);
            currentPoint = this.points[i-1];
        }

        const lastPoint = this.points[this.points.length-1];
        if(lastPoint !== points[points.length-1]) points.push(lastPoint);

        const lines = createConsecutiveLines(points);

        const stepLength = this.lineResolution;
        const trailPoints = [];
        for(const line of lines) {
            const isLineOnXaxis = line.p1.x !== line.p2.x;
            const length = isLineOnXaxis ? (line.p2.x-line.p1.x) : (line.p2.y-line.p1.y);
            for(let i = 1; i < Math.ceil(length/stepLength); i++) {
                if (isLineOnXaxis) {
                    const x = line.p1.x + stepLength*i;
                    trailPoints.push({x: (x < line.p2.x ? x : line.p2.x), y: line.p1.y});
                } else {
                    const y = line.p1.y + stepLength*i;
                    trailPoints.push({x: line.p1.x, y: (y < line.p2.y ? y : line.p2.y)});
                }
            }
        }
        this.trailLines = createConsecutiveLines(trailPoints);
    }

    #getTrailWidth(i) {
        return this.trailWidth * ((((i+1) / this.trailLines.length) * (1-this.minTrailWidth)) + this.minTrailWidth)
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.#createTrailPoints();
    }

    draw(context) {
        context.save();

        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = this.trailWidth;
        context.filter = `blur(${this.trailBlurness}px)`;
        context.strokeStyle = this.#createGradient(context);

        for(let i = 0; i < this.trailLines.length; i++) {
            const trailLine = this.trailLines[i];
            context.lineWidth = this.#getTrailWidth(i);
            context.beginPath();
            context.moveTo(trailLine.p1.x, trailLine.p1.y);
            context.lineTo(trailLine.p2.x, trailLine.p2.y);
            context.stroke();
        }

        context.restore();
    }
}

export class GoldenTrail extends Tracer {
    constructor(player, { trailHue, maxPoints, trailBlurness, trailWidth }={}) {
        super('goldenTrail', player, { trailHue, maxPoints });
        this.pointOffset = { x: 0, y: 0 };
        
        this.trailLines = [];
        this.setUps = [
            [197, 25, 0, 7], 
            [60, 20, 0, this.player.size], 
            [60, 15, 0, 15]
        ];
        const setUpIndex = 2;
        this.trailHue = trailHue ?? this.setUps[setUpIndex][0];
        this.maxPoints = maxPoints ?? this.setUps[setUpIndex][1];
        this.trailBlurness = trailBlurness ?? this.setUps[setUpIndex][2];
        this.trailWidth = trailWidth ?? this.setUps[setUpIndex][3];
    }

    setPreviewType() {
        super.setPreviewType();

        const signal = this.controller.signal;
        this.properties.push(
            Prop.createProperty('Trail Blurness', 'trailBlurness', this, 'trailBlurness', 0, 10, 0.5, signal), 
            Prop.createProperty('Trail Width', 'trailWidth', this, 'trailWidth', 5, 50, 1, signal), 
            Prop.createProperty("Trail Length", 'maxPoints', this, 'maxPoints', 10, 50, 1, signal), 
        )        
    }

    getProps() {
        const { trailName, trailHue, maxPoints, trailBlurness, trailWidth } = this;
        return { trailName, trailHue, maxPoints, trailBlurness, trailWidth }
    }

    #createGradient(context) {
        const gradient = context.createRadialGradient(
            this.player.x, this.player.y, 0, this.player.x, this.player.y, 
            ((this.player.x-this.points[0].x)**2 + (this.player.y-this.points[0].y)**2)**0.5);
        Gradient.visibleToInvisible(gradient, this.trailHue);
        return gradient
    }

    #createTrailPoints() {
        let currentPoint = this.points[0];
        const points = [currentPoint];
        for(let i = 1; i < this.points.length; i++) {
            const point = this.points[i];

            if( point.x === currentPoint.x || 
                point.y === currentPoint.y ) continue

            points.push(this.points[i-1]);
            currentPoint = this.points[i-1];
        }

        const lastPoint = this.points[this.points.length-1];
        if(lastPoint !== points[points.length-1]) points.push(lastPoint);

        this.trailLines = createConsecutiveLines(points);
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.#createTrailPoints();
    }

    draw(context) {
        context.save();

        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = this.trailWidth;
        context.filter = `blur(${this.trailBlurness}px)`;
        context.strokeStyle = this.#createGradient(context);

        context.beginPath();
        for(const trailLine of this.trailLines) {
            context.moveTo(trailLine.p1.x, trailLine.p1.y);
            context.lineTo(trailLine.p2.x, trailLine.p2.y);
        }
        context.lineWidth = this.trailWidth;
        context.stroke();

        context.restore();
    }
}

class GlowRectangle {
    constructor(x, y, hue=60, width=1, height=1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.trailHue = hue;
        this.alpha = 1;
    }

    update(loopFactor) {
        this.alpha *= (0.98 ** loopFactor);
    }

    draw(context) {
        context.fillStyle = `hsla(${this.trailHue}, 100%, 80%, ${this.alpha})`;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

export class Rect_Tracer {
    constructor(player) {
        this.player = player;
        this.points = [];
        this.maxPoints = 30;
        this.timer = 0;
        this.timeInterval = 20;
        this.trailThickness = 5;
    }

    #addPoint(loopFactor) {
        const isMovingX = this.player.speedX > 0;
        for (let i = 0; i < 2; i++) {
            this.points.unshift(new GlowRectangle(
                this.player.x - (isMovingX > 0 ? this.player.baseSpeed*i*loopFactor : this.trailThickness*0.5), 
                this.player.y - (!isMovingX > 0 ? this.player.baseSpeed*i*loopFactor : this.trailThickness*0.5), 
                60, 
                (isMovingX > 0 ? this.player.baseSpeed*loopFactor : this.trailThickness), 
                (!isMovingX > 0 ? this.player.baseSpeed*loopFactor : this.trailThickness)
            ));
        }
    }

    update(deltaTime, loopFactor) {
        this.timer += deltaTime;

        if( this.points.length <= this.maxPoints && 
            this.timer >= this.timeInterval) {
            this.#addPoint(loopFactor);
            if(this.points.length > this.maxPoints) this.points.length = this.maxPoints;
            this.timer = 0;            
        }

        for(const point of this.points) point.update(loopFactor);
    }

    draw(context) {
        context.save();
        // context.filter = 'blur(7px)';
        for(const point of this.points) point.draw(context);
        context.restore();
    }
}

const trails = {
    "bubbleTrail": TrailEffect, 
    "fireTrail": FireTrail, 
    "goldenTrail": GoldenTrail, 
}

export function setEffect(player, effectProps) {    
    return new trails[effectProps.trailName](player, effectProps);
}