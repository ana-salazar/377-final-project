// get site ID from URL
const urlParams = new URLSearchParams(window.location.search);
const siteId = urlParams.get('site');

// elements
const loading = document.getElementById('loading');
const siteDetails = document.getElementById('siteDetails');
const siteName = document.getElementById('siteName');
const siteIdEl = document.getElementById('siteId');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const county = document.getElementById('county');
const temperature = document.getElementById('temperature');
const discharge = document.getElementById('discharge');
const status = document.getElementById('status');
const favoriteBtn = document.getElementById('favoriteBtn');
const mapsLink = document.getElementById('mapsLink');

let map;
let chart;
let currentSiteData = {};

// load site details on page load
if (siteId) {
    loadSiteDetails();
} else {
    loading.innerHTML = '<p>No site selected. Please go back to the home page.</p>';
}

// fetch site details
async function loadSiteDetails() {
    try {
        const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteId}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.value && data.value.timeSeries && data.value.timeSeries.length > 0) {
            const siteInfo = data.value.timeSeries[0].sourceInfo;
            
            // store site data for favorites
            currentSiteData = {
                site_id: siteId,
                site_name: siteInfo.siteName,
                latitude: siteInfo.geoLocation.geogLocation.latitude,
                longitude: siteInfo.geoLocation.geogLocation.longitude
            };
            
            // display site info
            siteName.textContent = siteInfo.siteName;
            siteIdEl.textContent = siteId;
            latitude.textContent = siteInfo.geoLocation.geogLocation.latitude.toFixed(6);
            longitude.textContent = siteInfo.geoLocation.geogLocation.longitude.toFixed(6);
            
            // set Google Maps link
            const lat = siteInfo.geoLocation.geogLocation.latitude;
            const lon = siteInfo.geoLocation.geogLocation.longitude;
            mapsLink.href = `https://www.google.com/maps?q=${lat},${lon}`;
            
            // get county if available
            const countyProp = siteInfo.siteProperty?.find(p => p.name === 'countyCd');
            county.textContent = countyProp ? countyProp.value : 'N/A';
            
            // get current values
            displayCurrentValues(data.value.timeSeries);
            
            // initialize map
            initMap(currentSiteData.latitude, currentSiteData.longitude, currentSiteData.site_name);
            
            // load historical data for chart
            loadHistoricalData();
            
            loading.classList.add('hidden');
            siteDetails.classList.remove('hidden');
        } else {
            loading.innerHTML = '<p>No data found for this site.</p>';
        }
        
    } catch (error) {
        console.error('Error loading site details:', error);
        loading.innerHTML = '<p>Error loading site details. Please try again.</p>';
    }
}

// display current values
function displayCurrentValues(timeSeries) {
    let tempValue = 'N/A';
    let dischargeValue = 'N/A';
    let statusValue = 'Normal';
    let statusClass = 'safe';
    
    timeSeries.forEach(series => {
        const variable = series.variable.variableCode[0].value;
        
        if (series.values && series.values[0] && series.values[0].value && series.values[0].value.length > 0) {
            const latestValue = series.values[0].value[series.values[0].value.length - 1];
            const value = latestValue.value;
            const unit = series.variable.unit.unitCode;
            
            if (variable === '00010') {
                // convert celsius to fahrenheit
                const celsius = parseFloat(value);
                const fahrenheit = (celsius * 9/5) + 32;
                tempValue = `${fahrenheit.toFixed(1)} °F`;
                
                // determine status based on temperature (using fahrenheit)
                if (fahrenheit < 32 || fahrenheit > 86) {
                    statusValue = 'Extreme';
                    statusClass = 'unsafe';
                } else if (fahrenheit < 41 || fahrenheit > 77) {
                    statusValue = 'Moderate';
                    statusClass = 'moderate';
                }
            } else if (variable === '00060') {
                dischargeValue = `${value} ${unit}`;
            }
        }
    });
    
    temperature.textContent = tempValue;
    discharge.textContent = dischargeValue;
    status.textContent = statusValue;
    status.className = `badge ${statusClass}`;
}

// fetch historical data for chart
async function loadHistoricalData() {
    try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const url = `https://waterservices.usgs.gov/nwis/dv/?format=json&sites=${siteId}&startDT=${startDate}&endDT=${endDate}&parameterCd=00010`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.value && data.value.timeSeries && data.value.timeSeries.length > 0) {
            const series = data.value.timeSeries[0];
            
            if (series.values && series.values[0] && series.values[0].value) {
                createChart(series.values[0].value);
            } else {
                document.querySelector('.chart-container').innerHTML = '<p>No historical data available for temperature.</p>';
            }
        } else {
            document.querySelector('.chart-container').innerHTML = '<p>No historical data available for this site.</p>';
        }
        
    } catch (error) {
        console.error('Error loading historical data:', error);
        document.querySelector('.chart-container').innerHTML = '<p>Error loading chart data.</p>';
    }
}

// create temperature chart using Chart.js
function createChart(values) {
    const dates = values.map(v => {
        const date = new Date(v.dateTime);
        return date.toLocaleDateString();
    });
    
    // convert celsius to fahrenheit
    const temps = values.map(v => {
        const celsius = parseFloat(v.value);
        return (celsius * 9/5) + 32;
    });
    
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Temperature (°F)',
                data: temps,
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Temperature (°F)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}

// initialize map using Leaflet.js
function initMap(lat, lon, name) {
    // small delay to ensure map container is fully rendered
    setTimeout(() => {
        map = L.map('map').setView([lat, lon], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>${name}</b><br>Site ID: ${siteId}`)
            .openPopup();
    }, 100);
}

// save to favorites
favoriteBtn.addEventListener('click', () => {
    const userId = 'user123'; // Simple user ID for now
    saveFavorite(userId, currentSiteData);
});