import QuadTree from "./quadtree.js";
import { hexToRgb, getRandomInteger, rgbToHex } from "./utils.js";

const PI = Math.PI;
const TWO_PI = 2*PI;


function lowestValue(arr) {
    let lowestValue = Number.MAX_SAFE_INTEGER;
    for(const value of arr) {
        if(lowestValue > value) lowestValue = value;
    }
    return lowestValue
}

function distSquare(x, y) {
    return x * x + y * y
}

export class WorleyNoise {
    constructor(width, height, 
        { startColor=[255, 197, 185], endColor=[255, 0, 0], pointCount, 
          ratioPower=2, closestDistIndex=0, maxDistForRatio=200 }={}) {
        this.width = width;
        this.height = height;
        this.canvas = new OffscreenCanvas(width, height);
        this.context = this.canvas.getContext('2d');

        // this.pointCount = pointCount || Math.floor(width * 0.04 * 0.5);        
        this.pointCount = pointCount || Math.floor(40 * height * width / 1524196);
        this.maxDistForRatio = maxDistForRatio;
        this.maxDistForRatioSq = maxDistForRatio ** 2;
        this.closestDistIndex = closestDistIndex;
        this.ratioPower = ratioPower;
        this.points = [];
        this.distances = [];
        
        const sc = hexToRgb('#aaa8d7');
        const ec = hexToRgb('#7c7c9d');
        // const sc = {}, ec = {};
        this.rStart = sc.r || startColor[0];
        this.gStart = sc.g || startColor[1];
        this.bStart = sc.b || startColor[2];
        this.rEnd = ec.r || endColor[0];
        this.gEnd = ec.g || endColor[1];
        this.bEnd = ec.b || endColor[2];

        this.windSpeed = 3;
        this.speed = this.windSpeed;
    }

    addCustom() {
        const { rStart, gStart, bStart, rEnd, gEnd, bEnd } = this;

        const pickerStart = document.getElementById('pickerStart');
        const pickerEnd = document.getElementById('pickerEnd');
        const distPower = document.getElementById('distPower');
        const closestPointIndex = document.getElementById('closestPointIndex');
        const pointCount = document.getElementById('pointCount');
        const spawnPoints = document.getElementById('spawnPoints');
        const maxDist = document.getElementById('maxDist');
        const width = document.getElementById('width');
        const height = document.getElementById('height');
        const download = document.getElementById('download');

        pickerStart.value = rgbToHex(rStart, gStart, bStart);
        pickerEnd.value = rgbToHex(rEnd, gEnd, bEnd);
        distPower.value = this.ratioPower;
        closestPointIndex.value = this.closestDistIndex;
        closestPointIndex.max = this.pointCount;
        pointCount.value = this.pointCount;
        maxDist.value = this.maxDistForRatio;
        width.value = window.screen.width;
        height.value = window.screen.height;

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
        closestPointIndex.addEventListener('input', e => {
            const value = e.target.value;
            this.closestDistIndex = Math.min(Number(value), this.points.length-1);
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
            closestPointIndex.max = value;
            this.setup();
        });
        download.addEventListener('click', () => {
            this.downloadTexture(width.value, height.value);
        });
    }

    // update(newSpeed=0) {
    //     this.speed = Math.floor(this.windSpeed + newSpeed);
    //     const { speed, width, height } = this;
        
    //     const filteredPoints = [];
    //     for(const point of this.points) {
    //         point.y += speed;
    //         if(point.y < height) {
    //             filteredPoints.push(point);
    //         }
    //     }
    //     this.points = filteredPoints;

    //     for(let i = 0; i < this.pointCount - this.points.length; i++) {
    //         const x = getRandomInteger(0, width);
    //         const y = getRandomInteger(-this.maxDistForRatio, speed);
    //         const point = {x, y};
    //         this.points.push(point);
    //     }

    //     const half_w = width * 0.5;
    //     const half_h = height * 0.5;
    //     const boundary = QuadTree.centerRect(half_w, half_h, half_w, half_h);
    //     const tree = new QuadTree(boundary, 10);
    //     for(const point of this.points) {
    //         tree.insert(point);
    //     }

