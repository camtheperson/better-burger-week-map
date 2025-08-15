const fs = require('fs');
const path = require('path');
const https = require('https');

class GoogleGeocoder {
  constructor() {
    this.dataPath = path.join(__dirname, '..', 'data', 'burgers.json');
    this.burgers = [];
    this.apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
    
    if (!this.apiKey) {
      console.error('❌ Error: GOOGLE_GEOCODING_API_KEY environment variable not set');
      console.log('Please set your Google Geocoding API key:');
      console.log('export GOOGLE_GEOCODING_API_KEY="your_api_key_here"');
      console.log('\nTo get an API key:');
      console.log('1. Go to https://console.cloud.google.com/');
      console.log('2. Create/select a project');
      console.log('3. Enable the Geocoding API');
      console.log('4. Create credentials (API key)');
      console.log('5. Optionally restrict the key to Geocoding API only');
      process.exit(1);
    }
  }

  async loadData() {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.burgers = JSON.parse(data);
      console.log(`Loaded ${this.burgers.length} restaurants`);
    } catch (error) {
      console.error('Error loading burger data:', error);
      throw error;
    }
  }

  // Sleep function to respect rate limits
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Make a request to Google Geocoding API
  async geocodeAddress(address) {
    return new Promise((resolve, reject) => {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`;
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  async geocodeRestaurant(restaurant) {
    if (!restaurant.address) {
      console.log(`⚠ No address for ${restaurant.restaurantName}`);
      return restaurant;
    }

    // Create full address for better geocoding
    const addressToGeocode = `${restaurant.address}, Portland, OR, USA`;

    try {
      console.log(`Geocoding "${addressToGeocode}"...`);
      
      const result = await this.geocodeAddress(addressToGeocode);
      
      if (result.status === 'OK' && result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const formattedAddress = result.results[0].formatted_address;
        
        console.log(`✓ Success: ${location.lat}, ${location.lng}`);
        return {
          ...restaurant,
          latitude: location.lat,
          longitude: location.lng,
          geocoded_address: formattedAddress,
          geocoding_method: 'google_api'
        };
      } else {
        console.log(`⚠ No results for: ${addressToGeocode} (Status: ${result.status})`);
        if (result.error_message) {
          console.log(`Error: ${result.error_message}`);
        }
        
        // Handle specific API errors
        if (result.status === 'REQUEST_DENIED') {
          if (result.error_message && result.error_message.includes('referer')) {
            console.log('💡 Solution: Remove referer restrictions from your API key, or add your current IP to IP restrictions instead.');
            console.log('   Go to Google Cloud Console > Credentials > Edit your API key > Application restrictions');
          }
          throw new Error(`Google API Error: ${result.status} - ${result.error_message || 'Request denied'}`);
        }
      }
    } catch (error) {
      console.error(`❌ Geocoding failed for ${restaurant.restaurantName}:`, error.message);
    }

    return restaurant;
  }

  async geocodeAll() {
    console.log('Starting Google geocoding process...');
    
    await this.loadData();
    
    // Filter restaurants that need geocoding
    const needsGeocoding = this.burgers.filter(r => !r.latitude || !r.longitude);
    const alreadyGeocoded = this.burgers.filter(r => r.latitude && r.longitude);
    
    console.log(`Found ${needsGeocoding.length} restaurants that need geocoding`);
    console.log(`Found ${alreadyGeocoded.length} restaurants already geocoded`);
    
    if (needsGeocoding.length === 0) {
      console.log('All restaurants already have coordinates!');
      return;
    }

    // Process restaurants with rate limiting
    const geocodedRestaurants = [];
    
    for (let i = 0; i < needsGeocoding.length; i++) {
      const restaurant = needsGeocoding[i];
      console.log(`\nProcessing ${i + 1}/${needsGeocoding.length}: ${restaurant.restaurantName}`);
      
      const geocodedRestaurant = await this.geocodeRestaurant(restaurant);
      geocodedRestaurants.push(geocodedRestaurant);
      
      // Google allows 50 requests per second, but let's be conservative
      // and do 10 requests per second to avoid any issues
      await this.delay(100);
      
      // Save progress every 20 restaurants
      if ((i + 1) % 20 === 0) {
        await this.saveProgress([...alreadyGeocoded, ...geocodedRestaurants]);
        console.log(`💾 Saved progress: ${i + 1}/${needsGeocoding.length} processed`);
      }
    }

    // Combine all results and save
    this.burgers = [...alreadyGeocoded, ...geocodedRestaurants];
    await this.saveData();
    
    const totalGeocoded = this.burgers.filter(r => r.latitude && r.longitude).length;
    console.log(`\n🎉 Google geocoding complete! ${totalGeocoded}/${this.burgers.length} restaurants have coordinates.`);
  }

  async saveProgress(restaurants) {
    // Sort by restaurant name to maintain consistent order
    restaurants.sort((a, b) => a.restaurantName.localeCompare(b.restaurantName));
    
    fs.writeFileSync(this.dataPath, JSON.stringify(restaurants, null, 2));
  }

  async saveData() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save the data
    await this.saveProgress(this.burgers);
    console.log(`Data saved to ${this.dataPath}`);

    // Update summary
    const summary = {
      totalRestaurants: this.burgers.length,
      withAddresses: this.burgers.filter(b => b.address && b.address.trim()).length,
      geocodedRestaurants: this.burgers.filter(b => b.latitude && b.longitude).length,
      lastUpdated: new Date().toISOString(),
      neighborhoods: [...new Set(this.burgers.map(b => b.neighborhood))].sort(),
      geocodingMethod: 'google_api'
    };
    
    const summaryPath = path.join(dataDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('Summary updated');
  }
}

// Run the geocoder if this file is executed directly
if (require.main === module) {
  const geocoder = new GoogleGeocoder();
  geocoder.geocodeAll().catch(console.error);
}

module.exports = GoogleGeocoder;
