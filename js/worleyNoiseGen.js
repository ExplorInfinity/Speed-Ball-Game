import QuadTree from "./quadtree.js";
import { hexToRgb, getRandomInteger, rgbToHex } from "./utils.js";

const PI = Math.PI;
const TWO_PI = 2*PI;

function distSquare(x, y) {
    return x * x + y * y
}

export class WorleyNoise {
    constructor(width=400, height=400, 
        { startColor=[255, 197, 185], endColor=[255, 0, 0], 
          pointCount, ratioPower=2, maxDistForRatio=200 }={}) {
        this.width = width;
        this.height = height;
  
        this.pointCount = pointCount || Math.floor(40 * height * width / 1524196);
        this.maxDistForRatio = maxDistForRatio;
        this.maxDistForRatioSq = maxDistForRatio * maxDistForRatio;
        this.ratioPower = ratioPower;
        this.points = [];
        this.distances = [];
        
        const sc = hexToRgb('#aaa8d7');
        const ec = hexToRgb('#7c7c9d');
        // const sc = hexToRgb('#98b3d9');
        // const ec = hexToRgb('#829dc3');
        // const sc = {}, ec = {};
        this.rStart = sc.r || startColor[0];
        this.gStart = sc.g || startColor[1];
        this.bStart = sc.b || startColor[2];
        this.rEnd = ec.r || endColor[0];
        this.gEnd = ec.g || endColor[1];
        this.bEnd = ec.b || endColor[2];
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.pointCount = Math.floor(40 * height * width / 1524196);
    }

    setRatioPower(value) {
        this.ratioPower = Number(value);
    }

    setMaxDistForRatio(value) {
        value = Number(value);
        this.maxDistForRatio = value;
        this.maxDistForRatioSq = value * value;
    }

    addCustom() {
        const { rStart, gStart, bStart, rEnd, gEnd, bEnd } = this;
        const getHTMLelement = (id) => {
            return document.getElementById(id);
        }

        const pickerStart = getHTMLelement('pickerStart'),
              pickerEnd = getHTMLelement('pickerEnd'),
              distPower = getHTMLelement('distPower'),
              pointCount = getHTMLelement('pointCount'),
              spawnPoints = getHTMLelement('spawnPoints'),
              maxDist = getHTMLelement('maxDist'),
              width = getHTMLelement('width'),
              height = getHTMLelement('height'),
              download = getHTMLelement('download');

        pickerStart.value = rgbToHex(rStart, gStart, bStart);
        pickerEnd.value = rgbToHex(rEnd, gEnd, bEnd);
        distPower.value = this.ratioPower;
        pointCount.value = this.pointCount;
        maxDist.value = this.maxDistForRatio;
        width.value = screen.width;
        height.value = screen.height;

        pickerStart.addEventListener('input', e => {
            const value = e.target.value;
            const colorRGB = hexToRgb(value);
            for(const key of Object.keys(colorRGB)) {
                this[`${key}Start`] = colorRGB[key];
            }
            this.createImageData();
        });
        pickerEnd.addEventListener('input', e => {
            const value = e.target.value;
            const colorRGB = hexToRgb(value);
            for(const key of Object.keys(colorRGB)) {
                this[`${key}End`] = colorRGB[key];
            }
            this.createImageData();
        });
        distPower.addEventListener('input', e => {
            const value = e.target.value;
            this.ratioPower = Number(value);
            this.createImageData();
        });
        maxDist.addEventListener('input', e => {
            const value = Number(e.target.value);
            this.maxDistForRatio = value;
            this.createImageData();
        });
        spawnPoints.addEventListener('click', () => {
            const value = Number(pointCount.value);
            this.pointCount = value;
            this.setup();
        });
        download.addEventListener('click', () => {
            this.downloadTexture(width.value, height.value);
        });
    }

    createRandomPoints() {
        this.points = [];
        for(let i = 0; i < this.pointCount; i++) {
            this.points.push({
                x: getRandomInteger(0, this.width), 
                y: getRandomInteger(0, this.height)
            });
        }
    }