    //     // console.time('distances');
    //     let index = 0;
    //     const distances = Array(width * speed).concat(this.distances.slice(0, (height - speed) * width));
    //     const searchRect = QuadTree.centerRect(0, 0, this.maxDistForRatio * 1.1, this.maxDistForRatio * 1.1);
    //     for(let j = 0; j < this.maxDistForRatio; j++) {
    //         searchRect.y = j;
    //         for(let i = 0; i < width; i++) {
    //             searchRect.x = i;
    //             const points = tree.query(searchRect);
    //             let closestDist = Number.MAX_SAFE_INTEGER;
    //             for(const point of points) {
    //                 const dist = distSquare(point.x - i, point.y - j);
    //                 if(dist < closestDist) closestDist = dist;
    //             }
    //             distances[index++] = closestDist;
    //         }
    //     }
    //     // console.timeEnd('distances');
    //     this.distances = distances;

    //     const { maxDistForRatioSq, ratioPower, imagePixels } = this;
    //     // console.time('ImageData');
    //     const newPixels = new Uint8ClampedArray(width * height * 4).fill(255);
    //     const oldPixelsStartIndex = speed * width * 4;

    //     for(let i = 0; i < width; i++) {
    //         for(let j = 0; j < height; j++) {
    //             const index = (i + j * width) * 4;
    //             const distance = distances[index*0.25];
    //             const ratio = (distance / maxDistForRatioSq) ** (ratioPower * 0.5);
    //             const r = Math.floor(this.rStart + ratio * (this.rEnd - this.rStart));
    //             const g = Math.floor(this.gStart + ratio * (this.gEnd - this.gStart));
    //             const b = Math.floor(this.bStart + ratio * (this.bEnd - this.bStart));
    
    //             const prevIndex = index - oldPixelsStartIndex - 1;
    //             if( index > oldPixelsStartIndex &&
    //                 imagePixels[prevIndex] === r && 
    //                 imagePixels[prevIndex + 1] === g &&
    //                 imagePixels[prevIndex + 2] === b
    //             ) {
    //                 for(let x = j; x < height; x++) {
    //                     const index = (i + x * width) * 4;
    //                     const prevIndex = index - oldPixelsStartIndex - 1;
    //                     newPixels[index] = imagePixels[prevIndex];
    //                     newPixels[index + 1] = imagePixels[prevIndex + 1];
    //                     newPixels[index + 2] = imagePixels[prevIndex + 2];
    //                 }
    //                 break
    //             }
    
    //             newPixels[index] = r;
    //             newPixels[index+1] = g;
    //             newPixels[index+2] = b;
    //         }
    //     }
    //     // console.timeEnd('ImageData');
    //     this.imagePixels = newPixels;
    //     this.imageData = new ImageData(newPixels, width, height);     
    // }

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

    async createURL() {
        this.draw();
        const url = await this.canvas.convertToBlob().then(blob => URL.createObjectURL(blob));
        return url
    }

    draw(context=this.context) {
        context.putImageData(this.imageData, 0, 0);
    }
}

let noise;
const showUpdateTime = false;
onmessage = e => {
    const { action } = e.data;
    if(action === 'start') {
        const { width, height } = e.data;
        noise = new WorleyNoise(width, height, {maxDistForRatio: 300, ratioPower: 1.5});
        console.time('Generation');
        noise.createRandomPoints();
        noise.createBackgroundImage();
        console.timeEnd('Generation');
        postMessage({data: noise.imagePixels});
    } else if (action === 'update') {
        noise.speed = noise.windSpeed + Math.floor(e.data.speed);
    } else if (action === 'animate') {
        async function animate() {
            if(showUpdateTime) console.time('update');
            noise.update();
            postMessage({data: noise.imagePixels});
            if(showUpdateTime) console.timeEnd('update');
            requestAnimationFrame(animate);
        }
        animate();
    }
}