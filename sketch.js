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
let playButton;
let isPlayingTimeline = false;
let timelineStartMs = 0;
const PLAYBACK_START_YEAR = 2012;
const PLAYBACK_END_YEAR = 2025;
const PLAYBACK_DURATION_MS = 4500;

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
    modelSelector.option('Alle KI-Modelle');
    modelSelector.option('Bedeutende KI-Modelle');
    modelSelector.selected('Alle KI-Modelle');
    modelSelector.addClass('model-selector');
    modelSelector.style('color', 'white');
    modelSelector.style('font-family', 'Helvetica');
    const titleHeight = 40 * 2 + 12;
    const subtitleFontSize = 28;
    const subtitleY = 50 + titleHeight + 50;
    const chooseY = subtitleY + 100;
    modelSelector.position(50, chooseY + 50);
    modelSelector.changed(() => {
        stopTimelinePlayback();
        selectedModelPoint = null;
        hoveredModelPoint = null;
        if (modelSelector.value() === 'Alle KI-Modelle') {
            currentModels = allModelsData;
        } else {
            currentModels = notableModelsData;
        }
        redraw();
    });

    playButton = createButton('Play');
    playButton.addClass('timeline-play-button');
    playButton.style('font-family', 'Helvetica');
    playButton.style('font-size', '14px');
    playButton.style('font-weight', '400');
    playButton.style('font-style', 'normal');
    playButton.style('padding', '6px 16px');
    playButton.style('border', '1px solid #b7b7b7');
    playButton.style('border-radius', '6px');
    playButton.style('background', '#000000');
    playButton.style('color', '#ffffff');
    playButton.style('cursor', 'pointer');
    playButton.style('z-index', '20');
    playButton.mousePressed(startTimelinePlayback);

    noLoop();
}

function draw () {
    updateTimelinePlayback();
    background(0);

    // Draw column separator lines
    const colWidth = width / 3;
    const line1X = colWidth;
    const line2X = colWidth * 2;
    
    // Top left titles
    push();
    textFont('Helvetica');
    fill(255);
    textAlign(LEFT, TOP);
    
    textStyle(BOLD);
    textSize(40);
    const titleTopY = 50;
    const titleAscent = textAscent();
    const titleLineHeight = titleAscent + textDescent();
    const titleSecondLineY = titleTopY + titleLineHeight + 12;
    const titleSecondLineBottomY = titleSecondLineY + titleAscent;
    text('VOM INVESTMENT\nZUM KI-MODELL', 50, titleTopY);
    
    textStyle(NORMAL);
    textSize(28);
    const titleHeight = 40 * 2 + 12;
    const subtitleY = 50 + titleHeight + 50;
    const chooseY = subtitleY + 100;
    const top3Ascent = textAscent();
    const top3Y = titleSecondLineBottomY - top3Ascent;
    text('WER DOMINIERT KI?', 50, subtitleY);
    textSize(22);
    text('Überschrift', 50, chooseY);
    textSize(28);
    text('TOP 3 in ' + Math.round(yearsSlider.maxYear), line2X + 50, top3Y);
    pop();

    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const investLayout = invest.getLayout(size);
    const baseCircleRadius = investLayout.baseRadius;
    const sliderAreaTop = cy + baseCircleRadius;
    const sliderAreaBottom = height;
    const sliderY = sliderAreaTop + (sliderAreaBottom - sliderAreaTop) * 0.5;
    const sliderTrackLeftX = line1X;

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

    drawTopCountryMiniViews(line2X, colWidth, top3Y + 50);

    push();
    textFont('Helvetica');
    textStyle(NORMAL);
    textSize(14);
    textAlign(LEFT, BOTTOM);
    fill(255);
    text(
        'OECD (2026): VC investments in AI by country. OECD.AI Data Explorer.\nEpoch AI (2026): Data on AI Models.',
        50,
        height - 50
    );
    pop();

    yearsSlider.draw(width, height, sliderY);

    if (playButton) {
        const buttonHeight = playButton.elt ? playButton.elt.offsetHeight : 0;
        playButton.position(sliderTrackLeftX, height - 50 - buttonHeight);
    }
}

