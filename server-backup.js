const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3000;

const users = [];
const messages = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "by-denz-secret-2026",
        resave: false,
        saveUninitialized: false
    })
);

app.use(express.static("public"));
app.get("/u/:username", (req, res) => {
    res.sendFile(
        require("path").join(
            __dirname,
            "public",
            "profile.html"
        )
    );
});
function findUser(username) {
    return users.find(
        user => user.username === username
    );
}

/* REGISTER */

app.post("/api/register", async (req, res) => {

    const username =
        String(req.body.username || "")
            .trim()
            .toLowerCase();

    const password =
        String(req.body.password || "");

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username dan password wajib diisi."
        });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({
            success: false,
            message:
                "Username 3-20 karakter: huruf, angka, underscore."
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message:
                "Password minimal 6 karakter."
        });
    }

    if (findUser(username)) {
        return res.status(409).json({
            success: false,
            message: "Username sudah digunakan."
        });
    }

    const hash =
        await bcrypt.hash(password, 10);

    users.push({
        username,
        password: hash
    });

    res.json({
        success: true,
        message: "Akun berhasil dibuat."
    });
});

/* LOGIN */

app.post("/api/login", async (req, res) => {

    const username =
        String(req.body.username || "")
            .trim()
            .toLowerCase();

    const password =
        String(req.body.password || "");

    const user =
        findUser(username);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Username atau password salah."
        });
    }

    const valid =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Username atau password salah."
        });
    }

    req.session.username = username;

    res.json({
        success: true,
        username
    });
});

/* LOGOUT */

app.post("/api/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({
            success: true
        });

    });
});

/* CURRENT USER */

app.get("/api/me", (req, res) => {

    if (!req.session.username) {
        return res.json({
            loggedIn: false
        });
    }

    res.json({
        loggedIn: true,
        username: req.session.username
    });
});

/* SEND ANONYMOUS MESSAGE */

app.post("/api/message/:username", (req, res) => {

    const username =
        String(req.params.username)
            .toLowerCase();

    const user =
        findUser(username);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User tidak ditemukan."
        });
    }

    const message =
        String(req.body.message || "")
            .trim();

    if (!message) {
        return res.status(400).json({
            success: false,
            message: "Pesan kosong."
        });
    }

    if (message.length > 500) {
        return res.status(400).json({
            success: false,
            message: "Pesan terlalu panjang."
        });
    }

    messages.push({
        id: Date.now(),
        username,
        message,
        time: new Date().toLocaleString("id-ID")
    });

    res.json({
        success: true,
        message: "Pesan berhasil dikirim."
    });
});

/* INBOX */

app.get("/api/inbox", (req, res) => {

    if (!req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Silakan login."
        });
    }

    const inbox =
        messages.filter(
            item =>
                item.username ===
                req.session.username
        );

    res.json({
        success: true,
        messages: inbox
    });
});

/* PROFILE */

app.get("/api/profile/:username", (req, res) => {

    const username =
        String(req.params.username)
            .toLowerCase();

    if (!findUser(username)) {
        return res.status(404).json({
            success: false
        });
    }

    res.json({
        success: true,
        username
    });
});

/* START */

app.listen(PORT, "127.0.0.1", () => {

    console.log("");
    console.log("=================================");
    console.log("       ⚡ BY DENZ NGL V2 ⚡");
    console.log("=================================");
    console.log("STATUS : ONLINE");
    console.log(
        "WEB    : http://127.0.0.1:" + PORT
    );
    console.log("=================================");
    console.log("");

});