    generatePixelDistances() {
        const { width, height } = this;

        const halfWidth = width*0.5;
        const halfHeight = height*0.5;
        const canvasRect = QuadTree.centerRect(halfWidth, halfHeight, halfWidth, halfHeight);
        const tree = new QuadTree(canvasRect, 7);
        for(const point of this.points) {
            tree.insert(point);
        }

        this.distances = Array(width * height);
        let index = 0;
        const searchArea = this.maxDistForRatio * 1.2;
        const searchRect = QuadTree.centerRect(Math.floor(width*0.5), 0, width*0.5, searchArea);
        let points = [];
        const checkMultiple = Math.floor(this.maxDistForRatio * 0.1);
        const half_checkMultiple = Math.floor(checkMultiple*0.5);
        for(let j = 0; j < height; j++) {
            if(j % checkMultiple === 0) {
                searchRect.y = j + half_checkMultiple;
                points = tree.query(searchRect);
            }
            for(let i = 0; i < width; i++) {
                if(i % checkMultiple === 0) {
                    searchRect.x = i + half_checkMultiple;
                    points = tree.query(searchRect);
                }
                let closestDist = Number.MAX_SAFE_INTEGER;
                for(const point of points) {
                    const dx = (point.x - i);
                    const dy = (point.y - j);
                    const dist = distSquare(dx, dy);
                    if(dist < closestDist) closestDist = dist;
                }
                this.distances[index++] = closestDist;
            }
        }
    }

    createImageData() {
        const { distances, width, height, maxDistForRatioSq, ratioPower } = this;
        
        const pixels = new Uint8ClampedArray(width * height * 4);
        for(let i = 0; i < pixels.length; i+=4) {
            const distance = distances[i*0.25];
            const ratio = (distance / maxDistForRatioSq) ** (ratioPower * 0.5);
            const r = Math.floor(this.rStart + ratio * (this.rEnd - this.rStart));
            const g = Math.floor(this.gStart + ratio * (this.gEnd - this.gStart));
            const b = Math.floor(this.bStart + ratio * (this.bEnd - this.bStart));

            pixels[i] = r;
            pixels[i+1] = g;
            pixels[i+2] = b;
            pixels[i+3] = 255;
        }
        this.imagePixels = pixels;
        this.imageData = new ImageData(pixels, width, height);
    }

    createBackgroundImage() {
        this.generatePixelDistances();
        this.createImageData();
    }

    generateRandomImage() {
        this.createRandomPoints();
        this.createBackgroundImage();
    }

    draw(context) {
        context.putImageData(this.imageData, 0, 0);
    }
}

const noiseGen = new WorleyNoise();

export class WorleyHandler {
    constructor(game, context) {
        this.game = game;
        this.context = context;
        this.canvas = context.canvas;
        
        const { width, height } = screen;
        this.width = width;
        this.height = height;
        this.genCanvas = document.createElement('canvas');
        this.genCanvas.width = width;
        this.genCanvas.height = height;
        this.genContext = this.genCanvas.getContext('2d');

        this.windSpeed = 10;
        this.setImageHeight(height * 2);
        this.y = this.height - this.totalImageHeight;
        this.loaded = false;
    }

    setImageHeight(value) {
        this.genCanvas.height = value;
        this.totalImageHeight = value;
    }

    start() {
        noiseGen.setSize(this.width, this.totalImageHeight);
        noiseGen.setMaxDistForRatio(350);
        noiseGen.setRatioPower(1.5);
        noiseGen.generateRandomImage();
        noiseGen.draw(this.genContext);

        const background = new Image();
        background.src = this.genCanvas.toDataURL();
        background.onload = () => {
            this.backgroundImage = background;
            this.loaded = true;
        }
    }

    update(deltaTime) {
        if(this.loaded) {
            const { speedX, speedY, baseSpeed } = this.game.player;

            const isMoving = speedX || speedY;
            const frameMultiplier = deltaTime * 0.02;
            this.y += (this.windSpeed + (isMoving ? baseSpeed : 0)) * frameMultiplier;

            if(this.y > this.height) {
                this.y -= this.totalImageHeight;
            }
        }
    }

    draw() {
        if(this.loaded) {
            const { context } = this;
            context.drawImage(
                this.backgroundImage, 0, 0, this.width, this.totalImageHeight, 
                0, this.y - this.totalImageHeight, this.width, this.totalImageHeight);
            context.drawImage(
                this.backgroundImage, 0, 0, this.width, this.totalImageHeight, 
                0, this.y, this.width, this.totalImageHeight);
        }
    }
}