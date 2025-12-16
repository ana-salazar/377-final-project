# ClearSource: Find Clean Water Near You

**Live Demo:** https://377-final-project-rho.vercel.app

## Description
ClearSource helps users easily access water quality information from USGS monitoring stations across the United States. Search for stations by state, view real-time water data, and save your favorite locations.

## Target Browsers
- Google Chrome (90+)
- Mozilla Firefox (88+)
- Safari (14+)
- Microsoft Edge (90+)


# Developer Manual

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/clearsource.git
   cd clearsource
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

4. **Set up database**
   
   Run in Supabase SQL editor:
   ```sql
   CREATE TABLE favorites (
     id SERIAL PRIMARY KEY,
     user_id TEXT,
     site_id TEXT,
     site_name TEXT,
     latitude DECIMAL,
     longitude DECIMAL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

## Running the Application

**Start the server:**
```bash
npm start
```

Visit `http://localhost:3000`

## Tests
No automated tests currently. Manually test:
- Search for stations
- View station details
- Save/view favorites

## API Endpoints

### GET /api/favorites/:userId
Get all favorite stations for a user.

**Example:**
```javascript
fetch('/api/favorites/user123')
  .then(res => res.json())
  .then(data => console.log(data));
```

### POST /api/favorites
Save a new favorite station.

**Body:**
```json
{
  "user_id": "user123",
  "site_id": "01646500",
  "site_name": "POTOMAC RIVER",
  "latitude": 38.93,
  "longitude": -77.13
}
```

## Known Bugs
- Not all stations have pH/turbidity data
- No user authentication yet

## Future Development
- Add user login
- Improve mobile design
- Include all counties dynamically
- Email alerts for water quality changes

## Project Info
**Course:** INST377 Fall 2025 
**Developer:** Ana Salazar  
**Data Source:** U.S. Geological Survey (USGS)