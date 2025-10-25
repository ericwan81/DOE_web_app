// Global variables
let numFactors = 2;
let factors = [];
let doeRuns = [];
let analysisResults = {};

// Step Navigation Functions
function goToStep1() {
    showStep(1);
}

function goToStep2() {
    numFactors = parseInt(document.querySelector('input[name="numFactors"]:checked').value);
    generateFactorInputs();
    showStep(2);
}

function goToStep3() {
    showStep(3);
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.add('hidden');
    });

    // Show current step
    document.getElementById(`step${stepNumber}`).classList.remove('hidden');

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Step 2: Generate Factor Inputs
function generateFactorInputs() {
    const container = document.getElementById('factorInputs');
    container.innerHTML = '';

    const factorLabels = ['A', 'B', 'C'];
    const defaultNames = ['Temperature', 'Pressure', 'Time'];

    for (let i = 0; i < numFactors; i++) {
        const factorDiv = document.createElement('div');
        factorDiv.className = 'factor-input-group';
        factorDiv.innerHTML = `
            <h4>Factor ${factorLabels[i]}</h4>
            <div class="input-row">
                <div class="input-group">
                    <label>Factor Name</label>
                    <input type="text" id="factorName${i}" placeholder="${defaultNames[i]}" value="${defaultNames[i]}">
                </div>
                <div class="input-group">
                    <label>Low Level (-1)</label>
                    <input type="number" id="lowLevel${i}" placeholder="e.g., 20" value="${(i + 1) * 10}">
                </div>
                <div class="input-group">
                    <label>High Level (+1)</label>
                    <input type="number" id="highLevel${i}" placeholder="e.g., 80" value="${(i + 1) * 10 + 50}">
                </div>
            </div>
        `;
        container.appendChild(factorDiv);
    }
}

// Generate Full Factorial DOE Table
function generateDOETable() {
    // Collect factor information
    factors = [];
    for (let i = 0; i < numFactors; i++) {
        const name = document.getElementById(`factorName${i}`).value || `Factor ${String.fromCharCode(65 + i)}`;
        const lowLevel = parseFloat(document.getElementById(`lowLevel${i}`).value);
        const highLevel = parseFloat(document.getElementById(`highLevel${i}`).value);

        if (isNaN(lowLevel) || isNaN(highLevel)) {
            alert('Please enter valid numeric values for all factor levels.');
            return;
        }

        factors.push({
            name: name,
            label: String.fromCharCode(65 + i),
            lowLevel: lowLevel,
            highLevel: highLevel
        });
    }

    // Generate full factorial design with 2 replicates
    const numTreatments = Math.pow(2, numFactors);
    const numReplicates = 2;
    doeRuns = [];

    // Create all treatment combinations with replicates
    for (let rep = 0; rep < numReplicates; rep++) {
        for (let run = 0; run < numTreatments; run++) {
            const runData = {
                stdOrder: run + 1,  // Standard order
                replicate: rep + 1,
                factors: {},
                responses: []  // Changed to array to store multiple responses
            };

            for (let f = 0; f < numFactors; f++) {
                // Binary pattern for factorial design
                const level = (run & (1 << f)) ? 1 : -1;
                runData.factors[factors[f].label] = level;
            }

            doeRuns.push(runData);
        }
    }

    // Randomize run order
    for (let i = doeRuns.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [doeRuns[i], doeRuns[j]] = [doeRuns[j], doeRuns[i]];
    }

    // Assign random run numbers
    doeRuns.forEach((run, index) => {
        run.runNumber = index + 1;
    });

    // Create table
    createDOETable();
    showStep(3);
}

function createDOETable() {
    const thead = document.getElementById('doeTableHead');
    const tbody = document.getElementById('doeTableBody');

    // Create header
    let headerHTML = '<tr><th>Run #</th><th>Rep</th>';
    factors.forEach(factor => {
        headerHTML += `<th>${factor.name}<br>(${factor.label})</th>`;
    });
    headerHTML += '<th>Response</th></tr>';
    thead.innerHTML = headerHTML;

    // Create body
    tbody.innerHTML = '';
    doeRuns.forEach((run, index) => {
        const row = document.createElement('tr');

        // Run number
        row.innerHTML = `<td><strong>${run.runNumber}</strong></td>`;

        // Replicate number
        row.innerHTML += `<td>${run.replicate}</td>`;

        // Factor levels
        factors.forEach(factor => {
            const level = run.factors[factor.label];
            const actualValue = level === -1 ? factor.lowLevel : factor.highLevel;
            row.innerHTML += `<td>${level > 0 ? '+' : ''}${level}<br><small>(${actualValue})</small></td>`;
        });

        // Response input
        row.innerHTML += `<td><input type="number" id="response${index}" placeholder="Enter result" step="0.01"></td>`;

        tbody.appendChild(row);
    });
}

