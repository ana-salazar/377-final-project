// simple user ID (in real app, this would come from authentication)
const userId = 'user123';

// save favorite to database via API
async function saveFavorite(userId, siteData) {
    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                site_id: siteData.site_id,
                site_name: siteData.site_name,
                latitude: siteData.latitude,
                longitude: siteData.longitude
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Station saved to favorites!');
            loadFavorites(); // reload favorites display
        } else {
            alert('Error saving favorite: ' + data.message);
        }
        
    } catch (error) {
        console.error('Error saving favorite:', error);
        alert('Error saving favorite. Please try again.');
    }
}

// load favorites from database via API
async function loadFavorites() {
    const favoritesContainer = document.getElementById('favoritesContainer');
    
    if (!favoritesContainer) return; // only run on home page
    
    try {
        const response = await fetch(`/api/favorites?userId=${userId}`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            favoritesContainer.innerHTML = '';
            
            data.data.forEach(favorite => {
                const card = createFavoriteCard(favorite);
                favoritesContainer.appendChild(card);
            });
        } else {
            favoritesContainer.innerHTML = '<p class="no-favorites">No favorites saved yet. Search for stations and click the star to save!</p>';
        }
        
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesContainer.innerHTML = '<p class="no-favorites">Error loading favorites.</p>';
    }
}

// create a favorite card
function createFavoriteCard(favorite) {
    const card = document.createElement('div');
    card.className = 'station-card';
    
    card.innerHTML = `
        <h4>${favorite.site_name}</h4>
        <p><strong>Site ID:</strong> ${favorite.site_id}</p>
        <p><strong>Latitude:</strong> ${favorite.latitude}</p>
        <p><strong>Longitude:</strong> ${favorite.longitude}</p>
        <button class="remove-btn" onclick="removeFavorite(${favorite.id}, event)">Remove</button>
    `;
    
    // click to view details (except when clicking remove button)
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-btn')) {
            window.location.href = `details.html?site=${favorite.site_id}`;
        }
    });
    
    return card;
}

// remove favorite from database
async function removeFavorite(favoriteId, event) {
    event.stopPropagation();
    
    if (!confirm('Remove this station from favorites?')) return;
    
    try {
        const response = await fetch(`/api/favorites?id=${favoriteId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadFavorites(); // reload favorites display
        } else {
            alert('Error removing favorite: ' + data.message);
        }
        
    } catch (error) {
        console.error('Error removing favorite:', error);
        alert('Error removing favorite. Please try again.');
    }
}