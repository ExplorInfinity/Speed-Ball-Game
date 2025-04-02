import { WorleyNoise } from "./worleyNoise.js";

export class Background {
    constructor(game, context) {
        this.game = game;
        this.context = context;
        this.canvas = context.canvas;

        this.width = screen.width;
        this.height = screen.height;
        this.totalHeight = this.height * 2;
        this.y = this.height - this.totalHeight;
    }

    start() {
        // const noiseGen = new Worker(`./js/worleyNoise.js`, {type:'module'});
        // this.noiseGen = noiseGen;

        // const { width, height } = screen;
        // this.totalHeight = height;
        // this.screenPixelsArrLen = width * height * 4;
        // noiseGen.onmessage = e => {
        //     const { data } = e.data;
        //     this.currentRow = 0;
        //     this.data = data;
        //     this.currentData = new Uint8ClampedArray(this.screenPixelsArrLen).fill(255);
        //     this.updateBackgroundImage();
        //     console.log('Data recieved');
        //     noiseGen.terminate();
        // };
        // noiseGen.onerror = e => {
        //     console.log(e);
        //     noiseGen.terminate();
        // };

        // noiseGen.postMessage({ action: 'start', width, height: this.totalHeight });
        // Worker
        // noiseGen.postMessage({ action: 'animate' });

        // In Real-Time
        const { width, height } = screen;
        this.noise = new WorleyNoise(width, this.totalHeight, {maxDistForRatio: 350, ratioPower: 1.5});
        this.noise.createRandomPoints();
        this.noise.createBackgroundImage();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = this.totalHeight;
        const context = canvas.getContext('2d');

        this.noise.draw(context);
        const background = new Image();
        background.src = canvas.toDataURL();
        background.onload = () => {
            this.backgroundImage = background;
        }
    }

    updateBackgroundImage() {
        // const { width, height } = screen;
        // const startIndex =  (width * (this.totalHeight - this.currentRow));
        // const endIndex = (startIndex + this.screenPixelsArrLen * 0.25);
        // const currentData = this.data.slice(startIndex * 4, endIndex * 4);

        // No need for this, instead i will use parallax of Images
        // let row = this.currentRow;
        // for(let j = 0; j < height; j++) {
        //     row = (row - 1 + this.totalHeight) % this.totalHeight;
        //     for(let i = 0; i < width; i++) {
        //         const index = (i + j * width) * 4;
        //         const fetchIndex = (i + row * width) * 4;
        //         this.currentData[index] = this.data[fetchIndex];
        //         this.currentData[index+1] = this.data[fetchIndex+1];
        //         this.currentData[index+2] = this.data[fetchIndex+2];
        //     }
        // }
        // this.backgroundImage = new ImageData(this.currentData, width, height);
    }

    update(deltaTime) {
        // Worker
        // if(this.noiseGen) {
            // const { baseSpeed: speed } = this.game.player;        
            // this.noiseGen.postMessage({ action: 'update', speed });
        // }

        // Real-Time
        // const { baseSpeed: speed } = this.game.player;
        // this.noise.update(speed);
        // this.backgroundImage = this.noise.imageData;

        // Bulk
        // if(this.backgroundImage) {
        //     const { speedX, speedY, baseSpeed } = this.game.player;
        //     const windSpeed = 10;
        //     const isMoving = speedX || speedY;
        //     const frameMultiplier = deltaTime * 0.001 * 20;
        //     this.currentRow += Math.floor(((isMoving ? windSpeed : 0) + baseSpeed) * frameMultiplier);
        //     this.updateBackgroundImage();
        // }
        if(this.backgroundImage) {
            const { speedX, speedY, baseSpeed } = this.game.player;
            const windSpeed = 10;
            const isMoving = speedX || speedY;
            const frameMultiplier = deltaTime * 0.001 * 20;
            this.y += (windSpeed + (isMoving ? baseSpeed : 0)) * frameMultiplier;

            if(this.y > this.height) {
                this.y -= this.totalHeight;
            }
        }
    }

    draw() {
        if(this.backgroundImage) {
            const { context, width, height, totalHeight } = this;
            context.drawImage(this.backgroundImage, 0, 0, width, totalHeight, 0, this.y - totalHeight, width, totalHeight);
            context.drawImage(this.backgroundImage, 0, 0, width, totalHeight, 0, this.y, width, totalHeight);
            // this.context.putImageData(this.backgroundImage, 0, 0);
        }
    }
}