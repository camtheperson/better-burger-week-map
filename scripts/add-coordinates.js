const fs = require('fs');
const path = require('path');

// Sample coordinates for well-known Portland restaurants
const knownLocations = {
  "10 Barrel Brewing": { lat: 45.5259, lng: -122.6845 },
  "Bunk Bar": { lat: 45.5168, lng: -122.6574 },
  "Lardo": { lat: 45.5089, lng: -122.6493 },
  "Breakside Brewery - Dekum": { lat: 45.5566, lng: -122.6675 },
  "Breakside Brewery - Slabtown": { lat: 45.5340, lng: -122.7037 },
  "Grassa": { lat: 45.5168, lng: -122.6574 },
  "Killer Burger": { lat: 45.4995, lng: -122.6863 },
  "Next Level Burger": { lat: 45.5152, lng: -122.6496 },
  "Loyal Legion": { lat: 45.5168, lng: -122.6574 },
  "Brix Tavern": { lat: 45.5259, lng: -122.6796 },
  "Deschutes Brewery & Public House": { lat: 45.5340, lng: -122.7037 },
  "Hopworks Brewery": { lat: 45.4879, lng: -122.6370 },
  "Migration Brewing Co.": { lat: 45.5240, lng: -122.6587 },
  "Wayfinder Beer": { lat: 45.5168, lng: -122.6574 },
  "Wolf's Head Portland": { lat: 45.5063, lng: -122.6608 },
  "Pambiche": { lat: 45.5240, lng: -122.6587 },
  "Salvador Molly's": { lat: 45.4995, lng: -122.6863 },
  "Taylor Street Tavern": { lat: 45.5152, lng: -122.6784 },
  "The Hostel Cafe": { lat: 45.5340, lng: -122.7037 },
  "Pacific Standard": { lat: 45.5240, lng: -122.6587 }
};

// Load current burger data
const dataPath = path.join(__dirname, '..', 'data', 'burgers.json');
const burgersData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Add coordinates to known restaurants
let updatedCount = 0;
burgersData.forEach(restaurant => {
  const coords = knownLocations[restaurant.restaurantName];
  if (coords && !restaurant.latitude) {
    restaurant.latitude = coords.lat;
    restaurant.longitude = coords.lng;
    restaurant.geocoded_address = `${restaurant.restaurantName}, Portland, OR`;
    updatedCount++;
    console.log(`Added coordinates for ${restaurant.restaurantName}`);
  }
});

// Save updated data
fs.writeFileSync(dataPath, JSON.stringify(burgersData, null, 2));

// Update summary
const summary = {
  totalRestaurants: burgersData.length,
  geocodedRestaurants: burgersData.filter(b => b.latitude && b.longitude).length,
  lastUpdated: new Date().toISOString(),
  neighborhoods: [...new Set(burgersData.map(b => b.neighborhood))].sort()
};

const summaryPath = path.join(__dirname, '..', 'data', 'summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`\nUpdated ${updatedCount} restaurants with coordinates`);
console.log(`Total geocoded: ${summary.geocodedRestaurants}/${summary.totalRestaurants}`);
