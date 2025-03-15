
    document.addEventListener('DOMContentLoaded', function() {
        const searchTrigger = document.getElementById('mobileSearchTrigger');
        const searchModal = document.getElementById('mobileSearchModal');
        const searchClose = document.getElementById('mobileSearchClose');
        const searchInput = document.querySelector('.mobile-search-input');
        const searchForm = document.querySelector('.mobile-search-form');
        const searchResultsContainer = document.getElementById('search-results-container');

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
        }, 1000); // 1 second delay

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
    
        
    document.addEventListener('DOMContentLoaded', function() {
        const mobileFilterBtn = document.getElementById('mobileFilterBtn');
        const sidebar = document.querySelector('.sidebar-shop');
        const overlay = document.getElementById('filterOverlay');

        // Toggle filters on mobile
        mobileFilterBtn.addEventListener('click', function() {
            sidebar.classList.add('show');
            overlay.classList.add('show');
        });

        // Close filters when clicking overlay
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });

        // Make search more mobile-friendly
        const searchForm = document.querySelector('.header-search form');
        const searchInput = document.querySelector('.header-search input');
        const searchButton = document.querySelector('.header-search .btn');

        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (searchInput.value.trim()) {
                this.submit();
            }
        });

        // Improve mobile scroll performance
        let timeout;
        window.addEventListener('scroll', function() {
            if (timeout) {
                window.cancelAnimationFrame(timeout);
            }
            timeout = window.requestAnimationFrame(function() {
                if (window.scrollY > 100) {
                    mobileFilterBtn.style.transform = 'scale(1)';
                } else {
                    mobileFilterBtn.style.transform = 'scale(0.8)';
                }
            });
        });
    });
  
    document.addEventListener('DOMContentLoaded', function() {
        const menuToggler = document.getElementById('mobileMenuToggler');
        const mobileMenu = document.querySelector('.mobile-menu-container');
        const menuClose = document.querySelector('.mobile-menu-close');
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        document.body.appendChild(overlay);

        // Toggle menu
        menuToggler.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            overlay.classList.toggle('active');
        });

        // Close menu
        menuClose.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);

        function closeMenu() {
            menuToggler.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            overlay.classList.remove('active');
        }

        // Handle submenu toggles
        const hasSubmenu = document.querySelectorAll('.mobile-menu li > ul');
        hasSubmenu.forEach(submenu => {
            const parent = submenu.parentElement;
            const link = parent.querySelector('a');
            
            link.addEventListener('click', function(e) {
                if (submenu) {
                    e.preventDefault();
                    parent.classList.toggle('open');
                    submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
                }
            });
        });
    });
 
    document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.querySelector('.header-search input');
        const searchForm = document.querySelector('.search-form');

        // Prevent default behaviors that might cause unwanted items
        searchInput.addEventListener('focus', function(e) {
            e.preventDefault();
            // Remove any unwanted classes that might be added by other scripts
            this.closest('.header-search-wrapper').className = 'header-search-wrapper';
        });

        // Clean input as user types
        searchInput.addEventListener('input', function(e) {
            // Remove any HTML tags if they're somehow entered
            this.value = this.value.replace(/<\/?[^>]+(>|$)/g, "");
        });

        // Handle form submission
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // Clean the search term
                searchInput.value = searchTerm.replace(/[^\w\s]/gi, '');
                this.submit();
            }
        });

        // Prevent unwanted dropdown or autocomplete
        searchInput.setAttribute('autocomplete', 'off');
        searchInput.setAttribute('data-lpignore', 'true');
    });
 
