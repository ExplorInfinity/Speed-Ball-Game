const TWO_PI = 2 * Math.PI;

class CenterRect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(point) {
        const { x, y } = point;
        return ( this.x - this.w <= x &&
                 this.x + this.w >= x &&
                 this.y - this.h <= y && 
                 this.y + this.h >= y );
    }

    intersects(rect) {
        return !(this.x - this.w > rect.x + rect.w || 
                 this.x + this.w < rect.x - rect.w ||
                 this.y - this.h > rect.y + rect.h || 
                 this.y + this.h < rect.y - rect.h )
    }

    draw(context) {
        const { x, y, w, h } = this;
        context.strokeRect(x - w, y - h, 2*w, 2*h);
    }
}

export default class QuadTree {
    constructor(boundaryRect, capacity) {
        this.boundaryRect = boundaryRect;
        this.capacity = capacity;

        this.points = [];
        this.divided = false;
        this.branches = [];
    }

    static centerRect(x, y, w, h) {
        return new CenterRect(x, y, w, h);
    }

    static drawQuery(context, rect, points, { pointSize=2 }={}) {
        context.fillStyle = 'hsl(from green h s 50)';
        context.strokeStyle = 'hsl(from green h s 70)';
        context.lineWidth = 1.5;

        rect.draw(context);
        for(const point of points) {
            context.beginPath();
            context.arc(point.x, point.y, pointSize, 0, TWO_PI);
            context.fill();
        }
    }

    query(rangeRect, foundPoints=[], childBranch=false) {
        if(!this.boundaryRect.intersects(rangeRect)) {
            return foundPoints;
        }

        if(!childBranch) {
            const { x, y, w, h } = this.boundaryRect;
            const newRects = [];

            const leftX = rangeRect.x - rangeRect.w;
            const rightX = rangeRect.x + rangeRect.w;

            if(x - w > leftX) {
                const newW = ((x - w) - leftX) * 0.5;
                const newX = x + w - newW;
                const rect = new CenterRect(newX, rangeRect.y, newW, rangeRect.h);
                rect.change = { x: -w*2, y: 0 };
                newRects.push(rect);
            } else if(x + w < rightX) {
                const newW = (rightX - (x + w)) * 0.5;
                const newX = newW;
                const rect = new CenterRect(newX, rangeRect.y, newW, rangeRect.h);
                rect.change = { x: w*2, y: 0 };
                newRects.push(rect);
            }
            
            const topY = rangeRect.y - rangeRect.h;
            const bottomY = rangeRect.y + rangeRect.h;
            if(y - h > topY) {
                const newH = ((y - h) - topY) * 0.5;
                const newY = y + h - newH;
                const rect = new CenterRect(rangeRect.x, newY, rangeRect.w, newH);
                rect.change = { x: 0, y: -h*2 };
                newRects.push(rect);
            } else if(y + h < bottomY) {
                const newH = (bottomY - (y + h)) * 0.5;
                const newY = newH;
                const rect = new CenterRect(rangeRect.x, newY, rangeRect.w, newH);
                rect.change = { x: 0, y: h*2 };
                newRects.push(rect);
            }

            for(const rect of newRects) {
                const newPoints = [];
                this.query(rect, newPoints);
                
                for(const point of newPoints) {
                    const { x, y } = rect.change;
                    foundPoints.push({ 
                        x: point.x + x, 
                        y: point.y + y
                    });
                }
            }
        }

        for(const point of this.points) {
            if(rangeRect.contains(point)) {
                foundPoints.push(point);
            }
        }

        if(this.divided) {
            for(const branch of this.branches) {
                branch.query(rangeRect, foundPoints, true);
            }
        }

        return foundPoints
    }

    subdivide() {
        const { x, y, w, h } = this.boundaryRect;
        const newRectW = w * 0.5;
        const newRectH = h * 0.5;
        const topLeftRect = new CenterRect(x - newRectW, y - newRectH, newRectW, newRectH);
        const topRightRect = new CenterRect(x + newRectW, y - newRectH, newRectW, newRectH);
        const bottomLeftRect = new CenterRect(x - newRectW, y + newRectH, newRectW, newRectH);
        const bottomRightRect = new CenterRect(x + newRectW, y + newRectH, newRectW, newRectH);

        const branchRects = [topLeftRect, topRightRect, bottomLeftRect, bottomRightRect];
        for(const rect of branchRects) {
            this.branches.push(new QuadTree(rect, this.capacity));
        }

        // for(const point of this.points) {
        //     for(const branch of this.branches) {
        //         if(branch.insert(point)) {
        //             break
        //         }
        //     }
        // }

        // this.points = [];
    }

    insert(point) {
        if(!this.boundaryRect.contains(point)) {
            return false
        }

        if(this.points.length < this.capacity) {
            this.points.push(point);
        } else {
            if(!this.divided) {
                this.subdivide();
                this.divided = true;
            }

            for(const branch of this.branches) {
                if(branch.insert(point)) {
                    return true
                }
            }
        }
    }

    show(context, { pointSize=2 }={}) {
        context.fillStyle = 'white';
        context.strokeStyle = 'white';

        this.boundaryRect.draw(context);

        for(const point of this.points) {
            context.beginPath();
            context.arc(point.x, point.y, pointSize, 0, TWO_PI);
            context.fill();
        }
        
        if(this.divided) {
            for(const branch of this.branches) {
                branch.show(context);
            }
        }
    }
}