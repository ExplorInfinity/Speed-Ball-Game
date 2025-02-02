export function roundOff(value, roundAbout=0) {
    return Number(value.toFixed(roundAbout))
}

export function setShadow(context, offsetX, offsetY, blur=0, color='black') {
    context.shadowOffsetX = offsetX;
    context.shadowOffsetY = offsetY;
    context.shadowBlur = blur;
    context.shadowColor = color;
}

export function getRandomInteger(lowerLimit, upperLimit) {
    return Math.floor(Math.random()*(upperLimit - lowerLimit) + lowerLimit)
}

export function createConsecutiveLines(points) {
    const lines = [];
    for(let i = 1; i < points.length; i++) {
        lines.push({
            p1: points[i-1], 
            p2: points[i]
        });
    }
    return lines
}

export class Color {
    static darkest(hue) {
        return `hsl(${hue}, 100%, 0%)`;
    }
    static darker(hue) {
        return `hsl(${hue}, 100%, 15%)`;
    }
    static dark(hue) {
        return `hsl(${hue}, 100%, 25%)`;
    }
    static dark_30(hue) {
        return `hsl(${hue}, 100%, 30%)`;
    }
    static dark_35(hue) {
        return `hsl(${hue}, 100%, 35%)`;
    }
    static dark_40(hue) {
        return `hsl(${hue}, 100%, 40%)`;
    }
    static normal(hue) {
        return `hsl(${hue}, 100%, 50%)`;
    }
    static light_60(hue) {
        return `hsl(${hue}, 100%, 60%)`;
    }
    static light_70(hue) {
        return `hsl(${hue}, 100%, 70%)`;
    }
    static light(hue) {
        return `hsl(${hue}, 100%, 75%)`;
    }
    static lighter(hue) {
        return `hsl(${hue}, 100%, 85%)`;
    }
    static lightest(hue) {
        return `hsl(${hue}, 100%, 100%)`;
    }
}

export class Gradient {
    static lightToDark(gradient, hue) {
        gradient.addColorStop(0, Color.light(hue));
        gradient.addColorStop(1, Color.dark(hue));
    }
    static lightestToDarkest(gradient, hue) {
        gradient.addColorStop(0, Color.lightest(hue));
        gradient.addColorStop(1, Color.darkest(hue));
    }
    static lightestToLight(gradient, hue) {
        gradient.addColorStop(0, Color.lightest(hue));
        gradient.addColorStop(1, Color.light(hue));
    }
    static dark_35ToDarkest(gradient, hue) {
        gradient.addColorStop(0, Color.dark_35(hue));
        gradient.addColorStop(1, Color.darkest(hue));
    }
    static dark_40ToDarkest(gradient, hue) {
        gradient.addColorStop(0, Color.dark_40(hue));
        gradient.addColorStop(1, Color.darkest(hue));
    }
    static darkToDarkest(gradient, hue) {
        gradient.addColorStop(0, Color.dark(hue));
        gradient.addColorStop(1, Color.darkest(hue));
    }
    static normalToDark(gradient, hue) {
        gradient.addColorStop(0, Color.normal(hue));
        gradient.addColorStop(1, Color.dark(hue));
    }
    static lightestToNormal(gradient, hue) {
        gradient.addColorStop(0, Color.lightest(hue));
        gradient.addColorStop(1, Color.normal(hue));
    }
    static lightToNormal(gradient, hue) {
        gradient.addColorStop(0, Color.light(hue));
        gradient.addColorStop(1, Color.normal(hue));
    }
    static glow(gradient, hue, glowOutline=0.7) {
        gradient.addColorStop(0, Color.lightest(hue));
        gradient.addColorStop(glowOutline, Color.normal(hue));
    }
    static lightestToDark(gradient, hue) {
        gradient.addColorStop(0, Color.lightest(hue));
        gradient.addColorStop(1, Color.dark(hue));
    }
    static visibleToInvisible(gradient, hue) {
        gradient.addColorStop(0, `hsla(${hue}, 100%, 75%, 1)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 100%, 0)`);
    }
    static multipleColors(gradient, colors) {
        for(let i = 0; i < colors.length; i++) {
            gradient.addColorStop( i / (colors.length-1), colors[i]);
        }
    }
}

export function create_div(...classes) {
    const div = document.createElement('div');
    if(classes) div.classList.add(...classes);
    return div
}

export function createStarBody(radius, innerRadius) {
    const body = [];
    const offset = -Math.PI*0.5;
    for(let i = offset; i < 2*Math.PI + offset + 0.01; i += Math.PI*0.4) {
        const outerPoint = {
            x: Math.cos(i)*radius, 
            y: Math.sin(i)*radius
        };
        const innerPoint = {
            x: Math.cos(i+Math.PI*0.2)*innerRadius, 
            y: Math.sin(i+Math.PI*0.2)*innerRadius
        };
        body.push(outerPoint, innerPoint);
    }

    return body
}

export function drawStarBody(context, starBody, x, y) {
    context.beginPath();
    for(const point of starBody) {
        context.lineTo(x + point.x, y + point.y);
    }
    context.closePath();
}