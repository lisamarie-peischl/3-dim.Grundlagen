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

    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;

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

        yearsSlider.draw(width, height);
    }
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
        if (yearsSlider.isOver(mouseX, mouseY, width, height)) {
            yearsSlider.isDragging = true;
            yearsSlider.setFromMouse(mouseX, width);
            redraw();
            return;
        }
    
    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;
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

// lol Hallo

function mouseReleased() {
    yearsSlider.isDragging = false;
    redraw();
}
