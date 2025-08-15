(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function t(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(s){if(s.ep)return;s.ep=!0;const o=t(s);fetch(s.href,o)}})();class y{constructor(){this.map=null,this.markers=[],this.burgerData=[],this.filteredData=[],this.selectedMarker=null,this.isStreetView=!0,this.init()}async init(){await this.loadData(),this.initMap(),this.setupEventListeners(),this.populateFilters(),this.renderRestaurantList(),this.updateStats()}async loadData(){try{const e=await fetch("/data/burgers.json");this.burgerData=await e.json(),this.filteredData=[...this.burgerData],console.log(`Loaded ${this.burgerData.length} restaurants`)}catch(e){console.error("Error loading burger data:",e),this.showError("Failed to load restaurant data. Please try again later.")}}initMap(){this.map=L.map("map").setView([45.5152,-122.6784],12),this.streetLayer=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(this.map),this.satelliteLayer=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"© Esri"}),this.addMarkersToMap()}addMarkersToMap(){this.markers.forEach(e=>this.map.removeLayer(e)),this.markers=[],this.filteredData.forEach((e,t)=>{if(e.latitude&&e.longitude){const i=L.marker([e.latitude,e.longitude]).bindPopup(this.createPopupContent(e)).on("click",()=>this.selectRestaurant(e));i.addTo(this.map),this.markers.push(i)}})}createPopupContent(e){return`
            <div>
                <div class="font-semibold text-gray-900 mb-1">${e.restaurantName}</div>
                <div class="text-red-600 font-medium mb-2">${e.burgerName}</div>
                <div class="text-sm text-gray-500">${e.neighborhood}</div>
            </div>
        `}setupEventListeners(){const e=document.getElementById("searchInput"),t=document.getElementById("clearSearch");e.addEventListener("input",i=>{this.filterData()}),t.addEventListener("click",()=>{e.value="",this.filterData()}),document.getElementById("neighborhoodFilter").addEventListener("change",()=>{this.filterData()}),document.getElementById("showOpenNow").addEventListener("change",()=>{this.filterData()}),document.getElementById("resetView").addEventListener("click",()=>{this.map.setView([45.5152,-122.6784],12)}),document.getElementById("toggleSatellite").addEventListener("click",()=>{this.toggleMapLayer()}),document.getElementById("closeModal").addEventListener("click",()=>{this.closeModal()}),window.addEventListener("click",i=>{const s=document.getElementById("restaurantModal");i.target===s&&this.closeModal()})}populateFilters(){const e=[...new Set(this.burgerData.map(i=>i.neighborhood))].sort(),t=document.getElementById("neighborhoodFilter");e.forEach(i=>{const s=document.createElement("option");s.value=i,s.textContent=i,t.appendChild(s)})}filterData(){const e=document.getElementById("searchInput").value.toLowerCase(),t=document.getElementById("neighborhoodFilter").value,i=document.getElementById("showOpenNow").checked;this.filteredData=this.burgerData.filter(s=>{const o=!e||s.restaurantName.toLowerCase().includes(e)||s.burgerName.toLowerCase().includes(e)||s.neighborhood.toLowerCase().includes(e)||s.description&&s.description.toLowerCase().includes(e),r=!t||s.neighborhood===t,n=!i||this.isCurrentlyOpen(s);return o&&r&&n}),this.renderRestaurantList(),this.addMarkersToMap(),this.updateStats()}renderRestaurantList(){const e=document.getElementById("restaurantList");if(this.filteredData.length===0){e.innerHTML=`
                <div class="text-center py-12 px-4 text-gray-500">
                    <h3 class="mb-2 text-gray-600">No restaurants found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;return}e.innerHTML=this.filteredData.map(t=>`
            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 cursor-pointer transition-all duration-200 hover:border-red-600 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md relative min-h-[80px] ${t.latitude&&t.longitude?"has-location":""}" 
                 data-id="${t.restaurantName}">
                <div class="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full ${t.latitude&&t.longitude?"block":"hidden"}"></div>
                <div class="font-semibold text-gray-900 mb-1">${t.restaurantName}</div>
                <div class="text-sm text-gray-500 mb-2">${t.neighborhood}</div>
                <div class="text-red-600 font-medium mb-2">${t.burgerName}</div>
                ${t.description?`<div class="text-sm text-gray-600 leading-relaxed line-clamp-2">${t.description}</div>`:""}
            </div>
        `).join(""),e.querySelectorAll("[data-id]").forEach(t=>{t.addEventListener("click",()=>{const i=t.dataset.id,s=this.filteredData.find(o=>o.restaurantName===i);this.selectRestaurant(s)})})}isCurrentlyOpen(e){if(!e.hours)return!1;const t=new Date,i=t.toLocaleDateString("en-US",{weekday:"short"}),s=t.getHours()*60+t.getMinutes();if(Array.isArray(e.hours)){const o=e.hours.find(r=>r.dayOfWeek&&r.dayOfWeek.toLowerCase()===i.toLowerCase());return o?this.isTimeInRange(s,o.hours):!1}else if(typeof e.hours=="string")return this.isTimeInRange(s,e.hours);return!1}isTimeInRange(e,t){if(!t)return!1;const i=/(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?\s*[-–—]\s*(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)/i,s=t.match(i);if(!s)return!1;const[,o,r="0",n,m,c="0",d]=s;let a=parseInt(o),l=parseInt(m);const g=r===""?0:parseInt(r),u=c===""?0:parseInt(c);n&&n.toLowerCase()==="pm"&&a!==12?a+=12:n&&n.toLowerCase()==="am"&&a===12?a=0:!n&&d&&d.toLowerCase()==="pm"&&a>=1&&a<=11&&(a+=12),d&&d.toLowerCase()==="pm"&&l!==12?l+=12:d&&d.toLowerCase()==="am"&&l===12&&(l=0);const p=a*60+g,f=l*60+u;return e>=p&&e<=f}selectRestaurant(e){document.querySelectorAll("[data-id]").forEach(i=>{i.classList.remove("ring-2","ring-red-500","bg-red-50")});const t=document.querySelector(`[data-id="${e.restaurantName}"]`);t&&(t.classList.add("ring-2","ring-red-500","bg-red-50"),t.scrollIntoView({behavior:"smooth",block:"center"})),e.latitude&&e.longitude&&this.map.setView([e.latitude,e.longitude],16),this.showModal(e)}showModal(e){const t=document.getElementById("restaurantModal"),i=document.getElementById("modalContent");let s="";e.hours&&(Array.isArray(e.hours)&&e.hours.length>0?s=`
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-3">Hours</h4>
                        <div class="bg-yellow-50 p-4 rounded-lg">
                            ${e.hours.map(o=>`
                                <div class="flex justify-between items-center py-2 border-b border-yellow-200 last:border-b-0">
                                    <span class="font-semibold text-yellow-800">${o.dayOfWeek} ${o.date}</span>
                                    <span class="text-yellow-900">${o.hours}</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `:typeof e.hours=="string"&&e.hours.trim()&&(s=`
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-3">Hours</h4>
                        <div class="bg-yellow-50 p-4 rounded-lg text-yellow-900">${e.hours}</div>
                    </div>
                `)),i.innerHTML=`
            <h2 class="text-2xl font-bold text-gray-900 mb-2">${e.restaurantName}</h2>
            <h3 class="text-xl text-red-600 font-semibold mb-4">${e.burgerName}</h3>
            <p class="mb-4"><strong class="text-gray-700">Neighborhood:</strong> <span class="text-gray-600">${e.neighborhood}</span></p>
            
            ${e.image?`
                <div class="mb-6 text-center">
                    <img src="${e.image}" alt="${e.burgerName}" class="max-w-full max-h-80 rounded-lg shadow-lg object-cover mx-auto" />
                </div>
            `:""}
            
            ${e.description?`
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                    <p class="text-gray-600 leading-relaxed">${e.description}</p>
                </div>
            `:""}
            
            ${e.address?`
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-3">Address</h4>
                    <div class="bg-gray-50 p-4 rounded-lg font-mono text-gray-800">${e.address}</div>
                </div>
            `:""}
            
            ${s}
            
            ${e.burgerUrl?`
                <div class="mt-6">
                    <a href="${e.burgerUrl}" target="_blank" class="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                        View Details on EverOut →
                    </a>
                </div>
            `:""}
        `,t.classList.remove("hidden")}closeModal(){document.getElementById("restaurantModal").classList.add("hidden")}toggleMapLayer(){const e=document.getElementById("toggleSatellite");this.isStreetView?(this.map.removeLayer(this.streetLayer),this.map.addLayer(this.satelliteLayer),e.textContent="Street",this.isStreetView=!1):(this.map.removeLayer(this.satelliteLayer),this.map.addLayer(this.streetLayer),e.textContent="Satellite",this.isStreetView=!0)}updateStats(){const e=document.getElementById("totalCount");this.filteredData.filter(t=>t.latitude&&t.longitude).length,e.textContent=`${this.filteredData.length}`}showError(e){const t=document.getElementById("restaurantList");t.innerHTML=`
            <div class="text-center py-12 px-4 text-gray-500">
                <h3 class="mb-2 text-red-600 font-semibold">Error</h3>
                <p>${e}</p>
            </div>
        `}}document.addEventListener("DOMContentLoaded",()=>{new y});
