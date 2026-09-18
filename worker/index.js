export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // REGISTER
    // =========================
    if (url.pathname === "/api/register" && request.method === "POST") {
      try {
        const { username, password } = await request.json();

        if (!username || !password) {
          return Response.json({
            success: false,
            message: "Username dan password wajib diisi"
          });
        }

        if (username.length < 3 || password.length < 4) {
          return Response.json({
            success: false,
            message: "Username minimal 3 karakter dan password minimal 4 karakter"
          });
        }

        const existing = await env.DB
          .prepare("SELECT id FROM users WHERE username = ?")
          .bind(username)
          .first();

        if (existing) {
          return Response.json({
            success: false,
            message: "Username sudah digunakan"
          });
        }

        await env.DB
          .prepare(
            "INSERT INTO users (username, password) VALUES (?, ?)"
          )
          .bind(username, password)
          .run();

        return Response.json({
          success: true,
          message: "Akun berhasil dibuat"
        });

      } catch (error) {
        return Response.json({
          success: false,
          message: "Gagal membuat akun"
        }, { status: 500 });
      }
    }

    // =========================
    // LOGIN
    // =========================
    if (url.pathname === "/api/login" && request.method === "POST") {
      try {
        const { username, password } = await request.json();

        if (!username || !password) {
          return Response.json({
            success: false,
            message: "Username dan password wajib diisi"
          });
        }

        const user = await env.DB
          .prepare(
            "SELECT id, username FROM users WHERE username = ? AND password = ?"
          )
          .bind(username, password)
          .first();

        if (!user) {
          return Response.json({
            success: false,
            message: "Username atau password salah"
          });
        }

        return Response.json({
          success: true,
          message: "Login berhasil",
          user: {
            id: user.id,
            username: user.username
          }
        });

      } catch (error) {
        return Response.json({
          success: false,
          message: "Gagal terhubung ke database"
        }, { status: 500 });
      }
    }

    // =========================
    // FILE PUBLIC
    // =========================
    return env.ASSETS.fetch(request);
  }
};
