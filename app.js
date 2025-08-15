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

        // Show open now filter
        document.getElementById('showOpenNow').addEventListener('change', () => {
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
        const showOpenNow = document.getElementById('showOpenNow').checked;

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

            // Open now filter
            const isOpenNow = !showOpenNow || this.isCurrentlyOpen(restaurant);

            return matchesSearch && matchesNeighborhood && isOpenNow;
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

    isCurrentlyOpen(restaurant) {
        if (!restaurant.hours) return false;

        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

        // Handle both array format and string format hours
        if (Array.isArray(restaurant.hours)) {
            // Find today's hours
            const todayHours = restaurant.hours.find(h => 
                h.dayOfWeek && h.dayOfWeek.toLowerCase() === currentDay.toLowerCase()
            );

            if (!todayHours) return false;

            return this.isTimeInRange(currentTime, todayHours.hours);
        } else if (typeof restaurant.hours === 'string') {
            // For string format, try to parse simple time ranges
            return this.isTimeInRange(currentTime, restaurant.hours);
        }

        return false;
    }

    isTimeInRange(currentTimeMinutes, hoursString) {
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

        // Check if current time is within range
        return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
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
        
        // Format hours for display
        let hoursDisplay = '';
        if (restaurant.hours) {
            if (Array.isArray(restaurant.hours) && restaurant.hours.length > 0) {
                hoursDisplay = `
                    <div>
                        <h4>Hours</h4>
                        <div class="hours-list">
                            ${restaurant.hours.map(h => `
                                <div class="hours-entry">
                                    <span class="day">${h.dayOfWeek} ${h.date}</span>
                                    <span class="time">${h.hours}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else if (typeof restaurant.hours === 'string' && restaurant.hours.trim()) {
                hoursDisplay = `
                    <div>
                        <h4>Hours</h4>
                        <div class="hours">${restaurant.hours}</div>
                    </div>
                `;
            }
        }
        
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
            
            ${hoursDisplay}
            
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
