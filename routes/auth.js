import express from "express";
const router = express.Router();

// REGISTER PAGE
router.get("/register", (req, res) => {
    res.render("register");
});

// HANDLE REGISTRATION
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render("register", { error: "All fields required" });
    }

    try {
        const pool = req.app.locals.pool;

        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (rows.length > 0) {
            return res.render("register", { error: "Username already taken" });
        }

        await pool.query(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            [username, password]
        );

        res.redirect("/login");
    } catch (error) {
        console.log(error);
        res.render("register", { error: "Registration failed" });
    }
});

// LOGIN PAGE
router.get("/login", (req, res) => {
    res.render("login");
});

// HANDLE LOGIN
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = req.app.locals.pool;

        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            [username, password]
        );

        if (rows.length === 0) {
            return res.render("login", { error: "Invalid login" });
        }

        req.session.user = {
            id: rows[0].id,
            username: rows[0].username
        };

        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.render("login", { error: "Login failed" });
    }
});

// LOGOUT
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

export default router;
