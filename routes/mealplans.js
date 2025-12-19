// ===============================================
// routes/mealplans.js
// MealMate - Meal Plan Routes
// ===============================================

import express from "express";
const router = express.Router();

// Middleware: Ensure user is logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
}

// ===============================================
// VIEW ALL MEAL PLANS
// ===============================================
router.get("/", requireLogin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        // Load meal plans joined with recipe names
        const [plans] = await pool.query(
            `SELECT meal_plans.*, recipes.name AS recipe_name
             FROM meal_plans
             JOIN recipes ON meal_plans.recipe_id = recipes.id
             WHERE meal_plans.user_id = ?
             ORDER BY day_of_week, meal_type`,
            [req.session.user.id]
        );

        // Load user's recipes for dropdown
        const [recipes] = await pool.query(
            "SELECT * FROM recipes WHERE user_id = ?",
            [req.session.user.id]
        );

        res.render("mealplans", {
            plans,
            recipes,
            username: req.session.user.username
        });

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Unable to load meal plans",
            username: req.session.user.username
        });
    }
});

// ===============================================
// ADD MEAL PLAN FORM
// ===============================================
router.get("/add", requireLogin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        // Load recipes for dropdown
        const [recipes] = await pool.query(
            "SELECT * FROM recipes WHERE user_id = ?",
            [req.session.user.id]
        );

        res.render("addMealPlan", {
            recipes,
            username: req.session.user.username
        });

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Unable to load add meal plan page",
            username: req.session.user.username
        });
    }
});

// ===============================================
// HANDLE ADD MEAL PLAN
// ===============================================
router.post("/add", requireLogin, async (req, res) => {
    const { recipe_id, day_of_week, meal_type } = req.body;

    try {
        const pool = req.app.locals.pool;

        await pool.query(
            `INSERT INTO meal_plans (user_id, recipe_id, day_of_week, meal_type)
             VALUES (?, ?, ?, ?)`,
            [req.session.user.id, recipe_id, day_of_week, meal_type]
        );

        res.redirect("/mealplans");

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Error adding meal plan",
            username: req.session.user.username
        });
    }
});

// ===============================================
// EDIT MEAL PLAN FORM
// ===============================================
router.get("/edit/:id", requireLogin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const id = req.params.id;

        const [planRows] = await pool.query(
            "SELECT * FROM meal_plans WHERE id = ? AND user_id = ?",
            [id, req.session.user.id]
        );

        if (planRows.length === 0) {
            return res.redirect("/mealplans");
        }

        const plan = planRows[0];

        const [recipes] = await pool.query(
            "SELECT * FROM recipes WHERE user_id = ?",
            [req.session.user.id]
        );

        res.render("editMealPlan", {
            plan,
            recipes,
            username: req.session.user.username
        });

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Unable to load edit form",
            username: req.session.user.username
        });
    }
});

// ===============================================
// HANDLE EDIT MEAL PLAN
// ===============================================
router.post("/edit/:id", requireLogin, async (req, res) => {
    const { recipe_id, day_of_week, meal_type } = req.body;

    try {
        const pool = req.app.locals.pool;

        await pool.query(
            `UPDATE meal_plans
             SET recipe_id = ?, day_of_week = ?, meal_type = ?
             WHERE id = ? AND user_id = ?`,
            [
                recipe_id,
                day_of_week,
                meal_type,
                req.params.id,
                req.session.user.id
            ]
        );

        res.redirect("/mealplans");

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Error updating meal plan",
            username: req.session.user.username
        });
    }
});

// ===============================================
// DELETE MEAL PLAN
// ===============================================
router.post("/delete/:id", requireLogin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        await pool.query(
            "DELETE FROM meal_plans WHERE id = ? AND user_id = ?",
            [req.params.id, req.session.user.id]
        );

        res.redirect("/mealplans");

    } catch (error) {
        console.log(error);
        res.render("error", {
            message: "Error deleting meal plan",
            username: req.session.user.username
        });
    }
});

export default router;
