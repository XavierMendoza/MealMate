// ===============================
// Load Daily Quote
// ===============================
async function loadQuote() {
    const quoteElement = document.getElementById("quoteText");
    if (!quoteElement) return;

    try {
        const response = await fetch("https://dummyjson.com/quotes/random");
        const data = await response.json();
        quoteElement.textContent = data.quote;
    } catch (err) {
        quoteElement.textContent = "Could not load quote.";
    }
}

loadQuote();

// =======================================
// Recipe Search + Save Button
// =======================================
const searchBtn = document.getElementById("searchBtn");
const resultsBox = document.getElementById("searchResults");

if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
        const query = document.getElementById("searchInput").value.trim();
        if (!query) return alert("Please enter a search term.");

        const response = await fetch(`/recipes/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        resultsBox.innerHTML = "";

        if (!data.results || data.results.length === 0) {
            resultsBox.innerHTML = "<p>No recipes found.</p>";
            return;
        }

        data.results.forEach(item => {
            const card = document.createElement("div");
            card.className = "result-card";

            card.innerHTML = `
                <img src="${item.image}" class="result-img">
                <h4>${item.title}</h4>
                <button class="btn save-btn"
                    data-id="${item.id}"
                    data-title="${item.title}"
                    data-image="${item.image}">
                    Save to My Recipes
                </button>
            `;

            resultsBox.appendChild(card);
        });
    });
}

// =======================================
// SAVE SIMPLE RECIPE
// =======================================
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("save-btn")) {
        const { id, title, image } = e.target.dataset;

        const response = await fetch("/recipes/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_id: id,
                title,
                image
            })
        });

        const result = await response.json();

        alert(result.success ? "Recipe saved!" : "Error saving recipe.");
    }
});

// =======================================
// GET FULL DETAILS BUTTON
// =======================================
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("details-btn")) {
        const apiId = e.target.dataset.id;
        const localId = e.target.dataset.localId;

        const response = await fetch(`/recipes/details/${apiId}/${localId}`);
        const result = await response.json();

        if (result.success) {
            alert("Full details added! Refresh to see updates.");
        } else {
            alert("Error fetching details.");
        }
    }
});
