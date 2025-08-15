const BurgerWeekScraper = require('./scraper.js');

async function testSingleRestaurant() {
  const scraper = new BurgerWeekScraper();
  
  // Test with a specific restaurant
  const testRestaurant = {
    restaurantName: "MidCity SmashedBurger @ Prost! Marketplace",
    neighborhood: "Boise",
    burgerName: "Jalapeño Popper Burger",
    eventUrl: "https://everout.com/portland/events/jalapeno-popper-burger/e212504/",
    burgerUrl: "https://everout.com/portland/events/jalapeno-popper-burger/e212504/"
  };
  
  console.log('Testing single restaurant details extraction...');
  const result = await scraper.scrapeRestaurantDetails(testRestaurant);
  
  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
}

testSingleRestaurant().catch(console.error);
