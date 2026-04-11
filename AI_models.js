class AIModels {
    constructor(csvLines, investments) {
        this.csvLines = csvLines;
        this.investments = investments;
        this.startYear = 2012;
        this.endYear = 2025;
        this.years = this.buildYears(this.startYear, this.endYear);
        this.models = [];
        this.bucketMap = new Map();
        this.renderedPoints = [];

        this.parseModels();
    }

    buildYears(startYear, endYear) {
        const years = [];
        for (let year = startYear; year <= endYear; year += 1) {
            years.push(year);
        }
        return years;
    }

    cleanField(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).replace(/"/g, '').trim();
    }

    parseSemicolonRecord(recordText) {
        const fields = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < recordText.length; i += 1) {
            const ch = recordText[i];

            if (ch === '"') {
                const next = recordText[i + 1];
                if (inQuotes && next === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (ch === ';' && !inQuotes) {
                fields.push(current);
                current = '';
                continue;
            }

            current += ch;
        }

        fields.push(current);
        return fields.map((field) => this.cleanField(field));
    }

    isRecordComplete(recordText) {
        let inQuotes = false;

        for (let i = 0; i < recordText.length; i += 1) {
            const ch = recordText[i];
            if (ch !== '"') {
                continue;
            }

            const next = recordText[i + 1];
            if (inQuotes && next === '"') {
                i += 1;
                continue;
            }

            inQuotes = !inQuotes;
        }

        return !inQuotes;
    }

    parseCountryCodes(value) {
        const parts = this.cleanField(value)
            .split(',')
            .map((entry) => this.cleanField(entry).toUpperCase())
            .filter((entry) => entry.length > 0);

        return [...new Set(parts)];
    }

    getBucketKey(year, countryCode) {
        return `${year}-${countryCode}`;
    }

    parseModels() {
        if (!this.csvLines || this.csvLines.length < 2 || !this.investments) {
            return;
        }

        const validCodes = new Set(this.investments.countries.map((country) => country.code));

        let rowIndex = 0;
        let buffer = '';

        for (let i = 1; i < this.csvLines.length; i += 1) {
            const rawLine = this.csvLines[i];
            buffer = buffer ? `${buffer}\n${rawLine}` : rawLine;

            if (!this.isRecordComplete(buffer)) {
                continue;
            }

            const cols = this.parseSemicolonRecord(buffer);
            buffer = '';
            rowIndex += 1;
            if (cols.length < 4) {
                continue;
            }

            const year = Number(cols[2]);

            if (!Number.isFinite(year) || year < this.startYear || year > this.endYear) {
                continue;
            }

            const modelName = cols[3] || '';
            if (!modelName) {
                continue;
            }

            const organization = cols.length > 4 ? cols.slice(4).join(';') : '';
            const country = cols[0] || '';
            const countryCodes = this.parseCountryCodes(cols[1]).filter((code) => validCodes.has(code));

            if (countryCodes.length === 0) {
                continue;
            }

            const model = {
                id: `model-${rowIndex}`,
                year,
                modelName,
                organization,
                country,
                countryCodes
            };

            this.models.push(model);

            for (let i = 0; i < countryCodes.length; i += 1) {
                const code = countryCodes[i];
                const key = this.getBucketKey(year, code);
                if (!this.bucketMap.has(key)) {
                    this.bucketMap.set(key, []);
                }
                this.bucketMap.get(key).push(model);
            }
        }

        for (const bucket of this.bucketMap.values()) {
            bucket.sort((a, b) => a.modelName.localeCompare(b.modelName, 'en', { sensitivity: 'base' }));
        }
    }

    getCountryIndexByCode() {
        const mapping = new Map();
        for (let i = 0; i < this.investments.countries.length; i += 1) {
            mapping.set(this.investments.countries[i].code, i);
        }
        return mapping;
    }

    getTopCountriesByModelCount(limit = 3, exactYear = null) {
        const counts = new Map();
        for (const model of this.models) {
            if (exactYear !== null && model.year !== exactYear) {
                continue;
            }

            for (const code of model.countryCodes) {
                counts.set(code, (counts.get(code) || 0) + 1);
            }
        }

        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([code, count]) => ({
                code,
                count,
                name: this.investments.countryMap.has(code) ? this.investments.countryMap.get(code).name : code
            }));

        return sorted;
    }

    getCountryModelStats(countryCode, exactYear = null) {
        let own = 0;
        let cooperation = 0;

        for (let i = 0; i < this.models.length; i += 1) {
            const model = this.models[i];
            if (exactYear !== null && model.year !== exactYear) {
                continue;
            }

            if (!model.countryCodes.includes(countryCode)) {
                continue;
            }

            if (model.countryCodes.length > 1) {
                cooperation += 1;
            } else {
                own += 1;
            }
        }

        return {
            own,
            cooperation,
            total: own + cooperation
        };
    }

    getColorForCountryIndex(countryIndex, countryCount, sat = 180, bri = 235) {
        const hue = map(countryIndex, 0, countryCount, 0, 255);
        return color(hue, sat, bri);
    }

    getColorWithYearGradient(countryIndex, countryCount, year, startYear, endYear) {
        const yearProgress = (year - startYear) / (endYear - startYear);
        const bri = map(yearProgress, 0, 1, 100, 255);
        return color(0, 0, bri);
    }

    getCountryBaseHex(countryCode) {
        const palette = {
            US: '#B8C0FF',
            SG: '#FFC6FF',
            UK: '#6FA8FF',
            CN: '#F2845C',
            IN: '#5ED3A5',
            BR: '#E9C46A',
            IL: '#B3E0FF',
            AE: '#2F9E77',
            KR: '#E0565B'
        };
        return palette[countryCode] || '#00D8FF';
    }

    getCountryColor(countryCode, year) {
        const yearProgress = constrain((year - this.startYear) / (this.endYear - this.startYear), 0, 1);
        const bri = lerp(125, 245, yearProgress);
        const base = color(this.getCountryBaseHex(countryCode));
        return color(hue(base), saturation(base), bri);
    }

    hashToUnit(seed) {
        let hash = 2166136261;
        const text = String(seed);

        for (let i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }

        return (hash >>> 0) / 4294967295;
    }

    getLayout(size) {
        const investmentsLayout = this.investments.getLayout(size);
        const innerRadius = size * 0.02;
        // Keep only a small gap between country-code track and model-point area.
        const outerRadius = max(innerRadius + 16, investmentsLayout.baseRadius - size * 0.025);
        const ringCount = this.years.length;
        const ringStep = ringCount > 1 ? (outerRadius - innerRadius) / (ringCount - 1) : 0;
        const dotRadius = max(0.4, size * 0.001);

        return {
            innerRadius,
            outerRadius,
            ringStep,
            ringCount,
            dotRadius,
            countryGap: investmentsLayout.countryGap
        };
    }

    getCountryAngleRange(countryIndex, countryCount, countryGap) {
        const span = TWO_PI / countryCount;
        const start = -HALF_PI + countryIndex * span + countryGap * 0.5;
        const end = -HALF_PI + (countryIndex + 1) * span - countryGap * 0.5;
        return { start, end };
    }

    drawRings(cx, cy, size) {
        // Intentionally empty: no inner guide lines for model rings.
    }

    drawPoints(cx, cy, size, hoveredPoint, selectedPoint, maxYear = 2025, selectedCountryCode = null, collectForPicking = true, strictCountryFilter = false, exactYear = null) {
        if (!this.investments || this.investments.countries.length === 0) {
            return;
        }

        const layout = this.getLayout(size);
        const countries = this.investments.countries;
        const countryCount = countries.length;
        const activeModelId = selectedPoint ? selectedPoint.model.id : (hoveredPoint ? hoveredPoint.model.id : null);
        if (collectForPicking) {
            this.renderedPoints = [];
        }

        push();
        translate(cx, cy);

        for (let yearIndex = 0; yearIndex < this.years.length; yearIndex += 1) {
            const year = this.years[yearIndex];

            if (exactYear !== null && year !== exactYear) {
                continue;
            }
            
            if (year > maxYear) {
                continue;
            }
            
            const radius = layout.innerRadius + yearIndex * layout.ringStep;

            for (let countryIndex = 0; countryIndex < countryCount; countryIndex += 1) {
                const code = countries[countryIndex].code;
                const key = this.getBucketKey(year, code);
                const models = this.bucketMap.get(key) || [];
                if (models.length === 0) {
                    continue;
                }

                const angleRange = this.getCountryAngleRange(countryIndex, countryCount, layout.countryGap);

                for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
                    const model = models[modelIndex];
                    const belongsToSelectedCountry = !selectedCountryCode || model.countryCodes.includes(selectedCountryCode);
                    if (strictCountryFilter && !belongsToSelectedCountry) {
                        continue;
                    }

                    const t = (modelIndex + 1) / (models.length + 1);
                    const baseAngle = lerp(angleRange.start, angleRange.end, t);
                    const segmentWidth = abs(angleRange.end - angleRange.start);
                    const angleJitterScale = min(segmentWidth * 0.22, 0.07);
                    const angleJitter = (this.hashToUnit(`${model.id}-${code}-a`) - 0.5) * 2 * angleJitterScale;
                    const radialJitterScale = max(1.4, layout.ringStep * 0.44);
                    const radialJitter = (this.hashToUnit(`${model.id}-${code}-r`) - 0.5) * 2 * radialJitterScale;
                    const angle = baseAngle + angleJitter;
                    const minYearRadius = radius - layout.ringStep * 0.48;
                    const maxYearRadius = radius + layout.ringStep * 0.48;
                    const radiusWithJitter = constrain(
                        radius + radialJitter,
                        max(layout.innerRadius, minYearRadius),
                        min(layout.outerRadius, maxYearRadius)
                    );
                    const localX = Math.cos(angle) * radiusWithJitter;
                    const localY = Math.sin(angle) * radiusWithJitter;
                    const x = cx + localX;
                    const y = cy + localY;

                    const fillColor = this.getCountryColor(code, year);
                    let strokeColor = fillColor;

                    if (model.countryCodes.length > 1) {
                        const otherCode = model.countryCodes.find((entry) => entry !== code);
                        if (otherCode) {
                            strokeColor = this.getCountryColor(otherCode, year);
                        }
                    }

                    const isActive = activeModelId && activeModelId === model.id;
                    const pointAlpha = belongsToSelectedCountry ? 255 : 13;

                    const fillHue = hue(fillColor);
                    const fillSat = saturation(fillColor);
                    const fillBri = brightness(fillColor);
                    const strokeHue = hue(strokeColor);
                    const strokeSat = saturation(strokeColor);
                    const strokeBri = brightness(strokeColor);

                    stroke(strokeHue, strokeSat, strokeBri, pointAlpha);
                    strokeWeight(isActive ? 2.2 : 1.2);
                    fill(fillHue, fillSat, fillBri, pointAlpha);
                    circle(localX, localY, layout.dotRadius * 2);

                    if (isActive) {
                        noFill();
                        stroke(0, 0, 255);
                        strokeWeight(1.1);
                        circle(localX, localY, layout.dotRadius * 3.4);
                    }

                    if (collectForPicking) {
                        this.renderedPoints.push({
                            model,
                            countryCode: code,
                            x,
                            y,
                            radius: layout.dotRadius
                        });
                    }
                }
            }
        }

        pop();
    }

    pickPoint(mx, my) {
        let best = null;
        let bestDistance = Infinity;

        for (let i = 0; i < this.renderedPoints.length; i += 1) {
            const point = this.renderedPoints[i];
            const dx = mx - point.x;
            const dy = my - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= point.radius + 2 && distance < bestDistance) {
                best = point;
                bestDistance = distance;
            }
        }

        return best;
    }

    drawTooltip(point) {
        if (!point) {
            return;
        }

        const model = point.model;
        const line1 = `${model.modelName} (${model.year})`;
        const line2 = `Org: ${model.organization || 'Unknown'}`;
        const line3 = `Country: ${model.countryCodes.join(', ')}`;

        textSize(13);
        textAlign(LEFT, TOP);

        const paddingX = 10;
        const paddingY = 8;
        const tooltipW = max(textWidth(line1), textWidth(line2), textWidth(line3)) + paddingX * 2;
        const tooltipH = 62;

        let tx = point.x + 12;
        let ty = point.y + 12;

        if (tx + tooltipW > width - 8) {
            tx = point.x - tooltipW - 12;
        }
        if (ty + tooltipH > height - 8) {
            ty = point.y - tooltipH - 12;
        }

        noStroke();
        fill(0, 0, 20, 235);
        rect(tx, ty, tooltipW, tooltipH, 6);

        fill(0, 0, 255);
        text(line1, tx + paddingX, ty + paddingY);
        text(line2, tx + paddingX, ty + paddingY + 18);
        text(line3, tx + paddingX, ty + paddingY + 36);
    }
}