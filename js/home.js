// get elements
const searchForm = document.getElementById('searchForm');
const stateSelect = document.getElementById('stateSelect');
const countySelect = document.getElementById('countySelect');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const stationsContainer = document.getElementById('stationsContainer');

// search for stations when form is submitted
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const state = stateSelect.value;
    const county = countySelect.value;
    
    // check if @ least one is selected
    if (!state && !county) {
        alert('Please select either a state or a county');
        return;
    }
    
    // clear the other option when one is selected
    if (state && county) {
        alert('Please select either a state OR a county, not both');
        return;
    }
    
    if (state) {
        await searchStations('state', state);
    } else if (county) {
        await searchStations('county', county);
    }
});

// clear state when county is selected
countySelect.addEventListener('change', () => {
    if (countySelect.value) {
        stateSelect.value = '';
    }
});

// clear county when state is selected
stateSelect.addEventListener('change', () => {
    if (stateSelect.value) {
        countySelect.value = '';
    }
});

// fetch stations from USGS API
async function searchStations(searchType, searchValue) {
    loading.classList.remove('hidden');
    results.classList.add('hidden');
    stationsContainer.innerHTML = '';
    
    try {
        let url;
        
        if (searchType === 'state') {
            url = `https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=${searchValue}&siteStatus=active&parameterCd=00060,00010`;
        } else if (searchType === 'county') {
            url = `https://waterservices.usgs.gov/nwis/iv/?format=json&countyCd=${searchValue}&siteStatus=active&parameterCd=00060,00010`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        loading.classList.add('hidden');
        
        if (data.value && data.value.timeSeries && data.value.timeSeries.length > 0) {
            displayStations(data.value.timeSeries);
            results.classList.remove('hidden');
        } else {
            stationsContainer.innerHTML = '<p class="no-favorites">No stations found for this location.</p>';
            results.classList.remove('hidden');
        }
        
    } catch (error) {
        loading.classList.add('hidden');
        console.error('Error fetching stations:', error);
        stationsContainer.innerHTML = '<p class="no-favorites">Error loading stations. Please try again.</p>';
        results.classList.remove('hidden');
    }
}

// display stations in cards
function displayStations(timeSeries) {
    stationsContainer.innerHTML = '';
    
    // get unique sites
    const sites = {};
    
    timeSeries.forEach(series => {
        const siteCode = series.sourceInfo.siteCode[0].value;
        
        if (!sites[siteCode]) {
            sites[siteCode] = {
                siteCode: siteCode,
                siteName: series.sourceInfo.siteName,
                latitude: series.sourceInfo.geoLocation.geogLocation.latitude,
                longitude: series.sourceInfo.geoLocation.geogLocation.longitude,
                parameters: []
            };
        }
        
        // add parameter value if available
        if (series.values && series.values[0] && series.values[0].value && series.values[0].value.length > 0) {
            const latestValue = series.values[0].value[series.values[0].value.length - 1];
            const variable = series.variable.variableCode[0].value;
            
            sites[siteCode].parameters.push({
                variable: variable,
                value: latestValue.value,
                unit: series.variable.unit.unitCode
            });
        }
    });
    
    // create cards for each site
    Object.values(sites).forEach(site => {
        const card = createStationCard(site);
        stationsContainer.appendChild(card);
    });
}

// create a station card
function createStationCard(site) {
    const card = document.createElement('div');
    card.className = 'station-card';
    
    // get temperature for status
    const tempParam = site.parameters.find(p => p.variable === '00010');
    const temp = tempParam ? parseFloat(tempParam.value) : null;
    
    // determine status based on temperature
    let status = 'safe';
    let statusText = 'Normal';
    
    if (temp !== null) {
        if (temp < 0 || temp > 30) {
            status = 'unsafe';
            statusText = 'Extreme';
        } else if (temp < 5 || temp > 25) {
            status = 'moderate';
            statusText = 'Moderate';
        }
    }
    
    // build parameters display
    let parametersHTML = '';
    site.parameters.forEach(param => {
        if (param.variable === '00010') {
            parametersHTML += `<p><strong>Temperature:</strong> ${param.value} ${param.unit}</p>`;
        } else if (param.variable === '00060') {
            parametersHTML += `<p><strong>Discharge:</strong> ${param.value} ${param.unit}</p>`;
        }
    });
    
    card.innerHTML = `
        <h4>${site.siteName}</h4>
        <p><strong>Site ID:</strong> ${site.siteCode}</p>
        ${parametersHTML}
        <span class="badge ${status}">${statusText}</span>
    `;
    
    // click to view details
    card.addEventListener('click', () => {
        window.location.href = `details.html?site=${site.siteCode}`;
    });
    
    return card;
}

// load favorites on page load
window.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
});