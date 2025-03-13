
            
// search=====================
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('q');
    const searchResults = document.getElementById('search-results');
    const mainContentElements = document.querySelectorAll('main.main > *:not(#search-results)');
    const footer = document.querySelector('footer');
    const searchResultsContainer = document.getElementById('search-results-container');
    let searchTimeout;

    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    const performSearch = debounce(function(searchTerm) {
        if (searchTerm.length === 0) {
            searchResults.style.display = 'none';
            mainContentElements.forEach(element => {
                element.style.display = '';
            });
            if (footer) footer.style.display = 'block';
            return;
        }

        fetch(`/search-products?q=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                // Hide main content and show search results
                mainContentElements.forEach(element => {
                    if (element !== searchResults) {
                        element.style.display = 'none';
                    }
                });
                if (footer) footer.style.display = 'none';
                searchResults.style.display = 'block';
                
                // Clear previous results
                searchResultsContainer.innerHTML = '';

                if (data.products && data.products.length > 0) {
                    data.products.forEach((product, index) => {
                        const originalPrice = parseFloat(product.price.replace(/,/g, '')) || 0;
                        const discountMatch = product.offer ? product.offer.match(/\d+/) : null;
                        const discountPercentage = discountMatch ? parseFloat(discountMatch[0]) : 0;
                        const discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);

                        const productCard = `
                            <div class="col-6 col-md-4 col-lg-3 mb-4">
                                <div class="product product-2">
                                    <figure class="product-media">
                                        <a href="/productview/${product._id}">
                                            <img src="/uploads/${product.image[0]}" 
                                                alt="${product.productname}" 
                                                class="product-image"
                                                onerror="this.onerror=null; this.src='/images/profile.avif';">
                                        </a>
                                        <div class="product-action-vertical">
                                            <form action="/wishlist?productId=${product._id}" method="post">
                                                <button type="submit" class="btn-product-icon btn-wishlist" title="Add to wishlist"></button>
                                            </form>
                                        </div>
                                        <div class="product-action">
                                            <form action="/cart" method="post">
                                                <input type="hidden" name="productId" value="${product._id}">
                                                <input type="hidden" name="quantity" value="1">
                                                <input type="hidden" name="stock" value="${product.stock}">
                                                <button type="submit" class="btn-product btn-cart" style="width: 225px; border: none;">
                                                    <span>Add to Cart</span>
                                                </button>
                                            </form>
                                        </div>
                                    </figure>
                                    <div class="product-body">
                                        <div class="product-cat">
                                            <a href="#">${product.category}</a>
                                        </div>
                                        <h3 class="product-title">
                                            <a href="/productview/${product._id}">${product.productname}</a>
                                        </h3>
                                        <div class="product-price">
                                            <span class="original-price">₹${product.price}</span>
                                            <span class="discounted-price">₹${Math.floor(discountedPrice)}</span>
                                        </div>
                                        <div class="product-offer">${product.offer} off</div>
                                    </div>
                                </div>
                            </div>
                        `;
                        searchResultsContainer.insertAdjacentHTML('beforeend', productCard);
                    });
                } else {
                    searchResultsContainer.innerHTML = `
                        <div class="col-12 text-center">
                            <p>No products found matching "${searchTerm}"</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                searchResultsContainer.innerHTML = `
                    <div class="col-12 text-center">
                        <p>Error searching for products. Please try again.</p>
                    </div>
                `;
            });
    }, 1000); // 

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            performSearch(searchTerm);
        });
    }

    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            performSearch(searchTerm);
        });
    }




    const message = document.getElementById("cartlimit").textContent.trim();
    
    if (message) {
        const popup = document.getElementById("cartlimit");
        popup.classList.add("show"); 

    
        setTimeout(() => {
            popup.classList.remove("show"); 
        }, 1000);
    }




});
    // ============================================  
    
    


    

    document.addEventListener('DOMContentLoaded', function() {
        const searchTrigger = document.getElementById('mobileSearchTrigger');
        const searchModal = document.getElementById('mobileSearchModal');
        const searchClose = document.getElementById('mobileSearchClose');
        const searchInput = document.querySelector('.mobile-search-input');
        const searchForm = document.querySelector('.mobile-search-form');
        const searchResultsContainer = document.getElementById('mobile-search-results-container');

        // Debounce function
        function debounce(func, delay) {
            let timeoutId;
            return function (...args) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                }, delay);
            };
        }

        // Search function
        const performSearch = debounce(function(searchTerm) {
            if (searchTerm.length === 0) {
                searchResultsContainer.innerHTML = '';
                return;
            }

            // Add loading indicator
            searchResultsContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

            fetch(`/search-products?q=${encodeURIComponent(searchTerm)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.products && data.products.length > 0) {
                        searchResultsContainer.innerHTML = '';
                        data.products.forEach(product => {
                            const originalPrice = parseFloat(product.price.replace(/,/g, '')) || 0;
                            const discountMatch = product.offer ? product.offer.match(/\d+/) : null;
                            const discountPercentage = discountMatch ? parseFloat(discountMatch[0]) : 0;
                            const discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);

                            const productCard = `
                                <div class="col-6 mb-3">
                                    <div class="product-card">
                                        <a href="/productview/${product._id}">
                                            <img src="/uploads/${product.image[0]}" 
                                                alt="${product.productname}" 
                                                class="product-image">
                                        </a>
                                        <div class="product-details">
                                            <h3 class="product-title">${product.productname}</h3>
                                            <div class="product-price">
                                                <span class="original-price">₹${product.price}</span>
                                                <span class="discounted-price">₹${Math.floor(discountedPrice)}</span>
                                            </div>
                                            <div class="product-offer">${product.offer} off</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                            searchResultsContainer.insertAdjacentHTML('beforeend', productCard);
                        });
                    } else {
                        searchResultsContainer.innerHTML = `
                            <div class="col-12 text-center">
                                <p>No products found matching "${searchTerm}"</p>
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Search error:', error);
                    searchResultsContainer.innerHTML = `
                        <div class="col-12 text-center">
                            <p>Error searching for products. Please try again.</p>
                        </div>
                    `;
                });
        }, 500);

        // Input event listener for search
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            performSearch(searchTerm);
        });

        // Open search modal
        searchTrigger.addEventListener('click', function() {
            searchModal.classList.add('show');
            setTimeout(() => {
                searchInput.focus();
            }, 300);
        });

        // Close search modal
        searchClose.addEventListener('click', function() {
            searchModal.classList.remove('show');
            searchInput.value = ''; // Clear input on close
            searchResultsContainer.innerHTML = ''; // Clear results
        });

        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchModal.classList.contains('show')) {
                searchModal.classList.remove('show');
                searchInput.value = ''; // Clear input on close
                searchResultsContainer.innerHTML = ''; // Clear results
            }
        });
    });
