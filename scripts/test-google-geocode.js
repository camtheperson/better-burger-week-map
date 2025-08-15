const GoogleGeocoder = require('./google-geocode');

// Test with a single known Portland address
async function testGoogleGeocoding() {
  console.log('Testing Google Geocoding API...');
  
  // Check if API key is set
  if (!process.env.GOOGLE_GEOCODING_API_KEY) {
    console.error('❌ GOOGLE_GEOCODING_API_KEY environment variable not set');
    return;
  }
  
  const geocoder = new GoogleGeocoder();
  
  // Test with a well-known Portland location
  const testRestaurant = {
    restaurantName: "Test Restaurant",
    address: "1000 SW Broadway",
    neighborhood: "Downtown Portland"
  };
  
  try {
    const result = await geocoder.geocodeRestaurant(testRestaurant);
    
    if (result.latitude && result.longitude) {
      console.log('✅ Google Geocoding API is working!');
      console.log(`Test address geocoded to: ${result.latitude}, ${result.longitude}`);
      console.log(`Formatted address: ${result.geocoded_address}`);
    } else {
      console.log('❌ Geocoding test failed - no coordinates returned');
    }
  } catch (error) {
    console.error('❌ Geocoding test failed:', error.message);
  }
}

testGoogleGeocoding();
