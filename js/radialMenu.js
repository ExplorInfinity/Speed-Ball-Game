import { createStarBody, drawStarBody, Gradient } from "./utils.js";

const PI = Math.PI;
const angleOfCircle = 2*PI;

export class RadialMenu {
    constructor(handler, context, slots=10, outerRadius=300, innerRadius=200) {
        this.handler = handler;
        
        this.canvas = context.canvas;
        this.context = context;

        this.slots = slots;
        this.padding = 0.02*PI;
        this.offset = -0.5*PI;

        this.options = [];
        const costType = ['starsEarned', 'starsCollected'];
        const addOptions = (name, cost, costType) => this.options.push({ name, cost, costType });
        addOptions('normal', 0, costType[1]);
        addOptions('clouds-default', 50, costType[1]);
        addOptions('clouds-original', 100, costType[1]);
        addOptions('clouds-skyblue', 50, costType[1]);
        addOptions('clouds-wheat', 50, costType[1]);
        addOptions('water', 150, costType[1]);
        addOptions('space', 25, costType[0]);
        addOptions('colors', 50, costType[0]);

        this.optionNames = [];
        for(const { name } of this.options) this.optionNames.push(name);        

        this.slots = this.options.length;
        this.selected = 0;
        this.updateSelection(0);
        this.prevSelected = this.selected;
        this.keys = new Set();
        this.cooldownKeys = new Set();
        this.keyPressed = false;
        window.addEventListener('keydown', e => this.#handleKeyDown(e));
        window.addEventListener('keyup', ({key}) => {
            key = key.length > 1 ? key : key.toLowerCase();
            this.keys.delete(key);
            this.cooldownKeys.delete(key);
            this.keyPressed = false
        });

        this.x = window.innerWidth*0.5;
        this.y = window.innerHeight*0.5;
        this.outerRadius = outerRadius;
        this.innerRadius = innerRadius;

        this.unselectedStyle = {
            color: 'hsla(166, 80.00%, 85%, 0.5)', 
            outlineColor: `rgba(0,0,0,0)`
        };
        this.selectedStyle = {
            color: 'hsla(166, 80.00%, 85%, 0.9)', 
            outlineColor: `rgba(0,0,0,0)`
        };

        this.fontSize = 20;

        this.visible = false;
        this.globalAlpha = 0;
        this.degree = 0;
        this.hue1 = 0;
        this.hue2 = 180;

        this.starRadius = 10;
        this.starBody = createStarBody(this.starRadius, this.starRadius*0.5);

        // Sound Effect
        const audioContext = new AudioContext();
        fetch('./sounds/menuSelection.wav')
            .then(res => res.arrayBuffer())
            .then(data => audioContext.decodeAudioData(data))
            .then(buffer => this.audioBuffer = buffer)
            .catch(err => console.log(err));

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
        
        this.playSound = () => {
            this.source = audioContext.createBufferSource();
            this.source.buffer = this.audioBuffer;
            this.source.connect(gainNode);
            this.source.start(audioContext.currentTime);
        };
    }

    #handleKeyDown({key}) {
        key = key.length > 1 ? key : key.toLowerCase();
        if(!this.cooldownKeys.has(key)) {
            this.keys.add(key);
            this.cooldownKeys.add(key);
        } else return;

        if(this.keys.has('Shift') && this.keys.has('b')) {
            if(this.visible) this.updateSelection(this.prevSelected);
            this.visible = !this.visible;
            this.keyPressed = true;
        }

        else if(this.visible) {
            if(this.keys.has('ArrowRight')) {
                this.updateSelection(this.selected < this.slots-1 ? this.selected+1 : 0);
                this.playSound();
            } else if(this.keys.has('ArrowLeft')) {
                this.updateSelection(this.selected > 0 ? this.selected-1 : this.slots-1);
                this.playSound();
            } else if(this.keys.has('Enter')) {
                this.visible = false;
                const { cost, costType } = this.options[this.selected];
                if(this.handler[costType] < cost) {
                    this.updateSelection(this.prevSelected);
                    document.getElementById('notice').showModal();
                } else {
                    this.prevSelected = this.selected;
                }
            }
        }
        
        this.handler.pause = this.visible || !this.handler.game.start;
    }

    addOptions(name, cost, costType) {
        this.options.push({ name, cost, costType });
    }
    
    resize() {
        this.x = window.innerWidth*0.5;
        this.y = window.innerHeight*0.5;
    }

    setCanvasStyle() {
        const { context, fontSize } = this;
        context.lineWidth = 10;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `${fontSize}px cursive`;
    }

