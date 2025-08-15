const axios = require('axios');

async function testScheduleAPI() {
  // Extract the API endpoint from the HTML
  const apiUrl = 'https://everout.com/api/schedule-dates/?market=portland&page_size=15&occurrence=212504&cb=f38c2c6a3f8d83b29d30bc7abc499d3f';
  
  try {
    console.log('Testing schedule API:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://everout.com/portland/events/jalapeno-popper-burger/e212504/',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testScheduleAPI();
