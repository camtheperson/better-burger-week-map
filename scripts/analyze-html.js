const axios = require('axios');
const fs = require('fs');

async function savePageHTML() {
  const testUrl = 'https://everout.com/portland/events/jalapeno-popper-burger/e212504/';
  
  try {
    console.log('Fetching and saving full HTML for analysis...');
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Save the full HTML to a file for analysis
    fs.writeFileSync('page-source.html', response.data);
    console.log('HTML saved to page-source.html');
    
    // Look for any mention of dates or times in the HTML
    const html = response.data;
    
    console.log('\n=== Searching for date/time related content ===');
    
    // Search for various date/time patterns
    const patterns = [
      /aug.*?15/gi,
      /aug.*?16/gi,
      /aug.*?17/gi,
      /11:30/gi,
      /12.*?8/gi,
      /am.*?pm/gi,
      /upcoming.*?event.*?times/gi,
      /dates.*?table/gi,
      /<table[^>]*>/gi,
      /<tr[^>]*>/gi
    ];
    
    patterns.forEach((pattern, i) => {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`\nPattern ${i} (${pattern}): Found ${matches.length} matches`);
        console.log('Matches:', matches.slice(0, 5));
      }
    });
    
    // Look for specific class names and data structures
    console.log('\n=== Looking for class names and data structures ===');
    
    const classPatterns = [
      /class="[^"]*upcoming[^"]*"/gi,
      /class="[^"]*dates[^"]*"/gi,
      /class="[^"]*times[^"]*"/gi,
      /class="[^"]*table[^"]*"/gi,
      /class="[^"]*schedule[^"]*"/gi,
      /data-[^=]*="[^"]*"/gi
    ];
    
    classPatterns.forEach((pattern, i) => {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`\nClass pattern ${i}: Found ${matches.length} matches`);
        console.log('Sample matches:', matches.slice(0, 3));
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

savePageHTML();