// Perform DOE Analysis
function performAnalysis() {
    console.log('=== ANALYZE BUTTON CLICKED ===');
    console.log('Number of doeRuns:', doeRuns.length);
    console.log('Number of factors:', numFactors);

    // Collect response data
    let allDataEntered = true;
    let missingIndices = [];

    doeRuns.forEach((run, index) => {
        const responseInput = document.getElementById(`response${index}`);

        if (!responseInput) {
            console.error(`Response input ${index} not found in DOM`);
            allDataEntered = false;
            return;
        }

        const inputValue = responseInput.value;
        console.log(`Input ${index}: "${inputValue}"`);

        // Check if value is empty or not a valid number
        if (!inputValue || inputValue.trim() === '') {
            console.log(`Missing value at index ${index}`);
            allDataEntered = false;
            missingIndices.push(index + 1);
        } else {
            const value = parseFloat(inputValue);
            if (isNaN(value)) {
                console.log(`Invalid number at index ${index}: "${inputValue}"`);
                allDataEntered = false;
                missingIndices.push(index + 1);
            } else {
                run.response = value;
                console.log(`Set response ${index} = ${value}`);
            }
        }
    });

    if (!allDataEntered) {
        alert(`Please enter valid numeric values for all experimental runs.\nMissing/invalid at run(s): ${missingIndices.join(', ')}`);
        return;
    }

    console.log('✓ All data validated successfully');
    console.log('Responses:', doeRuns.map(r => r.response));

    // Calculate effects
    try {
        console.log('Starting calculateEffects...');
        calculateEffects();
        console.log('✓ Effects calculated successfully');
        console.log('Main effects:', analysisResults.mainEffects);
        console.log('Interaction effects:', analysisResults.interactionEffects);
    } catch (error) {
        console.error('❌ Error in calculateEffects:', error);
        console.error('Stack trace:', error.stack);
        alert('Error calculating effects: ' + error.message);
        return;
    }

    // Generate report
    try {
        console.log('Starting generateReport...');
        generateReport();
        console.log('✓ Report generated successfully');
    } catch (error) {
        console.error('❌ Error in generateReport:', error);
        console.error('Stack trace:', error.stack);
        alert('Error generating report: ' + error.message);
        return;
    }

    console.log('Moving to step 4...');
    showStep(4);
    console.log('=== ANALYSIS COMPLETE ===');
}

