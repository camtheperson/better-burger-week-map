const fs = require('fs');
const path = require('path');
const NodeGeocoder = require('node-geocoder');

// Initialize geocoder with proper configuration
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null,
  extra: {
    'User-Agent': 'BurgerWeekMap/1.0 (contact@example.com)',
    'Referer': 'https://burger-week-map.netlify.app'
  }
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testGeocode() {
  // Test with a few addresses from our data
  const testAddresses = [
    "4237 N Mississippi Ave, Portland, OR",
    "4477 Lakeview Blvd, Portland, OR", 
    "422 SW Broadway, Portland, OR"
  ];
  
  console.log('Testing geocoding with 1 second delays...');
  
  for (const address of testAddresses) {
    try {
      console.log(`Geocoding: ${address}`);
      await delay(1000); // 1 second delay
      
      const results = await geocoder.geocode(address);
      
      if (results && results.length > 0) {
        console.log(`✓ Success: ${results[0].latitude}, ${results[0].longitude}`);
      } else {
        console.log(`✗ No results for ${address}`);
      }
    } catch (error) {
      console.error(`✗ Error for ${address}:`, error.message);
    }
  }
}

if (require.main === module) {
  testGeocode().catch(console.error);
}
