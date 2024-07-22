
async function fetchProperties() {
    try {

        const response = await fetch('/properties');
       
        if (!response.ok) {
            throw new Error('Failed to fetch properties');
        }
        const properties = await response.json();
        const propertyList = document.getElementById('propertyList');

        // Clear existing content
        propertyList.innerHTML = '';

        properties.forEach(property => {
            const card = `
                <li>
                    <div class="property-card ${property.booking === 'soldout' ? 'dimmed' : ''}">
                        <figure class="card-banner">
                            <img src="https://realestate-1-c2rw.onrender.com/uploads/${property.image_path}" width="800" height="533" loading="lazy" alt="${property.title}" class="img-cover">
                        </figure>
                        <button class="card-action-btn" aria-label="add to favourite">
                            <ion-icon name="heart" aria-hidden="true"></ion-icon>
                        </button>
                        <div class="card-content">
                            <h3 class="h3">
                                <a href="#" class="card-title">${property.title}</a>
                            </h3>
                            <ul class="card-list">
                                <li class="card-item">
                                    <div class="item-icon">
                                        <ion-icon name="cube-outline"></ion-icon>
                                    </div>
                                    <span class="item-text">${property.sqft} sqf</span>
                                </li>
                                <li class="card-item">
                                    <div class="item-icon">
                                        <ion-icon name="bed-outline"></ion-icon>
                                    </div>
                                    <span class="item-text">${property.beds} Beds</span>
                                </li>
                                <li class="card-item">
                                    <div class="item-icon">
                                        <ion-icon name="man-outline"></ion-icon>
                                    </div>
                                    <span class="item-text">${property.baths} Baths</span>
                                </li>
                            </ul>
                            <div class="card-meta">
                                <div>
                                    <span class="meta-title">Price</span>
                                    <span class="meta-text">$${property.rate}</span>
                                </div>
                                <div>
                                    <span class="meta-title">Rating</span>
                                    <span class="meta-text">
                                        <div class="rating-wrapper">
                                            ${generateStarIcons(property.rating)}
                                        </div>
                                        (${property.rating})
                                    </span>
                                </div>
                            </div>
                            <div class="booking-status">
                                <button class="btn ${property.booking === 'available' ? 'btn-success' : 'btn-danger'}">
                                    ${property.booking === 'available' ? 'Available' : 'Sold Out'}
                                </button>
                            </div>
                        </div>
                    </div>
                </li>
            `;
            propertyList.innerHTML += card;
        });
    } catch (error) {
        console.error('Error fetching properties:', error.message);
    }
}

// Function to generate star icons based on rating
function generateStarIcons(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const starIcons = [];
    for (let i = 0; i < fullStars; i++) {
        starIcons.push('<ion-icon name="star"></ion-icon>');
    }
    if (halfStar) {
        starIcons.push('<ion-icon name="star-half"></ion-icon>');
    }
    return starIcons.join('');
}

// Ensure fetchProperties is invoked after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    fetchProperties();
});
