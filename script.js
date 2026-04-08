let booksState = [];
let favorites = new Set();
let categoriesSet = new Set();

async function searchBooks() {
    const query = document.getElementById("searchInput").value.trim();
    const resultsDiv = document.getElementById("results");
    const loading = document.getElementById("loading");

    if (!query) return;

    resultsDiv.innerHTML = "";
    loading.style.display = "block";

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=20`);
        const data = await response.json();
        
        loading.style.display = "none";

        if (!data.items) {
            resultsDiv.innerHTML = "<p>No books found.</p>";
            booksState = [];
            return;
        }

        categoriesSet.clear();
        
        booksState = data.items.map(item => {
            const category = item.volumeInfo.categories ? item.volumeInfo.categories[0] : "Uncategorized";
            if (category) categoriesSet.add(category);
            
            return {
                id: item.id,
                title: item.volumeInfo.title || "Untitled",
                authors: item.volumeInfo.authors || ["Unknown Author"],
                thumbnail: item.volumeInfo.imageLinks?.thumbnail || "https://via.placeholder.com/150x200?text=No+Image",
                category: category
            };
        });

        populateCategories();
        renderBooks();
    } catch (error) {
        loading.innerText = "Error fetching data.";
        console.error("Fetch error:", error);
    }
}

function handleSearch(event) {
    if (event.key === "Enter") {
        searchBooks();
    }
}

function populateCategories() {
    const select = document.getElementById("categorySelect");
    select.innerHTML = '<option value="all">All Categories</option>';
    
    const sortedCategories = Array.from(categoriesSet).sort();
    
    sortedCategories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function renderBooks() {
    const filterTerm = document.getElementById("filterInput").value.toLowerCase();
    const sortValue = document.getElementById("sortSelect").value;
    const categoryValue = document.getElementById("categorySelect").value;
    const showFavorites = document.getElementById("favoritesCheckbox").checked;
    
    let processedBooks = booksState.filter(book => {
        const matchesText = book.title.toLowerCase().includes(filterTerm) || 
                            book.authors.some(auth => auth.toLowerCase().includes(filterTerm));
        const matchesCategory = categoryValue === "all" || book.category === categoryValue;
        const matchesFavorite = !showFavorites || favorites.has(book.id);
        
        return matchesText && matchesCategory && matchesFavorite;
    });

    if (sortValue !== "none") {
        processedBooks.sort((a, b) => {
            const tA = a.title.toUpperCase().trim();
            const tB = b.title.toUpperCase().trim();
            return sortValue === "asc" ? tA.localeCompare(tB) : tB.localeCompare(tA);
        });
    }

    displayBooks(processedBooks);
}

function displayBooks(books) {
    const resultsDiv = document.getElementById("results");
    
    if (books.length === 0 && booksState.length > 0) {
        resultsDiv.innerHTML = "<p>No matching books found.</p>";
        return;
    }

    resultsDiv.innerHTML = books.map(book => `
        <div class="book-card" id="book-${book.id}">
            <div class="book-image">
                <img src="${book.thumbnail}" alt="${book.title}">
            </div>
            <div class="book-info">
                <p class="book-category">${book.category}</p>
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.authors.join(", ")}</p>
                <button class="favorite-btn ${favorites.has(book.id) ? 'active' : ''}" onclick="toggleFavorite('${book.id}')">
                    ${favorites.has(book.id) ? '❤️ Favorited' : '🤍 Favorite'}
                </button>
            </div>
        </div>
    `).join("");
}

function handleFilter() { renderBooks(); }

function toggleFavorite(bookId) {
    if (favorites.has(bookId)) {
        favorites.delete(bookId);
    } else {
        favorites.add(bookId);
    }
    renderBooks();
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const btn = document.getElementById("darkModeToggle");
    btn.innerHTML = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
}
