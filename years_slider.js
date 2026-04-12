
class YearsSlider {
    constructor(startYear = 2012, endYear = 2025) {
        this.startYear = startYear;
        this.endYear = endYear;
        this.minYear = startYear;
        this.maxYear = endYear;
        this.isDragging = false;
        this.activeHandle = null;
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

    getYearFromMouse(mx, canvasWidth, snapToYear = false) {
        const { trackStart, trackWidth } = this.getTrackBounds(canvasWidth);
        const normalized = constrain((mx - trackStart) / trackWidth, 0, 1);
        const yearValue = lerp(this.startYear, this.endYear, normalized);
        return snapToYear ? Math.round(yearValue) : yearValue;
    }

    setFromMouse(mx, canvasWidth, handle = null, snapToYear = false) {
        const yearValue = this.getYearFromMouse(mx, canvasWidth, snapToYear);
        const targetHandle = handle || (Math.abs(yearValue - this.minYear) <= Math.abs(yearValue - this.maxYear) ? 'min' : 'max');

        if (targetHandle === 'min') {
            this.minYear = constrain(yearValue, this.startYear, this.maxYear);
            this.activeHandle = 'min';
        } else {
            this.maxYear = constrain(yearValue, this.minYear, this.endYear);
            this.activeHandle = 'max';
        }
    }

    getHandlePositions(canvasWidth) {
        const { trackStart, trackWidth } = this.getTrackBounds(canvasWidth);
        const minNormalized = (this.minYear - this.startYear) / (this.endYear - this.startYear);
        const maxNormalized = (this.maxYear - this.startYear) / (this.endYear - this.startYear);
        return {
            trackStart,
            trackWidth,
            trackEnd: trackStart + trackWidth,
            minX: trackStart + minNormalized * trackWidth,
            maxX: trackStart + maxNormalized * trackWidth
        };
    }

    pickHandle(mx, canvasWidth) {
        const { minX, maxX } = this.getHandlePositions(canvasWidth);

        // If both handles overlap (or are nearly overlapping), alternate selection
        // so both handles remain reachable.
        if (Math.abs(minX - maxX) < 1.5) {
            return this.activeHandle === 'min' ? 'max' : 'min';
        }

        return Math.abs(mx - minX) <= Math.abs(mx - maxX) ? 'min' : 'max';
    }

    draw(canvasWidth, canvasHeight, sliderY) {
        const { trackStart, trackEnd, trackWidth, minX, maxX } = this.getHandlePositions(canvasWidth);
        
        push();
        stroke(255, 120);
        strokeWeight(2);
        strokeCap(SQUARE);
        noFill();
        line(trackStart, sliderY, trackEnd, sliderY);

        stroke(255);
        strokeWeight(4);
        line(minX, sliderY, maxX, sliderY);

        // Range boundary markers.
        if (minX > trackStart) {
            const markerHalfHeight = 7;
            line(minX, sliderY - markerHalfHeight, minX, sliderY + markerHalfHeight);
        }
        if (maxX < trackEnd) {
            const markerHalfHeight = 7;
            line(maxX, sliderY - markerHalfHeight, maxX, sliderY + markerHalfHeight);
        }
        
        noStroke();
        fill(255);
        circle(minX, sliderY, 14);
        circle(maxX, sliderY, 14);

        textSize(12);
        textAlign(CENTER, TOP);
        const roundedYear = Math.round(this.maxYear);
        for (let year = this.startYear; year <= this.endYear; year += 1) {
            const yearNormalized = (year - this.startYear) / (this.endYear - this.startYear);
            const yearX = trackStart + yearNormalized * trackWidth;
            fill(year === roundedYear ? 255 : 180);
            text(String(year), yearX, sliderY + 25);
        }
        pop();
    }
}