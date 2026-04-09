let investmentLines;
let invest;
let hoveredBar = null;
let selectedBar = null;

function preload() {
    investmentLines = loadStrings('data/investment.csv');
}

function setup () {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 255);
    textFont('Helvetica');

    invest = new Investments(investmentLines);
    noLoop();
}

function draw () {
    background(0);

    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;

    hoveredBar = invest.pickBar(mouseX, mouseY, cx, cy, size);
    invest.drawRingBars(cx, cy, size, hoveredBar, selectedBar);

    const tooltipBar = selectedBar || hoveredBar;
    invest.drawTooltip(tooltipBar);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    redraw();
}

function mouseMoved() {
    redraw();
}

function mousePressed() {
    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const picked = invest.pickBar(mouseX, mouseY, cx, cy, size);

    selectedBar = picked;
    redraw();
}

// lol Hallo
