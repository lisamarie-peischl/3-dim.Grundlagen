class AI_models {
    constructor () {
        this.myCode = "";
        this.myColor = color(128);
        this.arrayOfData = [];
        this.myWidth = 150;
    }
    setData(data) {
        this.arrayOfData = data;
    }

    setColor(c) {
        this.myColor = c;
    }

    setWidth(w) {
        this.myWidth = w;
    }

    draw(centerX, centerY) {
        const n = this.arrayOfData.length;
        const maxValue = Math.max(...this.arrayOfData);

        for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI * 2;
            const length = (this.arrayOfData[i] / maxValue) * this.myWidth;

            const x = centerX + Math.cos(angle) * length;
            const y = centerY + Math.sin(angle) * length;

            stroke(this.myColor);
            line(centerX, centerY, x, y);
        }
    }
}