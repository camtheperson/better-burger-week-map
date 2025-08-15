# Burger Week Map - Deployment Guide

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run scrape      # Get latest burger data
npm run dev        # Start development server at http://localhost:8080
```

### Building for Production
```bash
npm run build      # Creates ./dist folder with all assets
npm run deploy     # Deploy to GitHub Pages (requires setup)
```

## 📊 Data Management

### Scraping Data
The scraper collects restaurant information from EverOut:
```bash
npm run scrape     # Scrapes all burger week data
```

### Adding Coordinates
Some restaurants may need manual geocoding:
```bash
npm run add-coords # Adds known coordinates to restaurants
```

## 🌐 Deployment Options

### GitHub Pages (Recommended)
1. **Automatic Deployment**:
   - Push to `main` branch
   - GitHub Actions automatically scrapes and deploys
   - Site updates daily at 8 AM UTC

2. **Manual Deployment**:
   ```bash
   npm run deploy
   ```

### Other Static Hosts
The built files in `./dist` can be deployed to:
- Netlify
- Vercel
- Firebase Hosting
- Any static file host

## 🔧 Configuration

### Environment Variables
For production deployment, you may want to set:
```bash
DOMAIN=your-custom-domain.com  # For custom domain setup
```

### GitHub Pages Setup
1. Enable GitHub Pages in repository settings
2. Source: GitHub Actions
3. The workflow will handle everything automatically

## 📁 Project Structure
```
burger-week-map/
├── index.html          # Main HTML file
├── style.css          # Styling
├── app.js             # Frontend JavaScript
├── data/              # JSON data files
│   ├── burgers.json   # Restaurant data
│   └── summary.json   # Summary statistics
├── scripts/           # Build and utility scripts
│   ├── scraper.js     # Web scraper
│   ├── add-coordinates.js  # Coordinate helper
│   └── build.sh       # Build script
├── .github/workflows/ # GitHub Actions
└── dist/             # Built files (generated)
```

## 🛠️ Troubleshooting

### Scraper Issues
- **Rate limiting**: The scraper includes delays to respect servers
- **URL errors**: Check the base URL in `scraper.js`
- **Geocoding blocked**: We skip geocoding by default to avoid blocks

### Deployment Issues
- **GitHub Pages**: Check Actions tab for deployment status
- **404 errors**: Ensure `404.html` is in the root directory
- **Map not loading**: Check browser console for errors

### Development Issues
- **Map not showing**: Verify `data/burgers.json` exists and is valid
- **No markers**: Check that some restaurants have latitude/longitude
- **CORS errors**: Use the development server, not file:// URLs

## 🔄 Maintenance

### Daily Updates
The GitHub Action runs daily to keep data fresh:
- Scrapes latest restaurant information
- Updates geocoding for new restaurants
- Rebuilds and deploys the site

### Manual Updates
To manually update data:
```bash
npm run scrape     # Get fresh data
npm run build      # Build site
npm run deploy     # Deploy changes
```

## 📈 Analytics & Monitoring

### Adding Analytics
Add your analytics code to `index.html`:
```html
<!-- Google Analytics, Plausible, etc. -->
```

### Monitoring
- Check GitHub Actions for scraping issues
- Monitor site performance via hosting provider
- Watch for 404s in analytics

## 🎨 Customization

### Styling
Edit `style.css` to change:
- Colors and themes
- Layout and spacing
- Responsive behavior

### Functionality
Edit `app.js` to modify:
- Map behavior
- Search and filtering
- Modal content

### Data Sources
Edit `scripts/scraper.js` to:
- Change data source URLs
- Add new data fields
- Modify parsing logic

## 🤝 Contributing

1. Fork the repository
2. Make your changes
3. Test locally with `npm run dev`
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
