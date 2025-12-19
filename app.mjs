// ===============================================
// MealMate - app.js
// ===============================================

import 'dotenv/config'; // Load environment variables first
import express from "express";
import session from "express-session";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

// Import route files
import authRoutes from "./routes/auth.js";
import recipeRoutes from "./routes/recipes.js";
import mealPlanRoutes from "./routes/mealplans.js";

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===============================================
// MySQL Connection (LOCAL DEVELOPMENT)
// ===============================================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    connectionLimit: 10
});

app.locals.pool = pool;

// ===============================================
// Middleware
// ===============================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// EJS setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ===============================================
// Authentication Middleware
// ===============================================
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
}

// ===============================================
// Mount Routes
// ===============================================
app.use("/", authRoutes);
app.use("/recipes", requireLogin, recipeRoutes);
app.use("/mealplans", requireLogin, mealPlanRoutes);

// Homepage
app.get("/", requireLogin, (req, res) => {
    res.render("index", { username: req.session.user.username });
});

// 404 Page
app.use((req, res) => {
    res.status(404).render("error", {
        message: "Page not found",
        username: req.session.user ? req.session.user.username : null
    });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`MealMate server running on port ${PORT}`);
});