function startTimelinePlayback() {
    if (isPlayingTimeline) {
        return;
    }

    yearsSlider.maxYear = PLAYBACK_START_YEAR;
    isPlayingTimeline = true;
    timelineStartMs = millis();
    if (playButton) {
        playButton.attribute('disabled', '');
        playButton.style('opacity', '0.65');
        playButton.style('cursor', 'default');
    }
    loop();
}

function stopTimelinePlayback() {
    isPlayingTimeline = false;
    timelineStartMs = 0;
    if (playButton) {
        playButton.removeAttribute('disabled');
        playButton.style('opacity', '1');
        playButton.style('cursor', 'pointer');
    }
    noLoop();
}

function drawTopCountryMiniViews(rightColumnStartX, rightColumnWidth, topY) {
    const selectedYear = Math.round(yearsSlider.maxYear);
    const topCountries = currentModels.getTopCountriesByModelCount(3, selectedYear);
    if (!topCountries || topCountries.length === 0) {
        return;
    }

    const bottomPadding = 50;
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
        const textX = centerX + miniSize * 0.5 + 20;

        const headingLineHeight = 14;
        const paragraphGap = 16;
        const infoLineHeight = 20;
        const cooperationTotalGap = 10;
        const info1Offset = headingLineHeight + paragraphGap;
        const info2Offset = info1Offset + infoLineHeight;
        const info3Offset = info2Offset + infoLineHeight + cooperationTotalGap;
        const blockHeight = info3Offset + headingLineHeight;
        const textY = centerY - blockHeight * 0.5;

        invest.drawRingBars(centerX, centerY, miniSize, null, null, yearsSlider.maxYear, null, false, selectedYear, 0.02, 12);
        currentModels.drawPoints(centerX, centerY, miniSize, null, null, yearsSlider.maxYear, country.code, false, true, selectedYear);

        fill(255);
        noStroke();
        textAlign(LEFT, TOP);

        textStyle(BOLD);
        textSize(12);
        text(`${i + 1}. ${country.name.toUpperCase()} (${country.code.toUpperCase()})`, textX, textY);

        textStyle(NORMAL);
        textSize(14);
        text(`Eigene KI-Modelle: ${stats.own}`, textX, textY + info1Offset);
        text(`Kooperationen: ${stats.cooperation}`, textX, textY + info2Offset);
        text(`Insgesamt: ${stats.total}`, textX, textY + info3Offset);
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

function isPointerOverPlayButton(clientX, clientY) {
    if (!playButton || !playButton.elt) {
        return false;
    }

    const rect = playButton.elt.getBoundingClientRect();
    const extraHitPadding = 6;
    return (
        clientX >= rect.left - extraHitPadding &&
        clientX <= rect.right + extraHitPadding &&
        clientY >= rect.top - extraHitPadding &&
        clientY <= rect.bottom + extraHitPadding
    );
}

function mousePressed(event) {
    const clientX = event && Number.isFinite(event.clientX) ? event.clientX : winMouseX;
    const clientY = event && Number.isFinite(event.clientY) ? event.clientY : winMouseY;

    if (isPointerOverPlayButton(clientX, clientY)) {
        return;
    }

    const size = min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const investLayout = invest.getLayout(size);
    const baseCircleRadius = investLayout.baseRadius;
    const sliderAreaTop = cy + baseCircleRadius;
    const sliderAreaBottom = height;
    const sliderY = sliderAreaTop + (sliderAreaBottom - sliderAreaTop) * 0.5;

    if (yearsSlider.isOver(mouseX, mouseY, width, sliderY)) {
        stopTimelinePlayback();
        yearsSlider.isDragging = true;
        yearsSlider.setFromMouse(mouseX, width, true);
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

function updateTimelinePlayback() {
    if (!isPlayingTimeline) {
        return;
    }

    const elapsedMs = max(0, millis() - timelineStartMs);
    const t = constrain(elapsedMs / PLAYBACK_DURATION_MS, 0, 1);

    yearsSlider.maxYear = lerp(PLAYBACK_START_YEAR, PLAYBACK_END_YEAR, t);

    if (t >= 1) {
        yearsSlider.maxYear = PLAYBACK_END_YEAR;
        stopTimelinePlayback();
    }
}
