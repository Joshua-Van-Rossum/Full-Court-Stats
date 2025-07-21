document.addEventListener('DOMContentLoaded', function () {
    console.log("Document loaded, initializing...");
    d3.csv('../uploads/MVP_Player_Data.csv').then(function (data) {
        console.log("Data loaded:", data);
        // Form elements
        const playerSelect = document.getElementById('player-select');
        const seasonStartSelect = document.getElementById('season-start');
        const seasonEndSelect = document.getElementById('season-end');
        const perTotalsSelect = document.getElementById('per-totals');
        const columnSelect = document.getElementById('column-select');
        const showOthersCheckbox = document.getElementById('myCheckbox');
        const form = document.getElementById('options-form');
        const chartContainer = d3.select('#chart');
        const legendContainer = d3.select('#legend');

        // Populate dropdowns
        const players = [...new Set(data.map(d => d.PLAYER_NAME))].sort();
        players.forEach(player => {
            playerSelect.innerHTML += `<option value="${player}">${player}</option>`;
        });

        const allSeasons = [...new Set(data.map(d => d.SEASON_ID))].sort();
        allSeasons.forEach(season => {
            seasonStartSelect.innerHTML += `<option value="${season}">${season}</option>`;
            seasonEndSelect.innerHTML += `<option value="${season}">${season}</option>`;
        });

        const stats = Object.keys(data[0]).filter(key => !["PLAYER_ID", "SEASON_ID", "LEAGUE_ID", "TEAM_ID", "PLAYER_NAME", "MVP", "TEAM_ABBREVIATION", "PLAYER_AGE"].includes(key));
        stats.forEach(stat => {
            columnSelect.innerHTML += `<option value="${stat}">${stat}</option>`;
        });
        // Set default stat to EFF if available
        
        columnSelect.value = 'EFF';
        playerSelect.value = 'LeBron James'; // Set default player to first in list
        seasonStartSelect.value = '2003-04'; // Set default season start
        seasonEndSelect.value = '2024-25'; // Set default season end

        playerSelect.addEventListener("change", () => {
            const selectedPlayer = playerSelect.value;
            console.log("Selected Player:", selectedPlayer);

            d3.csv('../uploads/MVP_Player_Data.csv').then(function (data) {
                // Filter data for the selected player
                const playerData = data.filter(row => row.PLAYER_NAME === selectedPlayer);

                // Get a list of seasons and sort them
                const seasons = playerData.map(row => row.SEASON_ID).sort();

                if (seasons.length > 0) {
                    const firstSeason = seasons[0];
                    const lastSeason = seasons[seasons.length - 1];

                    // Set default selected values
                    seasonStartSelect.value = firstSeason;
                    seasonEndSelect.value = lastSeason;
                }
            });
        });


        // Form submission updates chart

        // --- LEGEND & CHART DRAWING ---
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values
            const selectedPlayer = playerSelect.value;
            const seasonStart = seasonStartSelect.value;
            const seasonEnd = seasonEndSelect.value;
            const statColumn = columnSelect.value;
            const showAll = showOthersCheckbox.checked;
            const avgOrTotal  = perTotalsSelect.value;

            // Clear chart
            chartContainer.selectAll("*").remove();

            // Filter data by season range
            const filteredData = data.filter(d => d.SEASON_ID >= seasonStart && d.SEASON_ID <= seasonEnd);
            const filteredPlayers = [...new Set(filteredData.map(d => d.PLAYER_NAME))].sort();
            // Filter players
            const targetPlayers = showAll ? filteredPlayers : [selectedPlayer];

            // Legend logic
            const legendList = document.getElementById('legend-list');
            legendList.innerHTML = '';
            // Track which players are selected (checked)
            let selectedPlayers = new Set(targetPlayers);

            filteredPlayers.forEach(player => {
                const colorVal = d3.schemeSet3[players.indexOf(player) % 12];
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.gap = '8px';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = targetPlayers.includes(player);
                checkbox.value = player;
                checkbox.style.margin = 0;

                const swatch = document.createElement('span');
                swatch.style.display = 'inline-block';
                swatch.style.width = '18px';
                swatch.style.height = '18px';
                swatch.style.background = colorVal;
                swatch.style.borderRadius = '4px';
                swatch.style.border = '1px solid #333';

                const label = document.createElement('label');
                label.textContent = player;
                label.style.fontSize = '14px';

                li.appendChild(checkbox);
                li.appendChild(swatch);
                li.appendChild(label);
                legendList.appendChild(li);

                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        selectedPlayers.add(player);
                    } else {
                        selectedPlayers.delete(player);
                    }
                    drawChart();
                });
            });

            // Draw chart function
            function drawChart() {
                chartContainer.selectAll("*").remove();
                const perGameColumns = ['FTM','FTA','OREB','DREB','REB','AST','STL','BLK','TOV','PF','PTS','FG3M','FG3A','MIN','FGM','FGA'];

                const groupedData = Array.from(selectedPlayers).map(player => {
                    return {
                        player,
                        values: filteredData
                            .filter(d => d.PLAYER_NAME === player)
                            .map(d => {
                                let rawValue = +d[statColumn];
                                if (avgOrTotal === 'per' && perGameColumns.includes(statColumn)) {
                                    const gamesPlayed = +d.GP;
                                    rawValue = gamesPlayed > 0 ? rawValue / gamesPlayed : 0;
                                }
                                return {
                                    season: d.SEASON_ID,
                                    value: rawValue
                                };
                            })
                    };
                });

                // Chart setup
                const margin = { top: 40, right: 20, bottom: 40, left: 10 },
                    width = 800 - margin.left - margin.right,
                    height = 500 - margin.top - margin.bottom;

                const svg = chartContainer.append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
                    .append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);

                const x = d3.scalePoint()
                    .domain(allSeasons.filter(season => season >= seasonStart && season <= seasonEnd))
                    .range([0, width]);

                const y = d3.scaleLinear()
                    .domain([0, d3.max(groupedData.flatMap(d => d.values.map(v => v.value)))])
                    .range([height, 0]);

                const color = d3.scaleOrdinal(d3.schemeSet3).domain(players);

                // Axes
                svg.append('g')
                    .attr('transform', `translate(0,${height})`)
                    .call(d3.axisBottom(x).tickFormat(d => d ? d.substring(2) : d))
                    .selectAll('text')
                    .attr('transform', 'rotate(-40)')
                    .style('text-anchor', 'end');
                svg.append('g')
                    .call(d3.axisRight(y));

                // Line generator
                const line = d3.line()
                    .x(d => x(d.season))
                    .y(d => y(d.value));

                // Draw lines
                groupedData.forEach(player => {
                    svg.append('path')
                        .datum(player.values)
                        .attr('fill', 'none')
                        .attr('stroke', color(player.player))
                        .attr('stroke-width', 2)
                        .attr('d', line);

                    // Tooltip div
                    let tooltip = d3.select('body').select('.mvp-tooltip');
                    if (tooltip.empty()) {
                        tooltip = d3.select('body')
                            .append('div')
                            .attr('class', 'mvp-tooltip')
                            .style('position', 'absolute')
                            .style('background', '#222')
                            .style('color', '#fff')
                            .style('padding', '6px 12px')
                            .style('border-radius', '6px')
                            .style('pointer-events', 'none')
                            .style('font-size', '13px')
                            .style('opacity', 0);
                    }

                    player.values.forEach(datum => {
                        const original = filteredData.find(row => row.PLAYER_NAME === player.player && row.SEASON_ID === datum.season);
                        if (original && original.MVP && +original.MVP === 1) {
                            svg.append('circle')
                                .attr('cx', x(datum.season))
                                .attr('cy', y(datum.value))
                                .attr('r', 6)
                                .attr('fill', '#fff')
                                .attr('stroke', '#000')
                                .attr('stroke-width', 2);
                        }
                    });

                    // Add invisible hover circles for all data points
                    player.values.forEach(datum => {
                        svg.append('circle')
                            .attr('cx', x(datum.season))
                            .attr('cy', y(datum.value))
                            .attr('r', 5)
                            .attr('fill', color(player.player))
                            .attr('opacity', 0) // invisible by default
                            .on('mouseover', function (event) {
                                tooltip.transition().duration(150).style('opacity', 0.95);
                                tooltip.html(`<strong>${player.player}</strong><br>Season: ${datum.season}<br>${statColumn}: ${datum.value.toFixed(1)}`)
                                    .style('left', (event.pageX + 10) + 'px')
                                    .style('top', (event.pageY - 28) + 'px');
                                d3.select(this).attr('opacity', 0.8); // highlight
                            })
                            .on('mousemove', function (event) {
                                tooltip.style('left', (event.pageX + 10) + 'px')
                                    .style('top', (event.pageY - 28) + 'px');
                            })
                            .on('mouseout', function () {
                                tooltip.transition().duration(200).style('opacity', 0);
                                d3.select(this).attr('opacity', 0); // reset
                            });
                    });

                    // Highlight MVP seasons with visible circle
                    
                });


                // Chart title
                svg.append('text')
                    .attr('x', width / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '22px')
                    .text(`${statColumn} per Season`);
            }

            // Initial draw
            drawChart();
        });

        // Initial chart (optional)
        form.dispatchEvent(new Event('submit'));
    });
});