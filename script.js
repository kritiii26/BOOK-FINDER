// ========================
// Application State
// ========================
let booksState = [];
let favorites = new Set();
let debounceTimer = null;

// ========================
// Load favorites from localStorage on page load
// ========================
(function loadFavorites() {
    var saved = localStorage.getItem("bookquest_favorites");
    if (saved) {
        try {
            var arr = JSON.parse(saved);
            arr.forEach(function (id) {
                favorites.add(id);
            });
        } catch (e) {
            // ignore parse errors
        }
    }

    // Load dark mode preference
    var darkPref = localStorage.getItem("bookquest_darkmode");
    if (darkPref === "true") {
        document.body.classList.add("dark-mode");
        var btn = document.getElementById("darkModeToggle");
        if (btn) btn.innerText = "☀️ Light Mode";
    }
})();

// ========================
// Save favorites to localStorage
// ========================
function saveFavorites() {
    var arr = [];
    favorites.forEach(function (id) {
        arr.push(id);
    });
    localStorage.setItem("bookquest_favorites", JSON.stringify(arr));
}

// ========================
// Simulate async delay (for loading state demonstration)
// ========================
function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

// ========================
// Main function to fetch books from Google Books API
// Uses async/await
// ========================
async function searchBooks() {
    var query = document.getElementById("searchInput").value.trim();
    var resultsDiv = document.getElementById("results");
    var loading = document.getElementById("loading");
    var resultsCount = document.getElementById("resultsCount");

    if (!query) {
        resultsCount.innerText = "";
        return;
    }

    // Show loading state
    resultsDiv.innerHTML = "";
    loading.style.display = "block";
    resultsCount.innerText = "";

    try {
        // Simulate slight delay for loading UX
        await delay(300);

        var response = await fetch(
            "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(query) + "&maxResults=20"
        );
        var data = await response.json();

        // Hide loading
        loading.style.display = "none";

        if (!data.items) {
            resultsDiv.innerHTML = '<p class="no-results">No books found. Try another search!</p>';
            booksState = [];
            resultsCount.innerText = "";
            return;
        }

        // Use map() to transform API data into a cleaner format
        booksState = data.items.map(function (item) {
            var info = item.volumeInfo;
            return {
                id: item.id,
                title: info.title || "Untitled",
                authors: info.authors || ["Unknown Author"],
                thumbnail:
                    info.imageLinks && info.imageLinks.thumbnail
                        ? info.imageLinks.thumbnail
                        : "https://via.placeholder.com/150x200?text=No+Image",
                categories: info.categories || [],
                description: info.description || "No description available.",
                isFavorite: favorites.has(item.id),
            };
        });

        renderBooks();
    } catch (error) {
        loading.style.display = "none";
        resultsDiv.innerHTML = '<p class="no-results">Error fetching data. Please try again.</p>';
        console.error("Fetch error:", error);
    }
}

// ========================
// Handle Search on Enter key press
// ========================
function handleSearch(event) {
    if (event.key === "Enter") {
        searchBooks();
    }
}

// ========================
// Debounce for filter input (using setTimeout)
// ========================
function handleFilterDebounced() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(function () {
        handleFilter();
    }, 300);
}

// ========================
// Main render pipeline: filter + sort combined
// Uses .filter() and .sort() — NO traditional loops
// ========================
function renderBooks() {
    var filterTerm = document.getElementById("filterInput").value.toLowerCase();
    var sortValue = document.getElementById("sortSelect").value;
    var categoryValue = document.getElementById("categoryFilter").value;
    var showFavOnly = document.getElementById("showFavoritesOnly").checked;

    // Step 1: Filter by text (title / author) using .filter()
    var processedBooks = booksState.filter(function (book) {
        var matchesText =
            book.title.toLowerCase().includes(filterTerm) ||
            book.authors.some(function (auth) {
                return auth.toLowerCase().includes(filterTerm);
            });
        return matchesText;
    });

    // Step 2: Filter by category using .filter()
    if (categoryValue !== "all") {
        processedBooks = processedBooks.filter(function (book) {
            return book.categories.some(function (cat) {
                return cat.toLowerCase().includes(categoryValue);
            });
        });
    }

    // Step 3: Filter favorites only using .filter()
    if (showFavOnly) {
        processedBooks = processedBooks.filter(function (book) {
            return favorites.has(book.id);
        });
    }

    // Step 4: Sort using .sort()
    if (sortValue !== "none") {
        processedBooks.sort(function (a, b) {
            var tA = a.title.toUpperCase().trim();
            var tB = b.title.toUpperCase().trim();
            if (sortValue === "asc") {
                return tA.localeCompare(tB);
            } else {
                return tB.localeCompare(tA);
            }
        });
    }

    // Step 5: Count using reduce()
    var favCount = processedBooks.reduce(function (count, book) {
        if (favorites.has(book.id)) {
            return count + 1;
        }
        return count;
    }, 0);

    // Update results count
    var resultsCount = document.getElementById("resultsCount");
    if (booksState.length > 0) {
        resultsCount.innerText =
            "Showing " + processedBooks.length + " of " + booksState.length + " books" +
            (favCount > 0 ? " (" + favCount + " favorited)" : "");
    }

    // Step 6: Render using map()
    displayBooks(processedBooks);
}

