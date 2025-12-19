import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// VIEW ALL RECIPES
router.get("/", async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const [recipes] = await pool.query("SELECT * FROM recipes ORDER BY created_at DESC");

        res.render("recipes", {
            recipes,
            userId: req.session.user.id,
            username: req.session.user.username
        });
    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Unable to load recipes",
            username: req.session.user?.username || null
        });
    }
});

// ADD RECIPE FORM
router.get("/add", (req, res) => {
    res.render("addRecipe", { username: req.session.user.username });
});

// HANDLE ADD RECIPE
router.post("/add", async (req, res) => {
    const { name, ingredients, calories, category, vegetarian } = req.body;

    // NEW VALIDATION
    if (calories === "") {
        return res.render("error", {
            message: "Calories cannot be empty.",
            username: req.session.user.username
        });
    }

    try {
        const pool = req.app.locals.pool;
        await pool.query(
            "INSERT INTO recipes (user_id, name, ingredients, calories, category, vegetarian) VALUES (?, ?, ?, ?, ?, ?)",
            [req.session.user.id, name, ingredients, calories, category, vegetarian ? 1 : 0]
        );
        res.redirect("/recipes");
    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Error adding recipe",
            username: req.session.user?.username || null
        });
    }
});

// EDIT FORM
router.get("/edit/:id", async (req, res) => {
    const recipeId = req.params.id;

    try {
        const pool = req.app.locals.pool;
        const [rows] = await pool.query(
            "SELECT * FROM recipes WHERE id = ? AND user_id = ?",
            [recipeId, req.session.user.id]
        );

        if (rows.length === 0) return res.redirect("/recipes");

        res.render("editRecipe", {
            recipe: rows[0],
            username: req.session.user.username
        });

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Unable to load edit form",
            username: req.session.user?.username || null
        });
    }
});

// HANDLE EDIT
router.post("/edit/:id", async (req, res) => {
    const recipeId = req.params.id;
    const { name, ingredients, calories, category, vegetarian } = req.body;

    if (calories === "") {
        return res.render("error", {
            message: "Calories cannot be empty.",
            username: req.session.user.username
        });
    }

    try {
        const pool = req.app.locals.pool;
        await pool.query(
            `UPDATE recipes SET name=?, ingredients=?, calories=?, category=?, vegetarian=? 
             WHERE id=? AND user_id=?`,
            [name, ingredients, calories, category, vegetarian ? 1 : 0, recipeId, req.session.user.id]
        );

        res.redirect("/recipes");

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Error updating recipe",
            username: req.session.user?.username || null
        });
    }
});

// DELETE
router.post("/delete/:id", async (req, res) => {
    const recipeId = req.params.id;

    try {
        const pool = req.app.locals.pool;
        await pool.query("DELETE FROM recipes WHERE id=? AND user_id=?", [
            recipeId,
            req.session.user.id
        ]);

        res.redirect("/recipes");

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Error deleting recipe",
            username: req.session.user?.username || null
        });
    }
});

// SPOONACULAR SEARCH
router.get("/search", async (req, res) => {
    const query = req.query.q || "chicken";
    const apiKey = "748ce26c87ce4cb593b33f70dbda41fa";

    try {
        const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(
            query
        )}&number=10&apiKey=${apiKey}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.log(error);
        res.json({ error: "API search failed" });
    }
});

// SIMPLE SAVE (title + image + api_id)
router.post("/save", async (req, res) => {
    const { api_id, title, image } = req.body;

    if (!api_id || !title) return res.status(400).json({ success: false });

    try {
        const pool = req.app.locals.pool;
        await pool.query(
            `INSERT INTO recipes (user_id, name, api_id, image_url) VALUES (?, ?, ?, ?)`,
            [req.session.user.id, title, api_id, image]
        );

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// GET FULL DETAILS BUTTON ENDPOINT
router.get("/details/:apiId/:localId", async (req, res) => {
    const { apiId, localId } = req.params;
    const apiKey = "748ce26c87ce4cb593b33f70dbda41fa";

    try {
        const url = `https://api.spoonacular.com/recipes/${apiId}/information?apiKey=${apiKey}&includeNutrition=true`;

        const response = await fetch(url);
        const data = await response.json();

        // ---------- FIXED CALORIE EXTRACTION ----------
        const nutrientList = data.nutrition?.nutrients || [];

        const calorieEntry =
            nutrientList.find(n => n.name.toLowerCase() === "calories") ||
            nutrientList.find(n => n.name.toLowerCase() === "energy") ||
            nutrientList.find(n => n.name.toLowerCase().includes("cal")) ||
            null;

        const calories = calorieEntry ? Math.round(calorieEntry.amount) : null;

        // ---------- INGREDIENT LIST ----------
        const ingredientsList =
            data.extendedIngredients?.map(i => i.original).join("\n") || null;

        // UPDATE DATABASE
        const pool = req.app.locals.pool;
        await pool.query(
            `UPDATE recipes SET ingredients=?, calories=? WHERE id=?`,
            [ingredientsList, calories, localId]
        );

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }
});

export default router;
