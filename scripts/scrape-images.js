const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class ImageScraper {
  constructor() {
    this.dataPath = path.join(__dirname, '..', 'data', 'burgers.json');
    this.imagesDir = path.join(__dirname, '..', 'images');
    this.concurrency = 3; // Number of parallel image downloads
    this.delay = 1000; // Delay between requests (ms)
  }

  async init() {
    // Ensure images directory exists
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  async loadBurgerData() {
    console.log('Loading burger data...');
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading burger data:', error);
      throw error;
    }
  }

  async saveBurgerData(data) {
    console.log('Saving updated burger data...');
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving burger data:', error);
      throw error;
    }
  }

  async scrapeImageFromUrl(burgerUrl) {
    try {
      console.log(`Scraping image from: ${burgerUrl}`);
      
      const response = await axios.get(burgerUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Find images using the specified selector
      const imageElements = $('.item-image img');
      
      if (imageElements.length === 0) {
        console.log(`No images found for ${burgerUrl}`);
        return null;
      }

      // Get the first image's src
      const firstImage = $(imageElements[0]);
      let imageSrc = firstImage.attr('src') || firstImage.attr('data-src');
      
      if (!imageSrc) {
        console.log(`No src found for image in ${burgerUrl}`);
        return null;
      }

      // Handle relative URLs
      if (imageSrc.startsWith('//')) {
        imageSrc = 'https:' + imageSrc;
      } else if (imageSrc.startsWith('/')) {
        imageSrc = 'https://everout.com' + imageSrc;
      }

      console.log(`Found image: ${imageSrc}`);
      return imageSrc;

    } catch (error) {
      console.error(`Error scraping ${burgerUrl}:`, error.message);
      return null;
    }
  }

  async downloadImage(imageUrl, filename) {
    try {
      console.log(`Downloading image: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const filePath = path.join(this.imagesDir, filename);
      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`Image saved: ${filename}`);
          resolve(filePath);
        });
        writer.on('error', reject);
      });

    } catch (error) {
      console.error(`Error downloading image ${imageUrl}:`, error.message);
      return null;
    }
  }

  generateFilename(restaurantName, burgerName, imageUrl) {
    // Create a safe filename from restaurant and burger names
    const safeName = (restaurantName + '_' + burgerName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50); // Limit length

    // Get file extension from URL
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const ext = path.extname(pathname) || '.jpg';

    return `${safeName}${ext}`;
  }

  async processRestaurant(restaurant, index, total) {
    console.log(`\n[${index + 1}/${total}] Processing: ${restaurant.restaurantName} - ${restaurant.burgerName}`);
    
    if (!restaurant.burgerUrl) {
      console.log('No burger URL found, skipping...');
      return restaurant;
    }

    // Check if image already exists
    if (restaurant.image) {
      console.log('Image already exists, skipping...');
      return restaurant;
    }

    try {
      // Scrape image URL from the page
      const imageUrl = await this.scrapeImageFromUrl(restaurant.burgerUrl);
      
      if (!imageUrl) {
        console.log('No image found on page');
        return restaurant;
      }

      // Generate filename
      const filename = this.generateFilename(restaurant.restaurantName, restaurant.burgerName, imageUrl);
      
      // Check if file already exists
      const filePath = path.join(this.imagesDir, filename);
      if (fs.existsSync(filePath)) {
        console.log(`File already exists: ${filename}`);
        return {
          ...restaurant,
          image: `./images/${filename}`,
          imageUrl: imageUrl
        };
      }

      // Download image
      const downloadedPath = await this.downloadImage(imageUrl, filename);
      
      if (downloadedPath) {
        return {
          ...restaurant,
          image: `./images/${filename}`,
          imageUrl: imageUrl
        };
      } else {
        console.log('Failed to download image');
        return restaurant;
      }

    } catch (error) {
      console.error(`Error processing ${restaurant.restaurantName}:`, error.message);
      return restaurant;
    }
  }

  async scrapeAllImages() {
    await this.init();
    
    const burgerData = await this.loadBurgerData();
    console.log(`Found ${burgerData.length} restaurants to process`);

    const updatedData = [];
    
    // Process restaurants in batches to avoid overwhelming the server
    for (let i = 0; i < burgerData.length; i += this.concurrency) {
      const batch = burgerData.slice(i, i + this.concurrency);
      
      const batchPromises = batch.map((restaurant, batchIndex) => 
        this.processRestaurant(restaurant, i + batchIndex, burgerData.length)
      );

      const batchResults = await Promise.all(batchPromises);
      updatedData.push(...batchResults);

      // Add delay between batches to be respectful
      if (i + this.concurrency < burgerData.length) {
        console.log(`\nWaiting ${this.delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    // Save updated data
    await this.saveBurgerData(updatedData);

    // Print summary
    const withImages = updatedData.filter(r => r.image);
    console.log(`\n✅ Scraping complete!`);
    console.log(`📸 Found images for ${withImages.length}/${updatedData.length} restaurants`);
    console.log(`📁 Images saved to: ${this.imagesDir}`);
  }
}

// Command line usage
async function main() {
  const scraper = new ImageScraper();
  
  try {
    await scraper.scrapeAllImages();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ImageScraper;
