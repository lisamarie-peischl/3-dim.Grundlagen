
class YearsSlider {
    constructor(startYear = 2012, endYear = 2025) {
        this.startYear = startYear;
        this.endYear = endYear;
        this.maxYear = endYear;
        this.isDragging = false;
        this.sliderHeight = 120;
        this.padding = 20;
    }

    getTrackBounds(canvasWidth) {
        const columnWidth = canvasWidth / 3;
        const trackStart = columnWidth;
        const trackEnd = columnWidth * 2;
        return { trackStart, trackEnd, trackWidth: columnWidth };
    }

    isOver(mx, my, canvasWidth, sliderY) {
        const { trackStart, trackEnd } = this.getTrackBounds(canvasWidth);
        return mx >= trackStart && 
               mx <= trackEnd && 
               my >= sliderY - this.sliderHeight * 0.5 && 
               my <= sliderY + this.sliderHeight * 0.5;
    }

    setFromMouse(mx, canvasWidth) {
        const { trackStart, trackWidth } = this.getTrackBounds(canvasWidth);
        const normalized = constrain((mx - trackStart) / trackWidth, 0, 1);
        this.maxYear = lerp(this.startYear, this.endYear, normalized);
    }

    draw(canvasWidth, canvasHeight, sliderY) {
        const { trackStart, trackEnd, trackWidth } = this.getTrackBounds(canvasWidth);
        const normalized = (this.maxYear - this.startYear) / (this.endYear - this.startYear);
        const thumbX = trackStart + normalized * trackWidth;
        
        push();
        stroke(255, 127);
        strokeWeight(2);
        noFill();
        line(thumbX, sliderY, trackEnd, sliderY);

        stroke(255);
        strokeWeight(4);
        line(trackStart, sliderY, thumbX, sliderY);

        // Left boundary marker to make the selected range visually explicit.
        if (thumbX > trackStart) {
            const markerHalfHeight = 7;
            line(trackStart, sliderY - markerHalfHeight, trackStart, sliderY + markerHalfHeight);
        }
        
        noStroke();
        fill(255);
        circle(thumbX, sliderY, 14);
        
        fill(255);
        textSize(12);
        textAlign(CENTER, TOP);
        text(String(this.startYear), trackStart, sliderY + 14);
        text(String(this.endYear), trackEnd, sliderY + 14);
        
        textSize(12);
        textAlign(CENTER, TOP);
        fill(255);
        const roundedYear = Math.round(this.maxYear);
        if (roundedYear !== this.startYear && roundedYear !== this.endYear) {
            text(String(roundedYear), thumbX, sliderY + 14);
        }
        pop();
    }
}