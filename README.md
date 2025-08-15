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

Visit the live site: [https://cameronhermens.github.io/burger-week-map/](https://cameronhermens.github.io/burger-week-map/)

## 📱 Screenshots

*Coming soon...*

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Scraping**: Node.js with Cheerio and Axios
- **Geocoding**: OpenStreetMap Nominatim API
- **Deployment**: GitHub Pages with automated GitHub Actions
- **Styling**: Custom CSS with responsive design

## 🏗️ Local Development

### Prerequisites

- Node.js 16+ and npm
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cameronhermens/burger-week-map.git
   cd burger-week-map
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
   Navigate to `http://localhost:8080`

### Available Scripts

- `npm run scrape` - Scrape latest burger data from EverOut
- `npm run dev` - Start local development server
- `npm run build` - Build for production
- `npm run deploy` - Deploy to GitHub Pages

## 📊 Data Source

Data is scraped from the official [Portland Mercury's Burger Week 2025](https://everout.com/portland/events/the-portland-mercurys-burger-week-2025/e205791/) listing on EverOut. The scraper:

1. Fetches the main burger week page
2. Extracts restaurant names, burger names, and neighborhoods
3. Scrapes individual restaurant pages for descriptions, addresses, and hours
4. Geocodes addresses to get map coordinates
5. Saves all data to JSON files

## 🔄 Automated Updates

The site automatically updates daily at 8 AM UTC using GitHub Actions. This ensures the map always has the latest information about participating restaurants.

## 🚀 Deployment

### GitHub Pages (Automatic)

This project is configured for automatic deployment to GitHub Pages:

1. Push to the `main` branch
2. GitHub Actions will automatically scrape data and deploy
3. Visit your site at `https://yourusername.github.io/burger-week-map/`

### Manual Deployment

```bash
npm run build
npm run deploy
```

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

Cameron Hermens - [@cameronhermens](https://github.com/cameronhermens)

Project Link: [https://github.com/cameronhermens/burger-week-map](https://github.com/cameronhermens/burger-week-map)

---

**Disclaimer**: This is an unofficial project created for educational and community purposes. All restaurant data is sourced from publicly available information on EverOut.com. Please visit the official [Portland Mercury Burger Week page](https://everout.com/portland/events/the-portland-mercurys-burger-week-2025/e205791/) for the most up-to-date information.
