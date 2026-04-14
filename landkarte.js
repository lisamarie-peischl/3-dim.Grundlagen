(() => {
	const PANEL_ID = 'landkarte-panel';
	const SVG_ID = 'landkarte-svg';
	const LEGEND_ID = 'landkarte-legend';
	const HOVER_LABEL_ID = 'landkarte-hover-label';
	const VIEWBOX_WIDTH = 1600;
	const VIEWBOX_HEIGHT = 900;
	const FALLBACK_COUNTRY_LEGEND_Y_RATIO = 0.5;
	const COUNTRY_LEGEND_MAP_GAP = 50;
	const MAP_TO_LEGEND_GAP = 50;
	const TOP3_TEXT_LEFT_OFFSET = 150;
	const TOP3_CIRCLE_RIGHT_MARGIN = 50;
	const DEFAULT_FILL_OPACITY = 1;
	const SELECTED_FILL_OPACITY = 1;

	const countryFillById = new Map([
		[124, '#7AE89A'],
		[156, '#E68A77'],
		[356, '#E6BF77'],
		[376, '#7AD0E6'],
		[410, '#BE7AE6'],
		[702, '#E67AD0'],
		[784, '#F07A98'],
		[826, '#7A9AE6'],
		[840, '#8A7AE6']
	]);

	const euCountriesById = new Set([
		40, 56, 100, 191, 196, 203, 208, 233, 246, 250, 276, 300, 348, 372,
		380, 428, 440, 442, 470, 528, 616, 620, 642, 703, 705, 724, 752
	]);
	const countryIdByCode = new Map([
		['AE', 784],
		['CA', 124],
		['CN', 156],
		['EU', null],
		['IL', 376],
		['IN', 356],
		['KR', 410],
		['SG', 702],
		['UK', 826],
		['US', 840]
	]);
	const countryCodeById = new Map([
		[784, 'AE'],
		[124, 'CA'],
		[156, 'CN'],
		[376, 'IL'],
		[356, 'IN'],
		[410, 'KR'],
		[702, 'SG'],
		[826, 'UK'],
		[840, 'US']
	]);
	const legendEntries = [
		{ code: 'AE', name: 'United Arab Emirates' },
		{ code: 'CA', name: 'Canada' },
		{ code: 'CN', name: 'China' },
		{ code: 'EU', name: 'European Union' },
		{ code: 'IL', name: 'Israel' },
		{ code: 'IN', name: 'India' },
		{ code: 'KR', name: 'South Korea' },
		{ code: 'SG', name: 'Singapore' },
		{ code: 'UK', name: 'United Kingdom' },
		{ code: 'US', name: 'United States' }
	];

	let mapSelection = null;
	let mapCountries = null;
	let mapPath = null;
	let panelRef = null;
	let legendRef = null;
	let hoverLabelRef = null;
	let hoveredCountryId = null;

	function getCountryFill(countryId) {
		if (countryFillById.has(countryId)) {
			return countryFillById.get(countryId);
		}
		if (euCountriesById.has(countryId)) {
			return '#7AE6E6';
		}
		return 'transparent';
	}

	function getLegendFillByCode(code) {
		if (code === 'EU') {
			return '#7AE6E6';
		}

		const countryId = countryIdByCode.get(code);
		return countryId ? getCountryFill(countryId) : 'transparent';
	}

	function getSelectedCountryId() {
		if (typeof selectedCountryCode === 'undefined' || !selectedCountryCode) {
			return null;
		}

		if (selectedCountryCode === 'EU') {
			return 'EU';
		}

		return countryIdByCode.has(selectedCountryCode) ? countryIdByCode.get(selectedCountryCode) : null;
	}

	function refreshMapSelection() {
		if (!mapSelection) {
			return;
		}

		const selectedCountryId = getSelectedCountryId();
		mapSelection
			.attr('fill', (d) => {
				const countryId = Number(d.id);

				if (selectedCountryId === null) {
					return getCountryFill(countryId);
				}

				if (selectedCountryId === 'EU') {
					return euCountriesById.has(countryId) ? getCountryFill(countryId) : 'none';
				}

				return countryId === selectedCountryId ? getCountryFill(countryId) : 'none';
			})
			.attr('fill-opacity', (d) => {
				const countryId = Number(d.id);

				if (selectedCountryId === null) {
					return DEFAULT_FILL_OPACITY;
				}

				if (selectedCountryId === 'EU') {
					return euCountriesById.has(countryId) ? SELECTED_FILL_OPACITY : 0;
				}

				return countryId === selectedCountryId ? SELECTED_FILL_OPACITY : 0;
			});

		refreshHoverState();
	}

	window.refreshLandkarteSelection = refreshMapSelection;

	function getCountryCodeForId(countryId) {
		if (countryCodeById.has(countryId)) {
			return countryCodeById.get(countryId);
		}

		if (euCountriesById.has(countryId)) {
			return 'EU';
		}

		return '';
	}

	function ensureHoverLabel() {
		let hoverLabel = document.getElementById(HOVER_LABEL_ID);
		if (!hoverLabel) {
			hoverLabel = document.createElement('div');
			hoverLabel.id = HOVER_LABEL_ID;
			hoverLabel.style.position = 'fixed';
			hoverLabel.style.zIndex = '7';
			hoverLabel.style.pointerEvents = 'none';
			hoverLabel.style.display = 'none';
			hoverLabel.style.color = '#B3B3B3';
			hoverLabel.style.fontFamily = 'Helvetica, Arial, sans-serif';
			hoverLabel.style.fontSize = '14px';
			hoverLabel.style.fontWeight = '700';
			hoverLabel.style.background = 'rgba(0, 0, 0, 0.75)';
			hoverLabel.style.padding = '2px 6px';
			hoverLabel.style.borderRadius = '4px';
			document.body.appendChild(hoverLabel);
		}

		return hoverLabel;
	}

	function refreshHoverState() {
		if (!mapSelection) {
			return;
		}

		const selectedCountryId = getSelectedCountryId();
		const isCountryColored = (countryId) => {
			if (selectedCountryId === null) {
				return getCountryFill(countryId) !== 'transparent';
			}

			if (selectedCountryId === 'EU') {
				return euCountriesById.has(countryId);
			}

			return countryId === selectedCountryId;
		};

		mapSelection
			.attr('stroke', (d) => {
				const countryId = Number(d.id);
				return countryId === hoveredCountryId && isCountryColored(countryId) ? '#FFFFFF' : '#595959';
			})
			.attr('stroke-width', (d) => {
				const countryId = Number(d.id);
				return countryId === hoveredCountryId && isCountryColored(countryId) ? 1.1 : 0.5;
			});
	}

	function hideHoverLabel() {
		hoveredCountryId = null;
		refreshHoverState();
		if (hoverLabelRef) {
			hoverLabelRef.style.display = 'none';
		}
	}

	function triggerCountrySelection(countryCode) {
		if (typeof window.toggleCountrySelection === 'function') {
			window.toggleCountrySelection(countryCode);
		}
	}

	function ensurePanel() {
		let panel = document.getElementById(PANEL_ID);
		if (!panel) {
			panel = document.createElement('div');
			panel.id = PANEL_ID;
			panel.style.position = 'fixed';
			panel.style.zIndex = '6';
			panel.style.pointerEvents = 'auto';
			panel.style.background = 'transparent';

			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svg.id = SVG_ID;
			svg.setAttribute('viewBox', `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`);
			svg.style.width = '100%';
			svg.style.height = '100%';
			svg.style.display = 'block';
			svg.style.background = 'transparent';
			panel.appendChild(svg);
			document.body.appendChild(panel);
		}
		return panel;
	}

	function ensureLegendPanel() {
		let legend = document.getElementById(LEGEND_ID);
		if (!legend) {
			legend = document.createElement('div');
			legend.id = LEGEND_ID;
			legend.style.position = 'fixed';
			legend.style.zIndex = '6';
			legend.style.pointerEvents = 'auto';
			legend.style.background = 'transparent';
			legend.style.color = '#B3B3B3';
			legend.style.fontFamily = 'Helvetica, Arial, sans-serif';
			legend.style.fontSize = '14px';
			legend.style.lineHeight = '1.35';
			legend.style.display = 'flex';
			legend.style.columnGap = '28px';
			legend.style.alignItems = 'flex-start';

			const columns = [legendEntries.slice(0, 5), legendEntries.slice(5, 10)];
			for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
				const column = document.createElement('div');
				column.style.display = 'flex';
				column.style.flexDirection = 'column';

				for (let i = 0; i < columns[columnIndex].length; i += 1) {
					const entry = columns[columnIndex][i];
					const row = document.createElement('div');
					row.style.display = 'flex';
					row.style.alignItems = 'center';
					row.style.gap = '8px';
					row.style.marginTop = i === 0 ? '0' : '4px';

					const swatch = document.createElement('span');
					swatch.style.width = '12px';
					swatch.style.height = '12px';
					swatch.style.display = 'inline-block';
					swatch.style.flex = '0 0 12px';
					swatch.style.cursor = 'pointer';
					swatch.style.background = getLegendFillByCode(entry.code);
					swatch.addEventListener('click', (event) => {
						event.preventDefault();
						event.stopPropagation();
						triggerCountrySelection(entry.code);
					});
					row.appendChild(swatch);

					const code = document.createElement('span');
					code.style.fontWeight = '700';
					code.textContent = entry.code;
					row.appendChild(code);

					const name = document.createElement('span');
					name.style.fontWeight = '400';
					name.textContent = entry.name;
					row.appendChild(name);

					column.appendChild(row);
				}

				legend.appendChild(column);
			}

			document.body.appendChild(legend);
		}

		return legend;
	}

	function layoutPanel(panel) {
		const colWidth = window.innerWidth / 3;
		const left = 50;
		const panelWidth = Math.max(160, colWidth - TOP3_TEXT_LEFT_OFFSET - TOP3_CIRCLE_RIGHT_MARGIN);
		const panelHeight = panelWidth * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH);
		const countryLegendY = Number.isFinite(window.countryLegendY)
			? window.countryLegendY
			: window.innerHeight * FALLBACK_COUNTRY_LEGEND_Y_RATIO;
		const preferredTop = countryLegendY + COUNTRY_LEGEND_MAP_GAP;
		const maxTop = window.innerHeight - panelHeight - 8;
		const top = Math.max(8, Math.min(preferredTop, maxTop));

		panel.style.left = `${left}px`;
		panel.style.top = `${top}px`;
		panel.style.width = `${panelWidth}px`;
		panel.style.height = `${panelHeight}px`;

		return {
			left,
			top,
			width: panelWidth,
			height: panelHeight
		};
	}

	function layoutLegendPanel(legend, panelLayout) {
		legend.style.left = `${panelLayout.left}px`;
		legend.style.width = `${panelLayout.width}px`;

		const preferredTop = panelLayout.top + panelLayout.height + MAP_TO_LEGEND_GAP;
		const legendHeight = legend.offsetHeight || 0;
		const maxTop = window.innerHeight - legendHeight - 8;
		const top = Math.max(8, Math.min(preferredTop, maxTop));
		legend.style.top = `${top}px`;
	}

	function relayoutMapAndLegend() {
		if (!panelRef || !legendRef) {
			return;
		}

		const panelLayout = layoutPanel(panelRef);
		layoutLegendPanel(legendRef, panelLayout);
	}

	window.updateLandkarteLayout = relayoutMapAndLegend;

	async function drawMap() {
		if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
			return;
		}

		const panel = ensurePanel();
		const legend = ensureLegendPanel();
		const hoverLabel = ensureHoverLabel();
		panelRef = panel;
		legendRef = legend;
		hoverLabelRef = hoverLabel;
		const panelLayout = layoutPanel(panel);
		layoutLegendPanel(legend, panelLayout);

		const svg = d3.select(`#${SVG_ID}`);
		svg.selectAll('*').remove();

		const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json');
		const countries = topojson.feature(world, world.objects.countries);

		const projection = d3.geoEqualEarth();
		projection.fitExtent(
			[
				[12, 12],
				[VIEWBOX_WIDTH - 12, VIEWBOX_HEIGHT - 12]
			],
			countries
		);
		const path = d3.geoPath(projection);

		mapSelection = svg
			.append('g')
			.selectAll('path')
			.data(countries.features)
			.join('path')
			.attr('d', path)
			.attr('pointer-events', 'all')
			.attr('stroke', '#595959')
			.attr('stroke-width', 0.5)
			.attr('stroke-linejoin', 'round')
			.on('mousemove', (event, d) => {
				hoveredCountryId = Number(d.id);
				refreshHoverState();

				const code = getCountryCodeForId(hoveredCountryId);
				if (!code) {
					if (hoverLabelRef) {
						hoverLabelRef.style.display = 'none';
					}
					return;
				}

				if (hoverLabelRef) {
					hoverLabelRef.textContent = code;
					hoverLabelRef.style.display = 'block';
					hoverLabelRef.style.left = `${event.clientX + 10}px`;
					hoverLabelRef.style.top = `${event.clientY + 10}px`;
				}
			})
			.on('mouseleave', hideHoverLabel);

		mapCountries = countries;
		mapPath = path;
		refreshMapSelection();

		window.addEventListener('resize', relayoutMapAndLegend);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', drawMap);
	} else {
		drawMap();
	}
})();
