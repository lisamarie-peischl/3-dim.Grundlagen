let investmentLines;
let invest;
let hoveredBar = null;
let selectedBar = null;
let allmodels;
let notablemodels;
let allModelsData;
let notableModelsData;
let currentModels;
let hoveredModelPoint = null;
let selectedModelPoint = null;
let selectedCountryCode = null;
let yearsSlider;
let modelSelector;

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
    allModelsData = new AIModels(allmodels, invest);
    notableModelsData = new AIModels(notablemodels, invest);
    currentModels = allModelsData;
    yearsSlider = new YearsSlider(2012, 2025);

    // Model selector
    modelSelector = createRadio();
    modelSelector.option('Alle KI Modelle');
    modelSelector.option('Notable KI-Modelle');
    modelSelector.selected('Alle KI Modelle');
    modelSelector.style('color', 'white');
    modelSelector.style('font-family', 'Helvetica');
    modelSelector.position(50, 220);
    modelSelector.changed(() => {
        selectedModelPoint = null;
        hoveredModelPoint = null;
        if (modelSelector.value() === 'Alle KI Modelle') {
            currentModels = allModelsData;
        } else {
            currentModels = notableModelsData;
        }
        redraw();
    });

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
    text('TOP 3 in ' + Math.round(yearsSlider.maxYear), line2X + 50, subtitleY);
    pop();

    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const investLayout = invest.getLayout(size);
    const baseCircleRadius = investLayout.baseRadius;
    const sliderAreaTop = cy + baseCircleRadius;
    const sliderAreaBottom = height;
    const sliderY = sliderAreaTop + (sliderAreaBottom - sliderAreaTop) * 0.5;

    currentModels.drawRings(cx, cy, size);

    hoveredBar = invest.pickBar(mouseX, mouseY, cx, cy, size, yearsSlider.maxYear);
    invest.drawRingBars(cx, cy, size, hoveredBar, selectedBar, yearsSlider.maxYear, selectedCountryCode, true);

    hoveredModelPoint = currentModels.pickPoint(mouseX, mouseY);
    currentModels.drawPoints(cx, cy, size, hoveredModelPoint, selectedModelPoint, yearsSlider.maxYear, selectedCountryCode, true, false);

    const tooltipModel = selectedModelPoint || hoveredModelPoint;
    const tooltipBar = selectedBar || hoveredBar;
    if (tooltipModel) {
        currentModels.drawTooltip(tooltipModel);
    } else {
        invest.drawTooltip(tooltipBar);
    }

    drawTopCountryMiniViews(line2X, colWidth, subtitleY + 70);

    yearsSlider.draw(width, height, sliderY);
}

function drawTopCountryMiniViews(rightColumnStartX, rightColumnWidth, topY) {
    const selectedYear = Math.round(yearsSlider.maxYear);
    const topCountries = currentModels.getTopCountriesByModelCount(3, selectedYear);
    if (!topCountries || topCountries.length === 0) {
        return;
    }

    const bottomPadding = 30;
    const availableHeight = max(120, height - topY - bottomPadding);
    const slotGap = 18;
    const slotHeight = (availableHeight - slotGap * 2) / 3;
    const centerX = rightColumnStartX + rightColumnWidth * 0.5;

    push();
    textFont('Helvetica');
    textAlign(CENTER, TOP);

    for (let i = 0; i < topCountries.length; i += 1) {
        const country = topCountries[i];
        const stats = currentModels.getCountryModelStats(country.code, selectedYear);
        const slotTop = topY + i * (slotHeight + slotGap);
        const miniSize = min(rightColumnWidth * 0.86, slotHeight * 0.86);
        const centerY = slotTop + slotHeight * 0.56;
        const textX = centerX + miniSize * 0.5 + 14;
        const textY = centerY - miniSize * 0.3;

        invest.drawRingBars(centerX, centerY, miniSize, null, null, yearsSlider.maxYear, null, false, selectedYear);
        currentModels.drawPoints(centerX, centerY, miniSize, null, null, yearsSlider.maxYear, country.code, false, true, selectedYear);

        fill(255);
        noStroke();
        textAlign(LEFT, TOP);

        textSize(14);
        text(`${i + 1}. ${country.name} (${country.code})`, textX, textY);

        textSize(12);
        text(`Eigene KI-Modelle: ${stats.own}`, textX, textY + 24);
        text(`Kooperationen: ${stats.cooperation}`, textX, textY + 42);
        text(`Insgesamt: ${stats.total}`, textX, textY + 60);
    }

    pop();
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

    const pickedCountryCode = invest.pickCountryLabel(mouseX, mouseY);
    if (pickedCountryCode) {
        selectedCountryCode = selectedCountryCode === pickedCountryCode ? null : pickedCountryCode;
        redraw();
        return;
    }
    
    const pickedModel = currentModels.pickPoint(mouseX, mouseY);

    if (pickedModel) {
        selectedModelPoint = pickedModel;
        selectedBar = null;
        redraw();
        return;
    }

    const picked = invest.pickBar(mouseX, mouseY, cx, cy, size, yearsSlider.maxYear);

    if (picked) {
        selectedBar = picked;
        selectedModelPoint = null;
    } else {
        selectedBar = null;
        selectedModelPoint = null;
        selectedCountryCode = null;
    }
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
