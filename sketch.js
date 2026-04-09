let investmentLines;
let invest;
let angle = 0;

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
    invest.drawRingBars(width * 0.5, height * 0.5, size);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    redraw();
}

// lol