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
    }

    polarX(angle, radius) {
        return Math.cos(angle) * radius;
    }

    polarY(angle, radius) {
        return Math.sin(angle) * radius;
    }

    drawRingBars(cx, cy, size) {
        if (!this.countries.length) {
            return;
        }

        const baseRadius = size * 0.36;
        const maxBarHeight = size * 0.18;
        const countryCount = this.countries.length;
        const countrySpan = TWO_PI / countryCount;
        const countryGap = radians(8);
        const yearCount = this.years.length;

        push();
        translate(cx, cy);

        noFill();
        stroke(65, 70, 78);
        strokeWeight(1);
        circle(0, 0, baseRadius * 2);
        circle(0, 0, (baseRadius + maxBarHeight + 14) * 2);

        textAlign(CENTER, CENTER);
        textSize(size * 0.03);

        for (let countryIndex = 0; countryIndex < countryCount; countryIndex += 1) {
            const country = this.countries[countryIndex];
            const segmentStart = -HALF_PI + countryIndex * countrySpan;
            const segmentEnd = segmentStart + countrySpan;
            const usableStart = segmentStart + countryGap * 0.5;
            const usableEnd = segmentEnd - countryGap * 0.5;
            const yearSpan = (usableEnd - usableStart) / yearCount;
            const barGap = yearSpan * 0.2;

            for (let yearIndex = 0; yearIndex < yearCount; yearIndex += 1) {
                const year = this.years[yearIndex];
                const value = country.byYear.has(year) ? country.byYear.get(year) : 0;
                const barHeight = map(value, 0, this.maxInvestment, 0, maxBarHeight);

                const angleStart = usableStart + yearIndex * yearSpan + barGap * 0.5;
                const angleEnd = usableStart + (yearIndex + 1) * yearSpan - barGap * 0.5;

                const x1 = this.polarX(angleStart, baseRadius);
                const y1 = this.polarY(angleStart, baseRadius);
                const x2 = this.polarX(angleEnd, baseRadius);
                const y2 = this.polarY(angleEnd, baseRadius);
                const x3 = this.polarX(angleEnd, baseRadius + barHeight);
                const y3 = this.polarY(angleEnd, baseRadius + barHeight);
                const x4 = this.polarX(angleStart, baseRadius + barHeight);
                const y4 = this.polarY(angleStart, baseRadius + barHeight);

                const hue = map(countryIndex, 0, countryCount, 0, 255);
                const sat = 170 + 85 * (yearIndex / (yearCount - 1));
                const bri = 220;

                noStroke();
                fill(hue, sat, bri);
                quad(x1, y1, x2, y2, x3, y3, x4, y4);
            }

            const labelAngle = (usableStart + usableEnd) * 0.5;
            const labelRadius = baseRadius - size * 0.06;
            const lx = this.polarX(labelAngle, labelRadius);
            const ly = this.polarY(labelAngle, labelRadius);

            const hue = map(countryIndex, 0, countryCount, 0, 255);
            fill(hue, 180, 255);
            noStroke();
            text(country.code, lx, ly);
        }

        pop();
    }
}