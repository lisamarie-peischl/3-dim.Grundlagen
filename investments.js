class Investments {
    constructor(csvLines) {
        this.csvLines = csvLines;
        this.years = this.buildYears(2012, 2025);
        this.records = [];
        this.countries = [];
        this.countryMap = new Map();
        this.maxInvestment = 0;

        this.parseCsv();
    }

    buildYears(startYear, endYear) {
        const years = [];
        for (let year = startYear; year <= endYear; year += 1) {
            years.push(year);
        }
        return years;
    }

    parseCsv() {
        if (!this.csvLines || this.csvLines.length < 2) {
            return;
        }

        for (let i = 1; i < this.csvLines.length; i += 1) {
            const rawLine = this.csvLines[i].trim();
            if (!rawLine) {
                continue;
            }

            const cols = rawLine.split(';');
            if (cols.length < 4) {
                continue;
            }

            const country = cols[0].trim();
            const countryCode = cols[1].trim();
            const year = Number(cols[2]);
            const investment = Number(cols[3]);

            if (!Number.isFinite(year) || !Number.isFinite(investment)) {
                continue;
            }

            if (!this.countryMap.has(countryCode)) {
                const entry = {
                    name: country,
                    code: countryCode,
                    byYear: new Map()
                };
                this.countryMap.set(countryCode, entry);
                this.countries.push(entry);
            }

            const countryEntry = this.countryMap.get(countryCode);
            countryEntry.byYear.set(year, investment);

            this.records.push({
                country,
                countryCode,
                year,
                investment
            });

            if (investment > this.maxInvestment) {
                this.maxInvestment = investment;
            }
        }

        // Clockwise order by country code, starting with AE.
        this.countries.sort((a, b) => a.code.localeCompare(b.code, 'en', { sensitivity: 'base' }));
    }

    polarX(angle, radius) {
        return Math.cos(angle) * radius;
    }

    polarY(angle, radius) {
        return Math.sin(angle) * radius;
    }

    normalizeAngle(angle) {
        return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
    }

    angleInRange(angle, start, end) {
        const a = this.normalizeAngle(angle);
        const s = this.normalizeAngle(start);
        const e = this.normalizeAngle(end);

        if (s <= e) {
            return a >= s && a <= e;
        }
        return a >= s || a <= e;
    }

    getLayout(size) {
        const margin = size * 0.025;
        const maxOuterRadius = size * 0.5 - margin;
        const targetRadius = width / 6;
        const baseRadius = min(targetRadius, maxOuterRadius);
        const availableHeight = max(8, maxOuterRadius - baseRadius);
        // Use almost full available radius so all countries are visible while preserving true proportions.
        const maxBarHeight = availableHeight;
        const minBarHeight = 0;

        return {
            margin,
            maxOuterRadius,
            baseRadius,
            maxBarHeight,
            minBarHeight,
            countryGap: radians(8)
        };
    }

    getBarGeometry(countryIndex, yearIndex, yearCount, countryCount, layout) {
        const countrySpan = TWO_PI / countryCount;
        const segmentStart = -HALF_PI + countryIndex * countrySpan;
        const segmentEnd = segmentStart + countrySpan;
        const usableStart = segmentStart + layout.countryGap * 0.5;
        const usableEnd = segmentEnd - layout.countryGap * 0.5;
        const yearSpan = (usableEnd - usableStart) / yearCount;
        const barGap = yearSpan * 0.2;

        const angleStart = usableStart + yearIndex * yearSpan + barGap * 0.5;
        const angleEnd = usableStart + (yearIndex + 1) * yearSpan - barGap * 0.5;

        return {
            segmentStart,
            segmentEnd,
            usableStart,
            usableEnd,
            angleStart,
            angleEnd
        };
    }

    getBarHeight(value, layout) {
        if (this.maxInvestment <= 0 || value <= 0) {
            return 0;
        }

        const normalizedValue = constrain(value / this.maxInvestment, 0, 1);
        return layout.minBarHeight + normalizedValue * (layout.maxBarHeight - layout.minBarHeight);
    }

    pickBar(mx, my, cx, cy, size, maxYear = 2025) {
        if (!this.countries.length) {
            return null;
        }

        const layout = this.getLayout(size);
        const countryCount = this.countries.length;
        const yearCount = this.years.length;
        const dx = mx - cx;
        const dy = my - cy;
        const pointerRadius = Math.sqrt(dx * dx + dy * dy);
        const pointerAngle = Math.atan2(dy, dx);

        for (let countryIndex = 0; countryIndex < countryCount; countryIndex += 1) {
            const country = this.countries[countryIndex];

            for (let yearIndex = 0; yearIndex < yearCount; yearIndex += 1) {
                const year = this.years[yearIndex];
                               if (year > maxYear) {
                                   continue;
                               }
               
                const value = country.byYear.has(year) ? country.byYear.get(year) : 0;
                const barHeight = this.getBarHeight(value, layout);
                if (barHeight <= 0) {
                    continue;
                }

                const geometry = this.getBarGeometry(countryIndex, yearIndex, yearCount, countryCount, layout);
                const innerRadius = layout.baseRadius;
                const outerRadius = layout.baseRadius + barHeight;
                const inAngle = this.angleInRange(pointerAngle, geometry.angleStart, geometry.angleEnd);
                const inRadius = pointerRadius >= innerRadius && pointerRadius <= outerRadius;

                if (inAngle && inRadius) {
                    const centerAngle = (geometry.angleStart + geometry.angleEnd) * 0.5;
                    const centerRadius = innerRadius + barHeight * 0.5;
                    return {
                        key: `${country.code}-${year}`,
                        country: country.name,
                        countryCode: country.code,
                        year,
                        value,
                        x: cx + this.polarX(centerAngle, centerRadius),
                        y: cy + this.polarY(centerAngle, centerRadius)
                    };
                }
            }
        }

        return null;
    }

    drawRingBars(cx, cy, size, hoveredBar, selectedBar, maxYear = 2025, selectedCountryCode = null) {
        if (!this.countries.length) {
            return;
        }

        const layout = this.getLayout(size);
        const countryCount = this.countries.length;
        const yearCount = this.years.length;
        const activeKey = selectedBar ? selectedBar.key : (hoveredBar ? hoveredBar.key : null);

        push();
        translate(cx, cy);

        textAlign(CENTER, CENTER);
        textSize(size * 0.024);

        for (let countryIndex = 0; countryIndex < countryCount; countryIndex += 1) {
            const country = this.countries[countryIndex];
            if (selectedCountryCode && country.code !== selectedCountryCode) {
                continue;
            }

            let segmentLabelStart = 0;
            let segmentLabelEnd = 0;

            for (let yearIndex = 0; yearIndex < yearCount; yearIndex += 1) {
                const year = this.years[yearIndex];
                
                if (year > maxYear) {
                    continue;
                }
                
                const value = country.byYear.has(year) ? country.byYear.get(year) : 0;
                const barHeight = this.getBarHeight(value, layout);
                const geometry = this.getBarGeometry(countryIndex, yearIndex, yearCount, countryCount, layout);
                const angleStart = geometry.angleStart;
                const angleEnd = geometry.angleEnd;

                if (yearIndex === 0) {
                    segmentLabelStart = geometry.usableStart;
                    segmentLabelEnd = geometry.usableEnd;
                }

                const x1 = this.polarX(angleStart, layout.baseRadius);
                const y1 = this.polarY(angleStart, layout.baseRadius);
                const x2 = this.polarX(angleEnd, layout.baseRadius);
                const y2 = this.polarY(angleEnd, layout.baseRadius);
                const x3 = this.polarX(angleEnd, layout.baseRadius + barHeight);
                const y3 = this.polarY(angleEnd, layout.baseRadius + barHeight);
                const x4 = this.polarX(angleStart, layout.baseRadius + barHeight);
                const y4 = this.polarY(angleStart, layout.baseRadius + barHeight);

                const yearProgress = (year - this.years[0]) / (this.years[this.years.length - 1] - this.years[0]);
                const bri = map(yearProgress, 0, 1, 100, 245);
                const barKey = `${country.code}-${year}`;
                const isActive = activeKey === barKey;

                noStroke();
                fill(0, 0, bri);
                quad(x1, y1, x2, y2, x3, y3, x4, y4);

                if (isActive) {
                    noFill();
                    stroke(0, 0, 0);
                    strokeWeight(1.5);
                    quad(x1, y1, x2, y2, x3, y3, x4, y4);
                }
            }

            const labelAngle = (segmentLabelStart + segmentLabelEnd) * 0.5;
            const labelRadius = layout.baseRadius - size * 0.0125;
            const lx = this.polarX(labelAngle, labelRadius);
            const ly = this.polarY(labelAngle, labelRadius);
            let labelRotation = labelAngle + HALF_PI;
            const normalizedRotation = ((labelRotation % TWO_PI) + TWO_PI) % TWO_PI;

            if (normalizedRotation > HALF_PI && normalizedRotation < PI + HALF_PI) {
                labelRotation += PI;
            }

            textFont('Helvetica');
            textStyle(NORMAL);
            textSize(min(20, max(10, size * 0.032)));
            fill(255);
            noStroke();

            push();
            translate(lx, ly);
            rotate(labelRotation);
            text(country.code, 0, 0);
            pop();
        }

        pop();
    }

    drawTooltip(bar) {
        if (!bar) {
            return;
        }

        const valueLabel = bar.value.toLocaleString('en-US');
        const line1 = `${bar.country} (${bar.countryCode}) - ${bar.year}`;
        const line2 = `${valueLabel} USD millions`;

        textSize(14);
        textAlign(LEFT, TOP);

        const paddingX = 10;
        const paddingY = 8;
        const tooltipW = max(textWidth(line1), textWidth(line2)) + paddingX * 2;
        const tooltipH = 44;

        let tx = bar.x + 12;
        let ty = bar.y + 12;

        if (tx + tooltipW > width - 8) {
            tx = bar.x - tooltipW - 12;
        }
        if (ty + tooltipH > height - 8) {
            ty = bar.y - tooltipH - 12;
        }

        noStroke();
        fill(0, 0, 20, 235);
        rect(tx, ty, tooltipW, tooltipH, 6);

        fill(0, 0, 255);
        text(line1, tx + paddingX, ty + paddingY);
        text(line2, tx + paddingX, ty + paddingY + 18);
    }
}