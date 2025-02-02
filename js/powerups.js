import { Rectangle } from "./rectangle.js";

export class PowerUps {
    constructor(game, track) {
        this.game = game;
        this.track = track;
        this.context = game.context;

        this.timer = 0;
        this.timeInterval = 100;

        this.powers = [];
    }

    #addPowerUpToMap() {
        const trackRects = this.track.trackRects;
        const selectedRect = trackRects[
            Math.min(Math.floor(Math.random()*trackRects.length)+5, trackRects.length-1)];
        const playerSize = this.track.playerSize*0.5;
        const x = (selectedRect.x + playerSize) + Math.random() * (selectedRect.width - playerSize*2);
        const y = (selectedRect.y + playerSize) + Math.random() * (selectedRect.height - playerSize*2);
            
        this.powers.push(new Rectangle(x, y, 20, 20, 0));
    }

    update(deltaTime) {
        this.timer += deltaTime;

        if(this.timer >= this.timeInterval) {
            // this.#addPowerUpToMap();
            this.timer = 0;
        }
    }

    draw() {
        for(const rect of this.powers) {
            rect.draw(this.context);
        }
    }
}