function calculateEffects() {
    const responses = doeRuns.map(run => run.response);
    const n = doeRuns.length;

    // Calculate overall mean
    const mean = responses.reduce((sum, val) => sum + val, 0) / n;

    // Calculate main effects (using all replicates)
    const mainEffects = {};
    factors.forEach(factor => {
        const highSum = doeRuns
            .filter(run => run.factors[factor.label] === 1)
            .reduce((sum, run) => sum + run.response, 0);
        const lowSum = doeRuns
            .filter(run => run.factors[factor.label] === -1)
            .reduce((sum, run) => sum + run.response, 0);

        const highCount = doeRuns.filter(run => run.factors[factor.label] === 1).length;
        const lowCount = doeRuns.filter(run => run.factors[factor.label] === -1).length;

        mainEffects[factor.label] = (highSum / highCount) - (lowSum / lowCount);
    });

    // Calculate interaction effects (using all replicates)
    const interactionEffects = {};
    if (numFactors >= 2) {
        for (let i = 0; i < numFactors; i++) {
            for (let j = i + 1; j < numFactors; j++) {
                const f1 = factors[i].label;
                const f2 = factors[j].label;
                const interaction = `${f1}${f2}`;

                const highHighSum = doeRuns
                    .filter(run => run.factors[f1] === 1 && run.factors[f2] === 1)
                    .reduce((sum, run) => sum + run.response, 0);
                const highLowSum = doeRuns
                    .filter(run => run.factors[f1] === 1 && run.factors[f2] === -1)
                    .reduce((sum, run) => sum + run.response, 0);
                const lowHighSum = doeRuns
                    .filter(run => run.factors[f1] === -1 && run.factors[f2] === 1)
                    .reduce((sum, run) => sum + run.response, 0);
                const lowLowSum = doeRuns
                    .filter(run => run.factors[f1] === -1 && run.factors[f2] === -1)
                    .reduce((sum, run) => sum + run.response, 0);

                const hhCount = doeRuns.filter(run => run.factors[f1] === 1 && run.factors[f2] === 1).length;
                const hlCount = doeRuns.filter(run => run.factors[f1] === 1 && run.factors[f2] === -1).length;
                const lhCount = doeRuns.filter(run => run.factors[f1] === -1 && run.factors[f2] === 1).length;
                const llCount = doeRuns.filter(run => run.factors[f1] === -1 && run.factors[f2] === -1).length;

                const effect = ((highHighSum/hhCount + lowLowSum/llCount) - (highLowSum/hlCount + lowHighSum/lhCount)) / 2;
                interactionEffects[interaction] = effect;
            }
        }
    }

    // Calculate three-way interaction for 3 factors
    if (numFactors === 3) {
        const f1 = factors[0].label;
        const f2 = factors[1].label;
        const f3 = factors[2].label;
        const interaction = `${f1}${f2}${f3}`;

        let sumPlus = 0, sumMinus = 0;
        let countPlus = 0, countMinus = 0;

        doeRuns.forEach(run => {
            const product = run.factors[f1] * run.factors[f2] * run.factors[f3];
            if (product === 1) {
                sumPlus += run.response;
                countPlus++;
            } else {
                sumMinus += run.response;
                countMinus++;
            }
        });

        interactionEffects[interaction] = (sumPlus/countPlus - sumMinus/countMinus);
    }

    // Calculate sum of squares for ANOVA with proper replication handling
    const SSTotal = responses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);

    // Calculate treatment means for each unique combination
    const numTreatments = Math.pow(2, numFactors);
    const numReplicates = n / numTreatments;

    // Group runs by treatment combination
    const treatmentGroups = {};
    doeRuns.forEach(run => {
        const key = factors.map(f => run.factors[f.label]).join(',');
        if (!treatmentGroups[key]) {
            treatmentGroups[key] = [];
        }
        treatmentGroups[key].push(run.response);
    });

    // Calculate SS for model (treatments)
    let SSModel = 0;
    Object.values(treatmentGroups).forEach(group => {
        const groupMean = group.reduce((sum, val) => sum + val, 0) / group.length;
        SSModel += group.length * Math.pow(groupMean - mean, 2);
    });

    // Pure error from replicates
    let SSPureError = 0;
    Object.values(treatmentGroups).forEach(group => {
        const groupMean = group.reduce((sum, val) => sum + val, 0) / group.length;
        group.forEach(val => {
            SSPureError += Math.pow(val - groupMean, 2);
        });
    });

    const SSError = SSPureError;

    // Degrees of freedom
    const dfTotal = n - 1;
    const dfModel = numTreatments - 1;
    const dfError = n - numTreatments;

    // Mean squares
    const MSModel = SSModel / dfModel;
    const MSError = dfError > 0 ? SSError / dfError : 0;

    // F-statistic
    const Fstat = MSError > 0 ? MSModel / MSError : 0;

    // Store results
    analysisResults = {
        mean,
        mainEffects,
        interactionEffects,
        anova: {
            SSTotal,
            SSEffects: SSModel,
            SSError,
            dfTotal,
            dfEffects: dfModel,
            dfError,
            MSEffects: MSModel,
            MSError,
            Fstat
        }
    };
}

function generateReport() {
    try {
        console.log('Generating key findings...');
        generateKeyFindings();

        console.log('Generating main effects chart...');
        generateMainEffectsChart();

        console.log('Generating main effects table...');
        generateMainEffectsTable();

        if (numFactors >= 2) {
            console.log('Generating interaction chart...');
            generateInteractionChart();

            console.log('Generating interaction table...');
            generateInteractionTable();
            document.getElementById('interactionSection').style.display = 'block';
        } else {
            document.getElementById('interactionSection').style.display = 'none';
        }

        console.log('Generating Pareto chart...');
        generateParetoChart();

        console.log('Generating ANOVA table...');
        generateANOVATable();

        console.log('Generating recommendations...');
        generateRecommendations();

        console.log('Report generation complete!');
    } catch (error) {
        console.error('Error in generateReport:', error);
        throw error;
    }
}

