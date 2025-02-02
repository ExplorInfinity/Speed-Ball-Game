import { Color, Gradient } from "./utils.js";

export class Rectangle {
    constructor(x, y, width, height, colorHue=197, strokeColor, gradientStyle) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.colorHue = colorHue;
        this.strokeColor = strokeColor;
        this.gradientStyle = gradientStyle??Gradient.darkToDarkest;
        
        this.offScreen = false;
    }

    createGradient(context) {
        this.gradient = context.createRadialGradient(
            this.x + this.width*0.5, 
            this.y + this.height*0.5, 
            0,
            this.x + this.width*0.5, 
            this.y + this.height*0.5, 
            (this.width > this.height ? this.width : this.height)
        );
        this.gradientStyle(this.gradient, this.colorHue);
    }

    drawPath(context, offset) {
        context.rect(
            this.x + offset, this.y + offset, 
            this.width - offset*2, this.height - offset*2
        );
    }

    draw(context, strokeColor=false) {
        if(!this.gradient) this.createGradient(context);
        context.fillStyle = this.gradient;
        context.fillRect(this.x, this.y, this.width, this.height);
        if(strokeColor) {
            context.strokeStyle = this.strokeColor;
            context.lineWidth = 5;
            context.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

export class ColorRect extends Rectangle {
    constructor(x, y, width, height, colorHue=197, strokeColor) {
        super(x, y, width, height, colorHue=197, strokeColor);
        this.colors = [
            [Color.dark_40(180), Color.dark_30(200)], 
            [Color.dark_40(40), Color.darkest(60)], 
            // [Color.dark_40(30), Color.dark_40(10)], 
            // [Color.dark_40(60), Color.dark_40(100), Color.normal(200), Color.normal(300), Color.dark_40(350)], 
        ]
        this.colorIndex = this.colors.length-1;
    }

    createGradient(context) {
        const x = this.x + this.width*0.5;
        const y = this.y + this.height*0.5;
        const radius = (this.width > this.height ? this.width : this.height);
        this.gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        Gradient.multipleColors(this.gradient, this.colors[this.colorIndex]);
        // Gradient.darkToDarkest(this.gradient, 180)
    }
}