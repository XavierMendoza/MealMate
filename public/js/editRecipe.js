document.getElementById("editRecipeForm").addEventListener("submit", function(e) {

    const name = document.querySelector("input[name='name']").value.trim();
    const ingredients = document.querySelector("textarea[name='ingredients']").value.trim();
    const calories = document.querySelector("input[name='calories']").value.trim();
    const category = document.querySelector("select[name='category']").value.trim();

    if (!name || !ingredients || !calories || !category) {
        e.preventDefault();
        alert("Error: All fields must be filled out.");
        return;
    }

    if (isNaN(calories) || calories <= 0) {
        e.preventDefault();
        alert("Calories must be a valid number greater than 0.");
        return;
    }
});