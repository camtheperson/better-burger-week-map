// Debug script to test the "Open Now" functionality

const fs = require('fs');

// Read the burger data
const burgersData = JSON.parse(fs.readFileSync('/Users/cameron.hermens/Sites/burger-week-map/data/burgers.json', 'utf8'));

// Current time info
const now = new Date();
const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
const currentTime = now.getHours() * 60 + now.getMinutes();

console.log('Current date/time info:');
console.log('- Current day:', currentDay);
console.log('- Current time (24h):', `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
console.log('- Current time (minutes):', currentTime);
console.log('- Full date:', now.toISOString());

// Test a few restaurants
const testRestaurants = burgersData.slice(0, 5);

console.log('\n=== Testing restaurants ===');

testRestaurants.forEach(restaurant => {
  console.log(`\n${restaurant.restaurantName}:`);
  console.log('Hours data:', JSON.stringify(restaurant.hours, null, 2));
  
  if (Array.isArray(restaurant.hours)) {
    // Find today's hours
    const todayHours = restaurant.hours.find(h => 
      h.dayOfWeek && h.dayOfWeek.toLowerCase() === currentDay.toLowerCase()
    );
    
    console.log('- Today\'s hours found:', todayHours ? JSON.stringify(todayHours) : 'No');
    
    if (todayHours) {
      console.log('- Hours string:', todayHours.hours);
      
      // Test the regex
      const timeRangePattern = /(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?\s*[-–—]\s*(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)/i;
      const match = todayHours.hours.match(timeRangePattern);
      
      console.log('- Regex match:', match ? match.slice(1) : 'No match');
      
      if (match) {
        const [, startHour, startMin = '0', startAmPm, endHour, endMin = '0', endAmPm] = match;
        console.log('- Parsed start:', startHour, startMin, startAmPm);
        console.log('- Parsed end:', endHour, endMin, endAmPm);
        
        // Convert to 24-hour format
        let startTime24 = parseInt(startHour);
        let endTime24 = parseInt(endHour);

        // Handle AM/PM
        if (startAmPm && startAmPm.toLowerCase() === 'pm' && startTime24 !== 12) {
          startTime24 += 12;
        } else if (startAmPm && startAmPm.toLowerCase() === 'am' && startTime24 === 12) {
          startTime24 = 0;
        }

        if (endAmPm && endAmPm.toLowerCase() === 'pm' && endTime24 !== 12) {
          endTime24 += 12;
        } else if (endAmPm && endAmPm.toLowerCase() === 'am' && endTime24 === 12) {
          endTime24 = 0;
        }

        // Convert to minutes
        const startTimeMinutes = startTime24 * 60 + parseInt(startMin);
        const endTimeMinutes = endTime24 * 60 + parseInt(endMin);

        console.log('- Start time (24h):', `${startTime24}:${startMin.padStart(2, '0')} (${startTimeMinutes} min)`);
        console.log('- End time (24h):', `${endTime24}:${endMin.padStart(2, '0')} (${endTimeMinutes} min)`);
        
        const isOpen = currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
        console.log('- Is open now?', isOpen);
      }
    }
  }
});

// Check what days we have in the data
console.log('\n=== Day variations in data ===');
const allDays = new Set();
burgersData.forEach(restaurant => {
  if (Array.isArray(restaurant.hours)) {
    restaurant.hours.forEach(h => {
      if (h.dayOfWeek) {
        allDays.add(h.dayOfWeek);
      }
    });
  }
});
console.log('Unique days found:', Array.from(allDays).sort());
