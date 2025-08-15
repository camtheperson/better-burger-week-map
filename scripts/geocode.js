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

class BurgerGeocoder {
  constructor() {
    this.dataPath = path.join(__dirname, '..', 'data', 'burgers.json');
    this.burgers = [];
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

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async geocodeAddress(restaurant) {
    // Skip if already geocoded
    if (restaurant.latitude && restaurant.longitude) {
      console.log(`✓ ${restaurant.restaurantName} already has coordinates, skipping`);
      return restaurant;
    }

    let addressToGeocode = null;
    
    if (restaurant.address && restaurant.address.trim()) {
      // Use the cleaned address from the scraper
      addressToGeocode = `${restaurant.address.trim()}, Portland, OR`;
    } else if (restaurant.neighborhood && restaurant.restaurantName) {
      // Fallback to restaurant name + neighborhood
      addressToGeocode = `${restaurant.restaurantName}, ${restaurant.neighborhood}, Portland, OR`;
    } else if (restaurant.restaurantName) {
      // Last resort: just restaurant name
      addressToGeocode = `${restaurant.restaurantName}, Portland, OR`;
    }
    
    if (!addressToGeocode) {
      console.log(`⚠ No address data for ${restaurant.restaurantName}, skipping`);
      return restaurant;
    }

    try {
      console.log(`Geocoding "${addressToGeocode}"...`);
      
      // Respect OSM rate limit: 1 request per second
      await this.delay(1000);
      
      const results = await geocoder.geocode(addressToGeocode);
      
      if (results && results.length > 0) {
        console.log(`✓ Success: ${results[0].latitude}, ${results[0].longitude}`);
        return {
          ...restaurant,
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          geocoded_address: results[0].formattedAddress
        };
      } else {
        console.log(`⚠ No geocoding results for: ${addressToGeocode}`);
      }
    } catch (error) {
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('Access blocked') || errorMsg.includes('<html>')) {
        console.error(`🚫 OSM access blocked for ${restaurant.restaurantName}. Rate limit exceeded.`);
        throw new Error('OSM_BLOCKED');
      } else {
        console.error(`❌ Geocoding failed for ${restaurant.restaurantName}:`, errorMsg);
      }
    }

    return restaurant;
  }

  async geocodeAll() {
    console.log('Starting geocoding process...');
    
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

    // Process restaurants one at a time to respect rate limits
    const geocodedRestaurants = [];
    
    try {
      for (let i = 0; i < needsGeocoding.length; i++) {
        const restaurant = needsGeocoding[i];
        console.log(`\nProcessing ${i + 1}/${needsGeocoding.length}: ${restaurant.restaurantName}`);
        
        const geocodedRestaurant = await this.geocodeAddress(restaurant);
        geocodedRestaurants.push(geocodedRestaurant);
        
        // Save progress every 10 restaurants
        if ((i + 1) % 10 === 0) {
          await this.saveProgress([...alreadyGeocoded, ...geocodedRestaurants]);
          console.log(`💾 Saved progress: ${i + 1}/${needsGeocoding.length} processed`);
        }
      }
    } catch (error) {
      if (error.message === 'OSM_BLOCKED') {
        console.log('⏰ OSM access blocked. Saving current progress...');
        // Combine already geocoded restaurants with those we've processed so far
        const allRestaurants = [...alreadyGeocoded, ...geocodedRestaurants];
        if (allRestaurants.length > 0) {
          await this.saveProgress(allRestaurants);
        }
        console.log('💡 Try running the geocoder again later when the block lifts.');
        return;
      } else {
        throw error;
      }
    }

    // Combine all results and save
    this.burgers = [...alreadyGeocoded, ...geocodedRestaurants];
    await this.saveData();
    
    const totalGeocoded = this.burgers.filter(r => r.latitude && r.longitude).length;
    console.log(`\n🎉 Geocoding complete! ${totalGeocoded}/${this.burgers.length} restaurants have coordinates.`);
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
      neighborhoods: [...new Set(this.burgers.map(b => b.neighborhood))].sort()
    };
    
    const summaryPath = path.join(dataDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('Summary updated');
  }
}

// Run the geocoder if this file is executed directly
if (require.main === module) {
  const geocoder = new BurgerGeocoder();
  geocoder.geocodeAll().catch(console.error);
}

module.exports = BurgerGeocoder;
