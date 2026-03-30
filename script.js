function searchBooks() {
    let query = document.getElementById("searchInput").value;
    let resultsDiv = document.getElementById("results");
    let loading = document.getElementById("loading");

    if (!query) {
        alert("Enter something!");
        return;
    }

    resultsDiv.innerHTML = "";
    loading.style.display = "block";

    fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`)
        .then(response => response.json())
        .then(data => {
            loading.style.display = "none";

            if (!data.items) {
                resultsDiv.innerHTML = "<p>No results found</p>";
                return;
            }

            displayBooks(data.items);
        })
        .catch(error => {
            loading.innerText = "Error fetching data";
        });
}

function displayBooks(books) {
    let resultsDiv = document.getElementById("results");

    books.forEach(book => {
        let info = book.volumeInfo;

        let div = document.createElement("div");
        div.classList.add("book");

        div.innerHTML = `
            <img src="${info.imageLinks ? info.imageLinks.thumbnail : ''}">
            <h3>${info.title}</h3>
            <p>${info.authors ? info.authors.join(", ") : "Unknown Author"}</p>
        `;

        resultsDiv.appendChild(div);
    });
}
