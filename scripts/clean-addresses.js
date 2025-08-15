const fs = require('fs');
const path = require('path');

// Load current burger data
const dataPath = path.join(__dirname, '..', 'data', 'burgers.json');
const burgersData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('Cleaning up address formatting...');

let cleanedCount = 0;
burgersData.forEach(restaurant => {
  if (restaurant.address && restaurant.address.trim()) {
    const originalAddress = restaurant.address;
    
    // Clean up the address
    let cleanedAddress = originalAddress
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/\n/g, ' ')   // Replace newlines with spaces
      .trim();               // Trim whitespace
    
    // Remove parenthetical neighborhood info like "(Boise)" or "(Southeast Portland)"
    cleanedAddress = cleanedAddress.replace(/\s*\([^)]+\)\s*$/, '');
    
    // Remove any trailing periods or commas
    cleanedAddress = cleanedAddress.replace(/[.,]+$/, '');
    
    if (cleanedAddress !== originalAddress) {
      console.log(`Cleaned: "${originalAddress}" -> "${cleanedAddress}"`);
      restaurant.address = cleanedAddress;
      cleanedCount++;
    }
  }
});

// Save updated data
fs.writeFileSync(dataPath, JSON.stringify(burgersData, null, 2));

// Update summary
const summary = {
  totalRestaurants: burgersData.length,
  withAddresses: burgersData.filter(b => b.address && b.address.trim()).length,
  geocodedRestaurants: burgersData.filter(b => b.latitude && b.longitude).length,
  lastUpdated: new Date().toISOString(),
  neighborhoods: [...new Set(burgersData.map(b => b.neighborhood))].sort()
};

const summaryPath = path.join(__dirname, '..', 'data', 'summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`\nAddress cleanup complete!`);
console.log(`Cleaned ${cleanedCount} addresses`);
console.log(`Total addresses: ${summary.withAddresses}/${summary.totalRestaurants}`);
console.log(`Already geocoded: ${summary.geocodedRestaurants}/${summary.totalRestaurants}`);
