let investmentLines;
let invest;
let hoveredBar = null;
let selectedBar = null;
let allmodels;
let notablemodels;
let aiModels;
let hoveredModelPoint = null;
let selectedModelPoint = null;
let yearsSlider;

function preload() {
    investmentLines = loadStrings('data/investment.csv');
    allmodels = loadStrings('data/models_all.csv');
    notablemodels = loadStrings('data/models_notable.csv');
}

function setup () {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 255);
    textFont('Helvetica');

    invest = new Investments(investmentLines);
    aiModels = new AIModels(allmodels, invest);
        yearsSlider = new YearsSlider(2012, 2025);
    noLoop();
}

function draw () {
    background(0);

    // Draw column separator lines
    const colWidth = width / 3;
    const line1X = colWidth;
    const line2X = colWidth * 2;
    
    push();
    stroke(255, 80);
    strokeWeight(1);
    line(line1X, 0, line1X, height);
    line(line2X, 0, line2X, height);
    pop();

    // Top left titles
    push();
    textFont('Helvetica');
    fill(255);
    textAlign(LEFT, TOP);
    
    textStyle(BOLD);
    textSize(40);
    text('VOM INVESTMENT\nZUM KI-MODELL', 50, 50);
    
    textStyle(NORMAL);
    textSize(28);
    const titleHeight = 40 * 2 + 12;
    const subtitleY = 50 + titleHeight + 20;
    text('WER DOMINIERT KI?', 50, subtitleY);
    text('TOP 3', line2X + 50, subtitleY);
    pop();

    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const investLayout = invest.getLayout(size);
    const baseCircleRadius = investLayout.baseRadius;
    const sliderAreaTop = cy + baseCircleRadius;
    const sliderAreaBottom = height;
    const sliderY = sliderAreaTop + (sliderAreaBottom - sliderAreaTop) * 0.5;

    aiModels.drawRings(cx, cy, size);

    hoveredBar = invest.pickBar(mouseX, mouseY, cx, cy, size, yearsSlider.maxYear);
    invest.drawRingBars(cx, cy, size, hoveredBar, selectedBar, yearsSlider.maxYear);

    hoveredModelPoint = aiModels.pickPoint(mouseX, mouseY);
    aiModels.drawPoints(cx, cy, size, hoveredModelPoint, selectedModelPoint, yearsSlider.maxYear);

    const tooltipModel = selectedModelPoint || hoveredModelPoint;
    const tooltipBar = selectedBar || hoveredBar;
    if (tooltipModel) {
        aiModels.drawTooltip(tooltipModel);
    } else {
        invest.drawTooltip(tooltipBar);
    }

    yearsSlider.draw(width, height, sliderY);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    redraw();
}

function mouseMoved() {
        if (yearsSlider.isDragging) {
            yearsSlider.setFromMouse(mouseX, width);
        }
    redraw();
}

function mousePressed() {
    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const investLayout = invest.getLayout(size);
    const baseCircleRadius = investLayout.baseRadius;
    const sliderAreaTop = cy + baseCircleRadius;
    const sliderAreaBottom = height;
    const sliderY = sliderAreaTop + (sliderAreaBottom - sliderAreaTop) * 0.5;

    if (yearsSlider.isOver(mouseX, mouseY, width, sliderY)) {
        yearsSlider.isDragging = true;
        yearsSlider.setFromMouse(mouseX, width);
        redraw();
        return;
    }
    
    const pickedModel = aiModels.pickPoint(mouseX, mouseY);

    if (pickedModel) {
        selectedModelPoint = pickedModel;
        selectedBar = null;
        redraw();
        return;
    }

    const picked = invest.pickBar(mouseX, mouseY, cx, cy, size, yearsSlider.maxYear);

    selectedBar = picked;
    selectedModelPoint = null;
    redraw();
}

function mouseDragged() {
    if (yearsSlider.isDragging) {
        yearsSlider.setFromMouse(mouseX, width);
        redraw();
    }
}

// lol Hallo

function mouseReleased() {
    yearsSlider.isDragging = false;
    redraw();
}
