
class YearsSlider {
    constructor(startYear = 2012, endYear = 2025) {
        this.startYear = startYear;
        this.endYear = endYear;
        this.maxYear = endYear;
        this.isDragging = false;
        this.sliderHeight = 60;
        this.padding = 20;
    }

    isOver(mx, my, canvasWidth, canvasHeight) {
        const sliderY = canvasHeight - this.sliderHeight;
        return mx >= this.padding && 
               mx <= canvasWidth - this.padding && 
               my >= sliderY && 
               my <= canvasHeight;
    }

    setFromMouse(mx, canvasWidth) {
        const trackStart = this.padding;
        const trackEnd = canvasWidth - this.padding;
        const trackWidth = trackEnd - trackStart;
        const normalized = constrain((mx - trackStart) / trackWidth, 0, 1);
        this.maxYear = Math.round(lerp(this.startYear, this.endYear, normalized));
    }

    draw(canvasWidth, canvasHeight) {
        const sliderY = canvasHeight - this.sliderHeight;
        const trackStart = this.padding;
        const trackEnd = canvasWidth - this.padding;
        const trackWidth = trackEnd - trackStart;
        
        // Background
        push();
        rectMode(CORNER);
        fill(15);
        rect(0, sliderY, canvasWidth, this.sliderHeight);
        
        // Track
        stroke(60);
        strokeWeight(1);
        noFill();
        line(trackStart, sliderY + 24, trackEnd, sliderY + 24);
        
        // Progress bar (filled portion)
        const normalized = (this.maxYear - this.startYear) / (this.endYear - this.startYear);
        const thumbX = trackStart + normalized * trackWidth;
        stroke(100, 100, 200);
        strokeWeight(3);
        line(trackStart, sliderY + 24, thumbX, sliderY + 24);
        
        // Thumb (slider button)
        fill(100, 100, 255);
        noStroke();
        circle(thumbX, sliderY + 24, 14);
        
        // Year labels
        fill(200);
        textSize(12);
        textAlign(CENTER, TOP);
        text(String(this.startYear), trackStart, sliderY + 32);
        text(String(this.endYear), trackEnd, sliderY + 32);
        
        // Current year display
        textSize(14);
        textAlign(CENTER, BOTTOM);
        fill(150, 150, 255);
        text(`Selected: ${this.maxYear}`, canvasWidth * 0.5, sliderY + 20);
        
        pop();
    }
}