    updateSelection(newValue) {
        this.selected = newValue;
        const { optionNames } = this;
        const canvas = document.getElementById('canvas');
        canvas.classList.remove(...optionNames);
        canvas.classList.add(optionNames[this.selected]);
    }

    update(deltaTime) {
        if(!this.visible && this.globalAlpha > 0) {
            this.globalAlpha -= deltaTime * 0.0075;
        } else if(this.visible && this.globalAlpha < 1) {
            this.globalAlpha += deltaTime * 0.0075;
        }
        
        if(this.globalAlpha <= 0 || this.globalAlpha >= 1) 
            this.globalAlpha = Math.max(0, Math.min(this.globalAlpha, 1));

        if(this.selected === 7) {
            const root = document.querySelector(':root');
            root.style.setProperty('--degree', `${this.degree}deg`);
            root.style.setProperty('--space-hue1', `${this.hue1}deg`);
            root.style.setProperty('--space-hue2', `${this.hue2}deg`);
            const updateValue = deltaTime * 0.06;
            this.degree += updateValue;
            this.hue1 += updateValue;
            this.hue2 += updateValue;
        } else if(this.selected) {

        }
    }

    drawArc(startAngle, endAngle, label, selected=false) {
        const { context, outerRadius, innerRadius } = this;
        const { color, outlineColor } = selected ? 
            this.selectedStyle : this.unselectedStyle;
        
        context.save();
        context.fillStyle = color;
        context.strokeStyle = outlineColor;        

        context.beginPath();
        context.arc(0, 0, outerRadius, startAngle, endAngle);
        context.arc(0, 0, innerRadius, endAngle, startAngle, true);
        context.closePath();
        context.stroke();
        context.fill();

        if(label) {            
            context.save();
            const avgAngle = (startAngle + endAngle) * 0.5;
            const avgRadius = (outerRadius + innerRadius) * 0.5;
            const x = Math.cos(avgAngle) * avgRadius;
            const y = Math.sin(avgAngle) * avgRadius;
            context.fillStyle = 'black';
            context.fillText(label, x, y);
            context.restore();
        }
        context.restore();
    }

    draw() {
        if(!this.visible && this.globalAlpha <= 0) return

        const { canvas, context, slots, padding, offset } = this;

        this.setCanvasStyle();
        context.save();
        context.translate(this.x, this.y);
        context.globalAlpha = this.globalAlpha;

        // Backdrop
        context.fillStyle = 'rgba(0,0,0,0.3)';
        context.fillRect(-canvas.width*0.5, -canvas.height*0.5, canvas.width, canvas.height);
        
        // Selected Label
        const rectWidth = this.innerRadius * 1.5;
        const rectHeight = 50;
        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, rectWidth*0.5);
        gradient.addColorStop(0, 'hsla(166, 80.00%, 85%, 1)');
        gradient.addColorStop(0.5, 'hsla(166, 80.00%, 85%, 0.75)');
        gradient.addColorStop(0.75, 'hsla(166, 80.00%, 85%, 0.5)');
        gradient.addColorStop(1, 'hsla(166, 80.00%, 85%, 0)');
        context.fillStyle = gradient;
        context.fillRect(-rectWidth*0.5, -rectHeight*0.5, rectWidth, rectHeight);
        context.fillStyle = 'black';
        context.fillText(this.optionNames[this.selected], 0, 0);

        const { cost, costType } = this.options[this.selected];
        if(this.handler[costType] < cost) {
            context.fillStyle = 'white';
            const textWidth = context.measureText(cost).width;
            const x1 = -this.starRadius*0.5;
            const y1 = rectHeight*0.5 + this.fontSize;
            context.fillText(cost, x1, y1);
            
            const x2 = x1 + textWidth*0.5 + this.starRadius + 2;
            const y2 = y1 - 2;
            const gradient2 = this.context.createRadialGradient(x2, y2, 0, x2, y2, this.starRadius);
            if(costType === 'starsCollected') Gradient.glow(gradient2, 197, 0.75);
            else if(costType === 'starsEarned') Gradient.glow(gradient2, 60, 0.75);
            context.fillStyle = gradient2;
            drawStarBody(context, this.starBody, x2, y2);
            context.fill();
        }

        // Menu
        for(let i = 0; i < slots; i++) {
            this.drawArc(
                angleOfCircle * ( i / slots ) + padding*0.5 + offset, 
                angleOfCircle * ( (i + 1) / slots ) - padding + offset, 
                i + 1, this.selected === i ? true : false
            );
        }
        context.restore();
    }
}