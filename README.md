# 🍔 Portland Mercury's Burger Week 2025 Map

An interactive map showcasing all the delicious burger offerings from Portland Mercury's Burger Week 2025. This application scrapes data from the official EverOut listing and displays it on an interactive map with search and filtering capabilities.

## 🌟 Features

- **Interactive Map**: Browse burger locations on a map of Portland
- **Search & Filter**: Find specific restaurants, burgers, or neighborhoods
- **Detailed Information**: View restaurant details, burger descriptions, addresses, and hours
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Data**: Automatically updates daily with the latest information
- **Static Deployment**: Runs entirely in the browser with no backend required

## 🚀 Live Demo

Visit the live site: [https://camtheperson.com/better-burger-week-map/](https://camtheperson.com/better-burger-week-map/)

## 📱 Screenshots

*Coming soon...*

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS with PostCSS processing
- **Build Tool**: Vite for fast development and optimized builds
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Scraping**: Node.js with Cheerio and Axios for data extraction
- **Geocoding**: Google Maps Geocoding API (with fallback to OpenStreetMap Nominatim)
- **Image Processing**: Automated burger image scraping and optimization
- **Deployment**: GitHub Pages with automated GitHub Actions CI/CD
- **Static Generation**: Fully static site with no backend dependencies

## 🏗️ Local Development

### Prerequisites

- Node.js 16+ and npm
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/camtheperson/better-burger-week-map.git
   cd better-burger-week-map
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Scrape the latest data**
   ```bash
   npm run scrape
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run scrape` - Scrape latest burger data from EverOut
- `npm run geocode` - Geocode addresses using Google Maps API (requires API key)
- `npm run test-geocode` - Test Google geocoding setup
- `npm run scrape-images` - Download burger images from restaurants
- `npm run scrape-and-geocode` - Run scraping and geocoding in sequence
- `npm run dev` - Start local development server (Vite)
- `npm run build` - Build for production using Vite
- `npm run preview` - Preview production build locally
- `npm run deploy` - Build and deploy to GitHub Pages using gh-pages

## 📊 Data Source

Data is scraped from the official [Portland Mercury's Burger Week 2025](https://everout.com/portland/events/the-portland-mercurys-burger-week-2025/e205791/) listing on EverOut. The scraper:

1. Fetches the main burger week page
2. Extracts restaurant names, burger names, and neighborhoods
3. Scrapes individual restaurant pages for descriptions, addresses, and hours
4. Geocodes addresses to get map coordinates using Google Maps API
5. Saves all data to JSON files

### ⚠️ Important Notes about Geocoding

- **Coordinates are already included**: The repository contains pre-geocoded coordinates for all restaurants
- **GitHub Actions doesn't run geocoding**: To preserve coordinates and avoid API costs, automated deployments skip the geocoding step
- **Manual geocoding**: If you need to re-geocode, set `GOOGLE_GEOCODING_API_KEY` environment variable and run `npm run geocode`
- **Coordinate preservation**: The scraper automatically preserves existing coordinates when updating restaurant data

## 🔄 Automated Updates

The site automatically updates daily at 8 AM UTC using GitHub Actions. This ensures the map always has the latest information about participating restaurants.

## 🚀 Deployment

### GitHub Pages (Automatic)

This project is configured for automatic deployment to GitHub Pages using GitHub Actions:

1. **Push to main branch** - Any push to `main` triggers the deployment workflow
2. **Automated build** - GitHub Actions runs `npm run build` with the correct base path
3. **Deployment** - Built files are automatically deployed to GitHub Pages
4. **Live site** - Visit [https://camtheperson.com/better-burger-week-map/](https://camtheperson.com/better-burger-week-map/)

The deployment workflow also runs daily at 8 AM UTC to refresh data automatically.

### Manual Deployment (Alternative)

You can also deploy manually using the gh-pages tool:

```bash
npm run deploy
```

This builds the project and pushes to the `gh-pages` branch.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- Use semantic commit messages
- Follow the existing code style
- Test your changes locally before submitting
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Portland Mercury** - For organizing this amazing food event
- **EverOut** - For providing detailed restaurant information
- **OpenStreetMap** - For map tiles and geocoding services
- **Leaflet.js** - For the excellent mapping library

## 📧 Contact

Cameron Hermens - [@camtheperson](https://github.com/camtheperson)

Project Link: [https://github.com/camtheperson/better-burger-week-map](https://github.com/camtheperson/better-burger-week-map)

---

**Disclaimer**: This is an unofficial project created for educational and community purposes. All restaurant data is sourced from publicly available information on EverOut.com. Please visit the official [Portland Mercury Burger Week page](https://everout.com/portland/events/the-portland-mercurys-burger-week-2025/e205791/) for the most up-to-date information.