function generateKeyFindings() {
    const container = document.getElementById('keyFindings');
    const allEffects = { ...analysisResults.mainEffects, ...analysisResults.interactionEffects };

    // Sort effects by absolute value
    const sortedEffects = Object.entries(allEffects).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

    const totalEffect = Object.values(allEffects).reduce((sum, effect) => sum + Math.abs(effect), 0);

    let html = '<ul>';
    html += `<li><strong>Average Response:</strong> ${analysisResults.mean.toFixed(3)}</li>`;

    if (sortedEffects.length > 0) {
        const largestEffect = sortedEffects[0];
        const effectName = getEffectName(largestEffect[0]);
        html += `<li><strong>Most Significant Factor:</strong> ${effectName} with effect of ${largestEffect[1].toFixed(3)}</li>`;

        // List all significant effects
        const significantEffects = totalEffect > 0
            ? sortedEffects.filter(([_, effect]) => Math.abs(effect) / totalEffect > 0.15)
            : [];
        if (significantEffects.length > 0) {
            html += '<li><strong>Significant Effects:</strong> ';
            html += significantEffects.map(([name, effect]) =>
                `${getEffectName(name)} (${effect > 0 ? '+' : ''}${effect.toFixed(3)})`
            ).join(', ');
            html += '</li>';
        }
    }

    html += '</ul>';
    container.innerHTML = html;
}

function getEffectName(code) {
    if (code.length === 1) {
        const factor = factors.find(f => f.label === code);
        return factor ? factor.name : code;
    } else {
        // Interaction
        return code.split('').map(c => {
            const factor = factors.find(f => f.label === c);
            return factor ? factor.name : c;
        }).join(' × ');
    }
}

function generateMainEffectsChart() {
    const ctx = document.getElementById('mainEffectsChart').getContext('2d');

    // Destroy previous chart if exists
    if (window.mainEffectsChart && typeof window.mainEffectsChart.destroy === 'function') {
        window.mainEffectsChart.destroy();
    }

    const labels = factors.map(f => f.name);
    const data = factors.map(f => analysisResults.mainEffects[f.label]);

    window.mainEffectsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Main Effect',
                data: data,
                backgroundColor: data.map(val => val > 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'),
                borderColor: data.map(val => val > 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Main Effects',
                    font: { size: 16 }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Effect on Response'
                    }
                }
            }
        }
    });
}

