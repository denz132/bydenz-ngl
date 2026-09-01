const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(
    __dirname,
    "data",
    "database.json"
);

function loadDB() {
    try {
        return JSON.parse(
            fs.readFileSync(
                DB_FILE,
                "utf8"
            )
        );
    } catch {
        return {
            users: [],
            messages: []
        };
    }
}

function saveDB(data) {
    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(data, null, 2)
    );
}

let database = loadDB();

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(
    session({
        secret: "BY-DENZ-SECRET-CHANGE-ME",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax"
        }
    })
);

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

function getUser(username) {
    return database.users.find(
        user =>
            user.username === username
    );
}

/* PROFILE */

app.get("/u/:username", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "profile.html"
        )
    );

});

/* REGISTER */

app.post("/api/register", async (req, res) => {

    const username =
        String(
            req.body.username || ""
        )
        .trim()
        .toLowerCase();

    const password =
        String(
            req.body.password || ""
        );

    if (
        !/^[a-z0-9_]{3,20}$/
        .test(username)
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Username 3-20 karakter."
        });

    }

    if (password.length < 6) {

        return res.status(400).json({
            success: false,
            message:
                "Password minimal 6 karakter."
        });

    }

    if (getUser(username)) {

        return res.status(409).json({
            success: false,
            message:
                "Username sudah digunakan."
        });

    }

    const hash =
        await bcrypt.hash(
            password,
            10
        );

    database.users.push({
        username: username,
        password: hash,
        createdAt:
            new Date().toISOString()
    });

    saveDB(database);

    res.json({
        success: true,
        message:
            "Akun berhasil dibuat."
    });

});

/* LOGIN */

app.post("/api/login", async (req, res) => {

    const username =
        String(
            req.body.username || ""
        )
        .trim()
        .toLowerCase();

    const password =
        String(
            req.body.password || ""
        );

    const user =
        getUser(username);

    if (!user) {

        return res.status(401).json({
            success: false,
            message:
                "Username atau password salah."
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
            message:
                "Username atau password salah."
        });

    }

    req.session.username =
        username;

    res.json({
        success: true,
        username: username
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
        username:
            req.session.username
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

/* SEND MESSAGE */

app.post(
    "/api/message/:username",
    (req, res) => {

        const username =
            String(
                req.params.username || ""
            )
            .trim()
            .toLowerCase();

        const user =
            getUser(username);

        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User tidak ditemukan."
            });

        }

        const message =
            String(
                req.body.message || ""
            ).trim();

        if (!message) {

            return res.status(400).json({
                success: false,
                message:
                    "Pesan kosong."
            });

        }

        if (message.length > 500) {

            return res.status(400).json({
                success: false,
                message:
                    "Maksimal 500 karakter."
            });

        }

        database.messages.push({

            id: Date.now(),

            username: username,

            message: message,

            createdAt:
                new Date().toISOString()

        });

        saveDB(database);

        console.log(
            "[+] Pesan masuk untuk @" +
            username
        );

        res.json({
            success: true,
            message:
                "Pesan berhasil dikirim."
        });

    }
);

/* INBOX */

app.get("/api/inbox", (req, res) => {

    if (!req.session.username) {

        return res.status(401).json({
            success: false,
            message:
                "Silakan login."
        });

    }

    const messages =
        database.messages
        .filter(
            item =>
                item.username ===
                req.session.username
        )
        .sort(
            (a, b) =>
                b.id - a.id
        )
        .map(item => ({

            id: item.id,

            message:
                item.message,

            time:
                new Date(
                    item.createdAt
                ).toLocaleString(
                    "id-ID"
                )

        }));

    res.json({
        success: true,
        messages: messages
    });

});

/* PROFILE CHECK */

app.get(
    "/api/profile/:username",
    (req, res) => {

        const username =
            String(
                req.params.username || ""
            )
            .trim()
            .toLowerCase();

        const user =
            getUser(username);

        if (!user) {

            return res.status(404).json({
                success: false
            });

        }

        res.json({
            success: true,
            username:
                user.username
        });

    }
);

/* SERVER */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "================================="
        );
        console.log(
            "       ⚡ BY DENZ NGL V4 ⚡"
        );
        console.log(
            "================================="
        );
        console.log(
            "DATABASE : JSON"
        );
        console.log(
            "STATUS   : ONLINE"
        );
        console.log(
            "WEB      : http://127.0.0.1:" +
            PORT
        );
        console.log(
            "================================="
        );
        console.log("");

    }
);
