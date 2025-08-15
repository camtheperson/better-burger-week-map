const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class BurgerWeekScraper {
  constructor() {
    this.baseUrl = 'https://everout.com/portland/events/the-portland-mercurys-burger-week-2025/e205791/';
    this.burgers = [];
    this.concurrency = 5; // Number of parallel requests
  }

  async scrapeMainPage() {
    console.log('Fetching main Burger Week page...');
    
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const restaurants = [];

      // Find all restaurant/burger entries
      $('h4').each((index, element) => {
        const $element = $(element);
        const restaurantLink = $element.find('a');
        
        if (restaurantLink.length > 0) {
          const restaurantText = restaurantLink.text().trim();
          let eventUrl = restaurantLink.attr('href');
          
          // Fix URL construction issue - this was the main problem!
          if (eventUrl && !eventUrl.startsWith('http')) {
            eventUrl = eventUrl.startsWith('/') ? `https://everout.com${eventUrl}` : `https://everout.com/${eventUrl}`;
          }
          
          // Extract restaurant name and location
          const match = restaurantText.match(/^(.+?)\s*\((.+?)\)$/);
          if (match) {
            const restaurantName = match[1].trim();
            const neighborhood = match[2].trim();
            
            // Find the burger name - it's usually in the next h3 element
            const burgerNameElement = $element.parent().next().find('h3 a');
            const burgerName = burgerNameElement.text().trim();
            let burgerUrl = burgerNameElement.attr('href');
            
            // Fix burger URL construction
            if (burgerUrl && !burgerUrl.startsWith('http')) {
              burgerUrl = burgerUrl.startsWith('/') ? `https://everout.com${burgerUrl}` : `https://everout.com/${burgerUrl}`;
            }
            
            if (restaurantName && burgerName) {
              restaurants.push({
                restaurantName,
                neighborhood,
                burgerName,
                eventUrl,
                burgerUrl
              });
            }
          }
        }
      });

      console.log(`Found ${restaurants.length} restaurants`);
      return restaurants;
    } catch (error) {
      console.error('Error scraping main page:', error.message);
      return [];
    }
  }

  async scrapeRestaurantDetails(restaurant) {
    if (!restaurant.burgerUrl) return restaurant;

    try {
      console.log(`Scraping details for ${restaurant.restaurantName}...`);
      
      const response = await axios.get(restaurant.burgerUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 second timeout
      });

      const $ = cheerio.load(response.data);
      
      // Extract description - specifically look for "What's on it..." section
      let description = '';
      
      // Look for the "What's on it..." text and extract only the ingredients that follow
      const html = response.data;
      const whatsOnItMatch = html.match(/What's on it\.\.\.\s*([^<]+)/i);
      
      if (whatsOnItMatch) {
        // Extract just the ingredients text, clean it up
        description = whatsOnItMatch[1]
          .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
          .replace(/\n/g, ' ') // Replace newlines with spaces
          .trim();
      }
      
      // If the regex approach didn't work, try the DOM approach but be more specific
      if (!description) {
        $('*').each((i, el) => {
          const text = $(el).text();
          const whatsOnItIndex = text.indexOf("What's on it...");
          if (whatsOnItIndex !== -1) {
            // Extract text after "What's on it..."
            const afterWhatsOnIt = text.substring(whatsOnItIndex + "What's on it...".length);
            // Find the end of the ingredients (usually before "What they say" or similar)
            const endMarkers = ["What they say", "Meat or Vegetarian", "Gluten Free", "\n\n"];
            let endIndex = afterWhatsOnIt.length;
            
            for (const marker of endMarkers) {
              const markerIndex = afterWhatsOnIt.indexOf(marker);
              if (markerIndex !== -1 && markerIndex < endIndex) {
                endIndex = markerIndex;
              }
            }
            
            description = afterWhatsOnIt.substring(0, endIndex)
              .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
              .trim();
            
            if (description.length > 10) { // Only use if we got meaningful content
              return false; // break
            }
          }
        });
      }
      
      // Fallback: if we couldn't find "What's on it...", try to extract any description
      if (!description) {
        description = $('.event-description').text().trim() || 
                     $('.description').text().trim() ||
                     $('p').first().text().trim();
      }

      // Extract address using the specific CSS selector structure
      let address = '';
      
      // Use the precise CSS selector: .answer-list > div > div:nth-of-type(2) > p:nth-of-type(2)
      const addressElement = $('.answer-list > div > div:nth-of-type(2) > p:nth-of-type(2)');
      
      if (addressElement.length > 0) {
        // Get the text content
        let addressText = addressElement.text().trim();
        
        // Remove the span.text-muted content (neighborhood)
        const textMuted = addressElement.find('span.text-muted');
        if (textMuted.length > 0) {
          const mutedText = textMuted.text().trim();
          // Remove the muted text from the full address text
          addressText = addressText.replace(mutedText, '').trim();
        }
        
        // Clean up any remaining formatting
        address = addressText
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .replace(/[.,]+$/, '') // Remove trailing punctuation
          .trim();
        
        console.log(`Found address: "${address}" for ${restaurant.restaurantName}`);
      } else {
        // Fallback: try to find address in a simpler way if the structure doesn't match
        const fallbackAddress = $('*:contains("EVENT LOCATION")').parent().find('p').filter(function() {
          const text = $(this).text();
          return /^\d+\s+/.test(text.trim()); // Starts with a number
        }).first();
        
        if (fallbackAddress.length > 0) {
          address = fallbackAddress.text()
            .replace(/\([^)]+\)/g, '') // Remove parenthetical content
            .replace(/\s+/g, ' ')
            .trim();
          console.log(`Found fallback address: "${address}" for ${restaurant.restaurantName}`);
        } else {
          console.log(`No address found for ${restaurant.restaurantName}`);
        }
      }

      // Extract hours from the API endpoint
      let hours = [];
      
      // Extract occurrence ID from the burger URL
      const occurrenceMatch = restaurant.burgerUrl ? restaurant.burgerUrl.match(/\/e(\d+)\/?$/) : null;
      
      if (occurrenceMatch) {
        const occurrenceId = occurrenceMatch[1];
        
        try {
          console.log(`Fetching schedule for occurrence ${occurrenceId}...`);
          
          const scheduleResponse = await axios.get(`https://everout.com/api/schedule-dates/`, {
            params: {
              market: 'portland',
              page_size: 15,
              occurrence: occurrenceId,
              cb: Date.now() // cache buster
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Referer': restaurant.burgerUrl,
              'Accept': 'application/json, text/plain, */*'
            },
            timeout: 5000
          });
          
          if (scheduleResponse.data && scheduleResponse.data.results) {
            hours = scheduleResponse.data.results.map(result => ({
              dayOfWeek: result.date_string.split(' ')[0], // "Fri", "Sat", etc.
              date: result.date_string.substring(4), // "Aug 15", "Aug 16", etc.
              hours: result.time_string,
              fullDate: result.date
            }));
            
            console.log(`Found ${hours.length} schedule entries for ${restaurant.restaurantName}`);
          }
          
        } catch (scheduleError) {
          console.log(`Could not fetch schedule for ${restaurant.restaurantName}:`, scheduleError.message);
        }
      }
      
      // Fallback: if no API data, try to extract from the page HTML
      if (hours.length === 0) {
        const timePattern = /\d{1,2}:\d{2}\s*(AM|PM|am|pm)/gi;
        $('*').each((i, el) => {
          const text = $(el).text();
          if (timePattern.test(text) && text.length < 200) {
            // Store as a simple string for backwards compatibility
            hours = text.trim();
            return false;
          }
        });
      }

      return {
        ...restaurant,
        description: description.substring(0, 500).trim(),
        address,
        hours
      };
    } catch (error) {
      console.error(`Error scraping details for ${restaurant.restaurantName}:`, error.message);
      return restaurant;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Process items in batches to improve performance
  async processBatch(items, processor, batchSize = 3) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => processor(item));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        const processedResults = batchResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`Error processing item ${i + index}:`, result.reason?.message || result.reason);
            return batch[index]; // Return original item if processing failed
          }
        });
        
        results.push(...processedResults);
        
        // Add delay between batches to be respectful
        if (i + batchSize < items.length) {
          console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(items.length/batchSize)}, waiting 1 second...`);
          await this.delay(1000);
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        results.push(...batch); // Add original items if batch fails
      }
    }
    
    return results;
  }

  async scrapeAll() {
    console.log('Starting Burger Week scraping...');
    
    // Get initial restaurant list
    const restaurants = await this.scrapeMainPage();
    
    if (restaurants.length === 0) {
      console.log('No restaurants found. Exiting.');
      return;
    }

    // Scrape details for each restaurant in batches
    console.log('Scraping restaurant details in batches...');
    const detailedRestaurants = await this.processBatch(
      restaurants, 
      (restaurant) => this.scrapeRestaurantDetails(restaurant),
      this.concurrency
    );

    this.burgers = detailedRestaurants;
    await this.saveData();
    
    console.log(`Scraping complete! Found ${this.burgers.length} restaurants.`);
    console.log(`Addresses found: ${this.burgers.filter(r => r.address && r.address.trim()).length}/${this.burgers.length}`);
    
    return this.burgers;
  }

  async saveData() {
    const dataDir = path.join(__dirname, '..', 'data');
    const filePath = path.join(dataDir, 'burgers.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load existing data to preserve coordinates
    let existingData = [];
    if (fs.existsSync(filePath)) {
      try {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(existingContent);
        console.log(`Loaded ${existingData.length} existing restaurants to preserve coordinates`);
      } catch (error) {
        console.log('Could not load existing data, creating new file');
      }
    }

    // Merge new data with existing coordinates
    const mergedData = this.burgers.map(newRestaurant => {
      // Find matching restaurant in existing data
      const existingRestaurant = existingData.find(existing => 
        existing.restaurantName === newRestaurant.restaurantName &&
        existing.burgerName === newRestaurant.burgerName
      );

      // If we have existing coordinates, preserve them
      if (existingRestaurant && existingRestaurant.latitude && existingRestaurant.longitude) {
        return {
          ...newRestaurant,
          latitude: existingRestaurant.latitude,
          longitude: existingRestaurant.longitude,
          geocoded_address: existingRestaurant.geocoded_address,
          geocoding_method: existingRestaurant.geocoding_method
        };
      }

      return newRestaurant;
    });

    // Save the merged data
    fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));
    console.log(`Data saved to ${filePath}`);

    // Also save a summary
    const summary = {
      totalRestaurants: mergedData.length,
      withAddresses: mergedData.filter(b => b.address && b.address.trim()).length,
      geocodedRestaurants: mergedData.filter(b => b.latitude && b.longitude).length,
      lastUpdated: new Date().toISOString(),
      neighborhoods: [...new Set(mergedData.map(b => b.neighborhood))].sort()
    };
    
    fs.writeFileSync(path.join(dataDir, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log('Summary saved');
    console.log(`Coordinates preserved for ${summary.geocodedRestaurants} restaurants`);

    // Update this.burgers with the merged data
    this.burgers = mergedData;
  }
}

// Run the scraper if this file is executed directly
if (require.main === module) {
  const scraper = new BurgerWeekScraper();
  scraper.scrapeAll().catch(console.error);
}

module.exports = BurgerWeekScraper;
