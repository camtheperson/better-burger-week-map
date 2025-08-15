class BurgerWeekMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.burgerData = [];
        this.filteredData = [];
        this.selectedMarker = null;
        this.isStreetView = true;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.initMap();
        this.setupEventListeners();
        this.populateFilters();
        this.renderRestaurantList();
        this.updateStats();
    }

    async loadData() {
        try {
            const response = await fetch('./data/burgers.json');
            this.burgerData = await response.json();
            this.filteredData = [...this.burgerData];
            console.log(`Loaded ${this.burgerData.length} restaurants`);
        } catch (error) {
            console.error('Error loading burger data:', error);
            this.showError('Failed to load restaurant data. Please try again later.');
        }
    }

    initMap() {
        // Initialize map centered on Portland
        this.map = L.map('map').setView([45.5152, -122.6784], 12);

        // Add street map layer
        this.streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add satellite layer
        this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });

        this.addMarkersToMap();
    }

    addMarkersToMap() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add markers for restaurants with coordinates
        this.filteredData.forEach((restaurant, index) => {
            if (restaurant.latitude && restaurant.longitude) {
                const marker = L.marker([restaurant.latitude, restaurant.longitude])
                    .bindPopup(this.createPopupContent(restaurant))
                    .on('click', () => this.selectRestaurant(restaurant));
                
                marker.addTo(this.map);
                this.markers.push(marker);
            }
        });
    }

    createPopupContent(restaurant) {
        return `
            <div>
                <div class="popup-restaurant-name">${restaurant.restaurantName}</div>
                <div class="popup-burger-name">${restaurant.burgerName}</div>
                <div class="popup-neighborhood">${restaurant.neighborhood}</div>
            </div>
        `;
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        searchInput.addEventListener('input', (e) => {
            this.filterData();
        });

        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.filterData();
        });

        // Neighborhood filter
        document.getElementById('neighborhoodFilter').addEventListener('change', () => {
            this.filterData();
        });

        // Show with coordinates filter
        document.getElementById('showWithCoordinates').addEventListener('change', () => {
            this.filterData();
        });

        // Map controls
        document.getElementById('resetView').addEventListener('click', () => {
            this.map.setView([45.5152, -122.6784], 12);
        });

        document.getElementById('toggleSatellite').addEventListener('click', () => {
            this.toggleMapLayer();
        });

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('restaurantModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    populateFilters() {
        const neighborhoods = [...new Set(this.burgerData.map(r => r.neighborhood))].sort();
        const neighborhoodFilter = document.getElementById('neighborhoodFilter');
        
        neighborhoods.forEach(neighborhood => {
            const option = document.createElement('option');
            option.value = neighborhood;
            option.textContent = neighborhood;
            neighborhoodFilter.appendChild(option);
        });
    }

    filterData() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const selectedNeighborhood = document.getElementById('neighborhoodFilter').value;
        const showWithCoordinates = document.getElementById('showWithCoordinates').checked;

        this.filteredData = this.burgerData.filter(restaurant => {
            // Search filter
            const matchesSearch = !searchTerm || 
                restaurant.restaurantName.toLowerCase().includes(searchTerm) ||
                restaurant.burgerName.toLowerCase().includes(searchTerm) ||
                restaurant.neighborhood.toLowerCase().includes(searchTerm) ||
                (restaurant.description && restaurant.description.toLowerCase().includes(searchTerm));

            // Neighborhood filter
            const matchesNeighborhood = !selectedNeighborhood || 
                restaurant.neighborhood === selectedNeighborhood;

            // Coordinates filter
            const hasCoordinates = !showWithCoordinates || 
                (restaurant.latitude && restaurant.longitude);

            return matchesSearch && matchesNeighborhood && hasCoordinates;
        });

        this.renderRestaurantList();
        this.addMarkersToMap();
        this.updateStats();
    }

    renderRestaurantList() {
        const container = document.getElementById('restaurantList');
        
        if (this.filteredData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No restaurants found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredData.map(restaurant => `
            <div class="restaurant-card ${restaurant.latitude && restaurant.longitude ? 'has-location' : ''}" 
                 data-id="${restaurant.restaurantName}">
                <div class="map-indicator"></div>
                <div class="restaurant-name">${restaurant.restaurantName}</div>
                <div class="neighborhood">${restaurant.neighborhood}</div>
                <div class="burger-name">${restaurant.burgerName}</div>
                ${restaurant.description ? `<div class="description">${restaurant.description}</div>` : ''}
            </div>
        `).join('');

        // Add click listeners to restaurant cards
        container.querySelectorAll('.restaurant-card').forEach(card => {
            card.addEventListener('click', () => {
                const restaurantName = card.dataset.id;
                const restaurant = this.filteredData.find(r => r.restaurantName === restaurantName);
                this.selectRestaurant(restaurant);
            });
        });
    }

    selectRestaurant(restaurant) {
        // Remove previous selection
        document.querySelectorAll('.restaurant-card').forEach(card => {
            card.classList.remove('active');
        });

        // Highlight selected restaurant
        const selectedCard = document.querySelector(`[data-id="${restaurant.restaurantName}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Pan to marker if it exists
        if (restaurant.latitude && restaurant.longitude) {
            this.map.setView([restaurant.latitude, restaurant.longitude], 16);
        }

        // Show modal with details
        this.showModal(restaurant);
    }

    showModal(restaurant) {
        const modal = document.getElementById('restaurantModal');
        const content = document.getElementById('modalContent');
        
        content.innerHTML = `
            <h2>${restaurant.restaurantName}</h2>
            <h3>${restaurant.burgerName}</h3>
            <p><strong>Neighborhood:</strong> ${restaurant.neighborhood}</p>
            
            ${restaurant.description ? `
                <div>
                    <h4>Description</h4>
                    <p>${restaurant.description}</p>
                </div>
            ` : ''}
            
            ${restaurant.address ? `
                <div>
                    <h4>Address</h4>
                    <div class="address">${restaurant.address}</div>
                </div>
            ` : ''}
            
            ${restaurant.hours ? `
                <div>
                    <h4>Hours</h4>
                    <div class="hours">${restaurant.hours}</div>
                </div>
            ` : ''}
            
            ${restaurant.burgerUrl ? `
                <div style="margin-top: 1rem;">
                    <a href="${restaurant.burgerUrl}" target="_blank" style="color: #dc2626; text-decoration: none; font-weight: 600;">
                        View Details on EverOut →
                    </a>
                </div>
            ` : ''}
        `;
        
        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('restaurantModal');
        modal.style.display = 'none';
    }

    toggleMapLayer() {
        const button = document.getElementById('toggleSatellite');
        
        if (this.isStreetView) {
            this.map.removeLayer(this.streetLayer);
            this.map.addLayer(this.satelliteLayer);
            button.textContent = 'Street';
            this.isStreetView = false;
        } else {
            this.map.removeLayer(this.satelliteLayer);
            this.map.addLayer(this.streetLayer);
            button.textContent = 'Satellite';
            this.isStreetView = true;
        }
    }

    updateStats() {
        const totalElement = document.getElementById('totalCount');
        const geocodedCount = this.filteredData.filter(r => r.latitude && r.longitude).length;
        
        totalElement.textContent = `${this.filteredData.length}`;
        
        if (geocodedCount < this.filteredData.length) {
            totalElement.textContent += ` (${geocodedCount} mapped)`;
        }
    }

    showError(message) {
        const container = document.getElementById('restaurantList');
        container.innerHTML = `
            <div class="empty-state">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BurgerWeekMap();
});