// ========================
// Renders the books array to the DOM using map()
// ========================
function displayBooks(books) {
    var resultsDiv = document.getElementById("results");

    if (books.length === 0 && booksState.length > 0) {
        resultsDiv.innerHTML = '<p class="no-results">No matching books found. Try adjusting your filters.</p>';
        return;
    }

    if (books.length === 0) {
        resultsDiv.innerHTML = "";
        return;
    }

    // Use map() to build HTML for each book card
    resultsDiv.innerHTML = books
        .map(function (book) {
            var isFav = favorites.has(book.id);
            var favBtnClass = isFav ? "favorite-btn active" : "favorite-btn";
            var favBtnText = isFav ? "❤️ Favorited" : "🤍 Favorite";

            // Truncate description to 100 chars
            var shortDesc = book.description;
            if (shortDesc.length > 100) {
                shortDesc = shortDesc.substring(0, 100) + "...";
            }

            // Show categories if available using map() + join()
            var categoryText = book.categories
                .map(function (cat) {
                    return cat;
                })
                .join(", ");
            if (!categoryText) {
                categoryText = "General";
            }

            return (
                '<div class="book-card" id="book-' + book.id + '">' +
                    '<div class="book-image">' +
                        '<img src="' + book.thumbnail + '" alt="' + book.title + '">' +
                    "</div>" +
                    '<div class="book-info">' +
                        '<h3 class="book-title">' + book.title + "</h3>" +
                        '<p class="book-author">' + book.authors.join(", ") + "</p>" +
                        '<p class="book-category">' + categoryText + "</p>" +
                        '<p class="book-description" id="desc-' + book.id + '">' + shortDesc + "</p>" +
                        '<div class="card-actions">' +
                            '<button class="' + favBtnClass + '" onclick="toggleFavorite(\'' + book.id + '\')">' +
                                favBtnText +
                            "</button>" +
                            '<button class="view-more-btn" onclick="toggleDescription(\'' + book.id + "', this)\">" +
                                "📖 View More" +
                            "</button>" +
                        "</div>" +
                    "</div>" +
                "</div>"
            );
        })
        .join("");
}

// ========================
// Handle filter change
// ========================
function handleFilter() {
    renderBooks();
}

// ========================
// Handle sort change
// ========================
function handleSort() {
    renderBooks();
}

// ========================
// Toggle Favorite state using Set
// ========================
function toggleFavorite(bookId) {
    if (favorites.has(bookId)) {
        favorites.delete(bookId);
    } else {
        favorites.add(bookId);
    }
    saveFavorites();
    renderBooks();
}

// ========================
// Toggle "View More" description visibility
// ========================
function toggleDescription(bookId, buttonEl) {
    var descEl = document.getElementById("desc-" + bookId);
    if (!descEl) return;

    if (descEl.classList.contains("visible")) {
        descEl.classList.remove("visible");
        buttonEl.innerText = "📖 View More";
    } else {
        descEl.classList.add("visible");
        buttonEl.innerText = "📕 View Less";
    }
}

// ========================
// Dark Mode Toggle with localStorage persistence
// ========================
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    var btn = document.getElementById("darkModeToggle");
    var isDark = document.body.classList.contains("dark-mode");
    btn.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    localStorage.setItem("bookquest_darkmode", isDark ? "true" : "false");
}
