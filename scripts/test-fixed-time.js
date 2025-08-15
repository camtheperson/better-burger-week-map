// Test the fixed time parsing logic

function isTimeInRange(currentTimeMinutes, hoursString) {
    if (!hoursString) return false;

    // Parse time ranges like "11:30 am–8 pm", "12–8 pm", "11:30 AM - 8:00 PM", "5–11 pm"
    const timeRangePattern = /(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?\s*[-–—]\s*(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)/i;
    const match = hoursString.match(timeRangePattern);

    if (!match) return false;

    const [, startHour, startMin = '0', startAmPm, endHour, endMin = '0', endAmPm] = match;

    // Convert to 24-hour format
    let startTime24 = parseInt(startHour);
    let endTime24 = parseInt(endHour);

    // Handle empty minutes as 0
    const startMinutes = startMin === '' ? 0 : parseInt(startMin);
    const endMinutes = endMin === '' ? 0 : parseInt(endMin);

    // Handle AM/PM for start time
    if (startAmPm && startAmPm.toLowerCase() === 'pm' && startTime24 !== 12) {
        startTime24 += 12;
    } else if (startAmPm && startAmPm.toLowerCase() === 'am' && startTime24 === 12) {
        startTime24 = 0;
    } else if (!startAmPm && endAmPm && endAmPm.toLowerCase() === 'pm') {
        // If start time has no AM/PM but end time is PM, assume start is also PM if it's reasonable
        // This handles cases like "5–11 pm" where start should be 5 PM
        if (startTime24 >= 1 && startTime24 <= 11) {
            startTime24 += 12;
        }
    }

    // Handle AM/PM for end time
    if (endAmPm && endAmPm.toLowerCase() === 'pm' && endTime24 !== 12) {
        endTime24 += 12;
    } else if (endAmPm && endAmPm.toLowerCase() === 'am' && endTime24 === 12) {
        endTime24 = 0;
    }

    // Convert to minutes
    const startTimeMinutes = startTime24 * 60 + startMinutes;
    const endTimeMinutes = endTime24 * 60 + endMinutes;

    console.log(`  - Start: ${startTime24}:${startMinutes.toString().padStart(2, '0')} (${startTimeMinutes} min)`);
    console.log(`  - End: ${endTime24}:${endMinutes.toString().padStart(2, '0')} (${endTimeMinutes} min)`);

    // Check if current time is within range
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
}

// Test with current time
const now = new Date();
const currentTime = now.getHours() * 60 + now.getMinutes();
console.log('Current time:', `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} (${currentTime} min)`);

// Test cases
const testCases = [
    '5–11 pm',
    '11:30 am–10 pm', 
    '11 am–9 pm',
    '12–8 pm',
    '9 am–5 pm'
];

console.log('\n=== Testing time ranges ===');
testCases.forEach(timeStr => {
    console.log(`\nTesting: "${timeStr}"`);
    const isOpen = isTimeInRange(currentTime, timeStr);
    console.log(`  - Is open now? ${isOpen}`);
});

// Test with a specific time that should be open (2 PM = 14:00 = 840 minutes)
console.log('\n=== Testing with 2 PM (840 minutes) ===');
testCases.forEach(timeStr => {
    console.log(`\nTesting: "${timeStr}"`);
    const isOpen = isTimeInRange(840, timeStr);
    console.log(`  - Would be open at 2 PM? ${isOpen}`);
});
