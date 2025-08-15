const axios = require('axios');
const cheerio = require('cheerio');

async function testHoursExtraction() {
  const testUrl = 'https://everout.com/portland/events/jalapeno-popper-burger/e212504/';
  
  try {
    console.log('Testing hours extraction for:', testUrl);
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Let's look for common date patterns that might exist
    console.log('\n=== Looking for any text containing "Aug 15" or similar dates ===');
    
    const sampleText = response.data;
    
    // Look for Aug 15, Aug 16, etc.
    const datePatterns = [
      /Aug\s+15/gi,
      /Aug\s+16/gi,
      /Aug\s+17/gi,
      /Fri.*?Aug.*?15/gi,
      /Sat.*?Aug.*?16/gi,
      /Sun.*?Aug.*?17/gi
    ];
    
    datePatterns.forEach((pattern, i) => {
      const matches = sampleText.match(pattern);
      if (matches) {
        console.log(`Pattern ${i} (${pattern}) found ${matches.length} matches:`, matches.slice(0, 3));
        
        // Get surrounding context for first match
        const firstMatch = matches[0];
        const index = sampleText.indexOf(firstMatch);
        const context = sampleText.substring(Math.max(0, index - 100), index + 200);
        console.log('Context around first match:', context.replace(/\s+/g, ' ').trim());
      }
    });
    
    // Let's also check if the content from the web scraper matches what I saw earlier
    console.log('\n=== Looking for table structures ===');
    
    // Look for any table with date-like content
    $('table, tbody, tr').each((i, el) => {
      const text = $(el).text();
      if (text.includes('Aug') || text.includes('15') || text.includes('16') || text.includes('17')) {
        console.log(`\nFound table element ${i} with date content:`);
        console.log('Tag:', el.tagName);
        console.log('Text:', text.replace(/\s+/g, ' ').trim().substring(0, 200));
        console.log('HTML:', $(el).html().substring(0, 300));
      }
    });
    
    // Look for the specific text patterns I saw in the web fetch
    console.log('\n=== Looking for time ranges like "11:30 am–8 pm" ===');
    const timeRangePattern = /\d{1,2}:\d{2}\s*am?–\d{1,2}\s*pm?|\d{1,2}–\d{1,2}\s*pm?/gi;
    const timeMatches = sampleText.match(timeRangePattern);
    if (timeMatches) {
      console.log('Found time ranges:', timeMatches.slice(0, 10));
      
      // Get context around these matches
      timeMatches.slice(0, 3).forEach((match, i) => {
        const index = sampleText.indexOf(match);
        const context = sampleText.substring(Math.max(0, index - 150), index + 150);
        console.log(`Context ${i}:`, context.replace(/\s+/g, ' ').trim());
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testHoursExtraction();
