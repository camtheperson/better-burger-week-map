const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class NeighborhoodUpdater {
  constructor() {
    this.baseUrl = 'https://everout.com/portland/events/the-portland-mercurys-burger-week-2025/e205791/';
    this.burgersFilePath = path.join(__dirname, '..', 'data', 'burgers.json');
  }

  async scrapeNeighborhoods() {
    console.log('Fetching main Burger Week page for neighborhood data...');
    
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const restaurantNeighborhoods = new Map();

      // Find all restaurant/burger entries
      $('h4').each((index, element) => {
        const $element = $(element);
        const restaurantLink = $element.find('a');
        
        if (restaurantLink.length > 0) {
          const restaurantText = restaurantLink.text().trim();
          
          // Extract restaurant name and neighborhood from the text in parentheses
          const match = restaurantText.match(/^(.+?)\s*\((.+?)\)$/);
          if (match) {
            const restaurantName = match[1].trim();
            let neighborhood = match[2].trim();
            
            // Clean up any HTML artifacts
            neighborhood = neighborhood
              .replace(/div>/g, '') // Remove the div> artifact
              .replace(/[<>]/g, '') // Remove any remaining HTML brackets
              .trim();
            
            // Skip empty or invalid neighborhoods
            if (neighborhood && neighborhood.length > 0 && !neighborhood.includes('<') && !neighborhood.includes('>')) {
              restaurantNeighborhoods.set(restaurantName, neighborhood);
              console.log(`Found: ${restaurantName} -> ${neighborhood}`);
            } else {
              console.warn(`Skipping invalid neighborhood for ${restaurantName}: "${match[2]}"`);
            }
          } else {
            console.warn(`Could not parse restaurant text: "${restaurantText}"`);
          }
        }
      });

      console.log(`Found neighborhoods for ${restaurantNeighborhoods.size} restaurants`);
      return restaurantNeighborhoods;
    } catch (error) {
      console.error('Error scraping neighborhoods:', error.message);
      return new Map();
    }
  }

  async updateBurgersFile() {
    try {
      // Load existing data
      console.log('Loading existing burgers data...');
      const existingData = JSON.parse(fs.readFileSync(this.burgersFilePath, 'utf8'));
      console.log(`Loaded ${existingData.length} existing burger entries`);

      // Scrape fresh neighborhood data
      const neighborhoodMap = await this.scrapeNeighborhoods();
      
      if (neighborhoodMap.size === 0) {
        console.error('No neighborhoods scraped. Aborting update.');
        return;
      }

      // Update neighborhoods while preserving all other data
      let updatedCount = 0;
      let fixedDivCount = 0;
      
      const updatedData = existingData.map(burger => {
        const restaurantName = burger.restaurantName;
        
        // Check if this restaurant has the div> issue
        const hasDivIssue = burger.neighborhood === 'div>';
        
        // Try to find updated neighborhood data
        if (neighborhoodMap.has(restaurantName)) {
          const newNeighborhood = neighborhoodMap.get(restaurantName);
          
          if (burger.neighborhood !== newNeighborhood) {
            console.log(`Updating ${restaurantName}: "${burger.neighborhood}" -> "${newNeighborhood}"`);
            
            if (hasDivIssue) {
              fixedDivCount++;
            }
            updatedCount++;
            
            return {
              ...burger,
              neighborhood: newNeighborhood
            };
          }
        } else if (hasDivIssue) {
          console.warn(`Restaurant "${restaurantName}" has div> issue but no new neighborhood found`);
        }
        
        return burger;
      });

      // Create backup of original file
      const backupPath = this.burgersFilePath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, JSON.stringify(existingData, null, 2));
      console.log(`Backup created: ${backupPath}`);

      // Save updated data
      fs.writeFileSync(this.burgersFilePath, JSON.stringify(updatedData, null, 2));
      
      console.log(`\nUpdate completed:`);
      console.log(`- Total entries: ${updatedData.length}`);
      console.log(`- Neighborhoods updated: ${updatedCount}`);
      console.log(`- "div>" issues fixed: ${fixedDivCount}`);
      
      // Show unique neighborhoods after update
      const uniqueNeighborhoods = [...new Set(updatedData.map(b => b.neighborhood))].sort();
      console.log(`\nUnique neighborhoods (${uniqueNeighborhoods.length}):`);
      uniqueNeighborhoods.forEach(n => console.log(`  - ${n}`));
      
      // Check if any div> issues remain
      const remainingDivIssues = updatedData.filter(b => b.neighborhood === 'div>').length;
      if (remainingDivIssues > 0) {
        console.warn(`\nWarning: ${remainingDivIssues} entries still have "div>" as neighborhood`);
      }

    } catch (error) {
      console.error('Error updating burgers file:', error.message);
    }
  }
}

// Run the updater if this file is executed directly
if (require.main === module) {
  const updater = new NeighborhoodUpdater();
  updater.updateBurgersFile().catch(console.error);
}

module.exports = NeighborhoodUpdater;