function generateMainEffectsTable() {
    const container = document.getElementById('mainEffectsTable');

    let html = '<table class="stats-table"><thead><tr>';
    html += '<th>Factor</th><th>Effect</th><th>Contribution (%)</th>';
    html += '</tr></thead><tbody>';

    const totalEffect = Object.values(analysisResults.mainEffects).reduce((sum, effect) => sum + Math.abs(effect), 0);

    factors.forEach(factor => {
        const effect = analysisResults.mainEffects[factor.label];
        const contribution = totalEffect > 0 ? (Math.abs(effect) / totalEffect * 100) : 0;

        html += '<tr>';
        html += `<td><strong>${factor.name}</strong></td>`;
        html += `<td>${effect > 0 ? '+' : ''}${effect.toFixed(4)}</td>`;
        html += `<td>${contribution.toFixed(1)}%</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function generateInteractionChart() {
    const ctx = document.getElementById('interactionChart').getContext('2d');

    // Destroy previous chart if exists
    if (window.interactionChart && typeof window.interactionChart.destroy === 'function') {
        window.interactionChart.destroy();
    }

    const labels = Object.keys(analysisResults.interactionEffects).map(code => getEffectName(code));
    const data = Object.values(analysisResults.interactionEffects);

    window.interactionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Interaction Effect',
                data: data,
                backgroundColor: data.map(val => val > 0 ? 'rgba(102, 126, 234, 0.7)' : 'rgba(118, 75, 162, 0.7)'),
                borderColor: data.map(val => val > 0 ? 'rgba(102, 126, 234, 1)' : 'rgba(118, 75, 162, 1)'),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Interaction Effects',
                    font: { size: 16 }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Effect on Response'
                    }
                }
            }
        }
    });
}

function generateInteractionTable() {
    const container = document.getElementById('interactionTable');

    let html = '<table class="stats-table"><thead><tr>';
    html += '<th>Interaction</th><th>Effect</th>';
    html += '</tr></thead><tbody>';

    Object.entries(analysisResults.interactionEffects).forEach(([code, effect]) => {
        html += '<tr>';
        html += `<td><strong>${getEffectName(code)}</strong></td>`;
        html += `<td>${effect > 0 ? '+' : ''}${effect.toFixed(4)}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function generateParetoChart() {
    const ctx = document.getElementById('paretoChart').getContext('2d');

    // Destroy previous chart if exists
    if (window.paretoChart && typeof window.paretoChart.destroy === 'function') {
        window.paretoChart.destroy();
    }

    // Combine all effects
    const allEffects = { ...analysisResults.mainEffects, ...analysisResults.interactionEffects };

    // Sort by absolute value
    const sortedEffects = Object.entries(allEffects)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

    const labels = sortedEffects.map(([code, _]) => getEffectName(code));
    const data = sortedEffects.map(([_, effect]) => Math.abs(effect));

    // Calculate cumulative percentage
    const total = data.reduce((sum, val) => sum + val, 0);
    const cumulative = [];
    let sum = 0;
    data.forEach(val => {
        sum += val;
        cumulative.push(total > 0 ? (sum / total) * 100 : 0);
    });

    window.paretoChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Absolute Effect',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                yAxisID: 'y'
            }, {
                label: 'Cumulative %',
                data: cumulative,
                type: 'line',
                borderColor: 'rgba(244, 67, 54, 1)',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderWidth: 3,
                fill: false,
                yAxisID: 'y1',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Pareto Chart of Effects',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Absolute Effect'
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Cumulative %'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function generateANOVATable() {
    const container = document.getElementById('anovaTable');
    const anova = analysisResults.anova;

    let html = '<table class="stats-table">';
    html += '<thead><tr>';
    html += '<th>Source</th><th>Sum of Squares</th><th>Degrees of Freedom</th>';
    html += '<th>Mean Square</th><th>F-Value</th>';
    html += '</tr></thead><tbody>';

    // Model row
    html += '<tr>';
    html += '<td><strong>Model (Effects)</strong></td>';
    html += `<td>${anova.SSEffects.toFixed(4)}</td>`;
    html += `<td>${anova.dfEffects}</td>`;
    html += `<td>${anova.MSEffects.toFixed(4)}</td>`;
    html += `<td>${anova.Fstat.toFixed(4)}</td>`;
    html += '</tr>';

    // Error row
    html += '<tr>';
    html += '<td><strong>Error</strong></td>';
    html += `<td>${anova.SSError.toFixed(4)}</td>`;
    html += `<td>${anova.dfError}</td>`;
    html += `<td>${anova.MSError > 0 ? anova.MSError.toFixed(4) : 'N/A'}</td>`;
    html += '<td>-</td>';
    html += '</tr>';

    // Total row
    html += '<tr>';
    html += '<td><strong>Total</strong></td>';
    html += `<td>${anova.SSTotal.toFixed(4)}</td>`;
    html += `<td>${anova.dfTotal}</td>`;
    html += '<td>-</td>';
    html += '<td>-</td>';
    html += '</tr>';

    html += '</tbody></table>';

    // R-squared
    const rSquared = anova.SSTotal > 0 ? (anova.SSEffects / anova.SSTotal) : 0;
    html += `<p style="margin-top: 15px;"><strong>R² = ${(rSquared * 100).toFixed(2)}%</strong> (Model explains ${(rSquared * 100).toFixed(2)}% of the variability)</p>`;

    container.innerHTML = html;
}

function generateRecommendations() {
    const container = document.getElementById('recommendations');
    const allEffects = { ...analysisResults.mainEffects, ...analysisResults.interactionEffects };
    const sortedEffects = Object.entries(allEffects).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

    let html = '<ul>';

    // Determine optimization direction based on largest effect
    if (sortedEffects.length > 0) {
        const topEffect = sortedEffects[0];
        const effectName = getEffectName(topEffect[0]);
        const effectValue = topEffect[1];

        if (effectValue > 0) {
            html += `<li><strong>To increase the response:</strong> Set ${effectName} to its HIGH level</li>`;
            html += `<li><strong>To decrease the response:</strong> Set ${effectName} to its LOW level</li>`;
        } else {
            html += `<li><strong>To increase the response:</strong> Set ${effectName} to its LOW level</li>`;
            html += `<li><strong>To decrease the response:</strong> Set ${effectName} to its HIGH level</li>`;
        }
    }

    // List significant factors
    const significantFactors = sortedEffects.filter(([code, _]) => code.length === 1).slice(0, 2);
    if (significantFactors.length > 0) {
        html += '<li><strong>Key factors to control:</strong> ';
        html += significantFactors.map(([code, _]) => getEffectName(code)).join(' and ');
        html += '</li>';
    }

    // Check for interactions
    const significantInteractions = sortedEffects.filter(([code, effect]) =>
        code.length > 1 && Math.abs(effect) > 0.5
    );

    if (significantInteractions.length > 0) {
        html += '<li><strong>Important interactions detected:</strong> ';
        html += significantInteractions.map(([code, _]) => getEffectName(code)).join(', ');
        html += '. Consider these factors together, not independently.</li>';
    }

    // R-squared interpretation
    const rSquared = analysisResults.anova.SSTotal > 0 ?
        (analysisResults.anova.SSEffects / analysisResults.anova.SSTotal) : 0;

    if (rSquared > 0.9) {
        html += '<li><strong>Model Quality:</strong> Excellent fit (R² > 90%). The model explains the data very well.</li>';
    } else if (rSquared > 0.7) {
        html += '<li><strong>Model Quality:</strong> Good fit (R² > 70%). The model captures most of the variation.</li>';
    } else if (rSquared > 0.5) {
        html += '<li><strong>Model Quality:</strong> Moderate fit (R² > 50%). Consider additional factors or replicates.</li>';
    } else {
        html += '<li><strong>Model Quality:</strong> Poor fit (R² < 50%). Consider other factors or check for experimental errors.</li>';
    }

    html += '</ul>';
    container.innerHTML = html;
}

function startOver() {
    if (confirm('Are you sure you want to start a new analysis? All current data will be lost.')) {
        // Reset all data
        factors = [];
        doeRuns = [];
        analysisResults = {};

        // Reset to step 1
        document.querySelector('input[name="numFactors"][value="2"]').checked = true;
        showStep(1);
    }
}

function exportReport() {
    // Create a comprehensive text report
    let report = '='.repeat(60) + '\n';
    report += 'DOE ANALYSIS REPORT\n';
    report += '='.repeat(60) + '\n\n';

    report += `Date: ${new Date().toLocaleDateString()}\n`;
    report += `Number of Factors: ${numFactors}\n`;
    report += `Number of Runs: ${doeRuns.length}\n\n`;

    report += 'FACTORS:\n';
    report += '-'.repeat(60) + '\n';
    factors.forEach(factor => {
        report += `${factor.name} (${factor.label}): Low = ${factor.lowLevel}, High = ${factor.highLevel}\n`;
    });
    report += '\n';

    report += 'EXPERIMENTAL DATA:\n';
    report += '-'.repeat(60) + '\n';
    report += 'Run\t' + factors.map(f => f.label).join('\t') + '\tResponse\n';
    doeRuns.forEach(run => {
        report += `${run.runNumber}\t`;
        report += factors.map(f => run.factors[f.label]).join('\t') + '\t';
        report += `${run.response}\n`;
    });
    report += '\n';

    report += 'MAIN EFFECTS:\n';
    report += '-'.repeat(60) + '\n';
    factors.forEach(factor => {
        report += `${factor.name}: ${analysisResults.mainEffects[factor.label].toFixed(4)}\n`;
    });
    report += '\n';

    if (Object.keys(analysisResults.interactionEffects).length > 0) {
        report += 'INTERACTION EFFECTS:\n';
        report += '-'.repeat(60) + '\n';
        Object.entries(analysisResults.interactionEffects).forEach(([code, effect]) => {
            report += `${getEffectName(code)}: ${effect.toFixed(4)}\n`;
        });
        report += '\n';
    }

    report += 'ANOVA:\n';
    report += '-'.repeat(60) + '\n';
    const anova = analysisResults.anova;
    report += `SS Effects: ${anova.SSEffects.toFixed(4)}\n`;
    report += `SS Error: ${anova.SSError.toFixed(4)}\n`;
    report += `SS Total: ${anova.SSTotal.toFixed(4)}\n`;
    const rSquared = anova.SSTotal > 0 ? (anova.SSEffects / anova.SSTotal) : 0;
    report += `R²: ${(rSquared * 100).toFixed(2)}%\n`;

    // Download the report
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DOE_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Report exported successfully!');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    showStep(1);
});
