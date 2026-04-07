class AIModels extends base {
    constructor(data) {
        super(data);
    }

    draw(cx, cy, maxLength, globalMax) {
        strokeWeight(1);

        for (let i = 0; i < this.data.length; i++) {
            const angle = this.getAngle(i);
            const length = this.getLength(this.data[i], maxLength, globalMax);

            const x = cx + Math.cos(angle) * length;
            const y = cy + Math.sin(angle) * length;

            line(cx, cy, x, y);
        }
    }
}