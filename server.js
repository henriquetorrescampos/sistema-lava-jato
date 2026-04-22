const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


dotenv.config();

let prisma;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error("Erro ao conectar ao banco de dados:", error);
  process.exit(1);
}
const jwtSecret =
  process.env.JWT_SECRET || "autoshine-jwt-secret-mude-em-producao";
const jwtExpiresIn = "15m"; // access token 15 min
const refreshTokenExpiresIn = "7d"; // refresh token 7 dias


function gerarAccessToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    jwtSecret,
    { expiresIn: jwtExpiresIn },
  );
}

function gerarRefreshToken() {
  return jwt.sign({}, jwtSecret, { expiresIn: refreshTokenExpiresIn });
}

const app = express();
const PORT = process.env.PORT || 3000;
const baseDir = __dirname;

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL ||
  `http://localhost:${PORT}/auth/google/callback`;
const sessionSecret =
  process.env.SESSION_SECRET || "autoshine-dev-session-secret";
const googleOAuthConfigured = Boolean(googleClientId && googleClientSecret);

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

if (googleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const firstEmail =
          Array.isArray(profile.emails) && profile.emails[0]
            ? profile.emails[0].value
            : "";
        const user = {
          id: profile.id,
          name: profile.displayName || "Usuario Google",
          email: firstEmail,
          provider: "google",
        };
        done(null, user);
      },
    ),
  );
}

app.get("/auth/google", (req, res, next) => {
  req.session.returnTo =
    typeof req.query.next === "string" ? req.query.next : "index.html";

  if (!googleOAuthConfigured) {
    res.redirect("/cadastro.html?mode=login&auth=google_not_configured");
    return;
  }

  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
});

app.get("/auth/google/callback", (req, res, next) => {
  const returnTo = req.session.returnTo || "index.html";
  delete req.session.returnTo;

  if (!googleOAuthConfigured) {
    res.redirect("/cadastro.html?mode=login&auth=google_not_configured");
    return;
  }

  passport.authenticate("google", {
    failureRedirect: "/cadastro.html?mode=login&auth=google_failed",
  })(req, res, () => {
    const user = req.user || {};
    const name = encodeURIComponent(user.name || "Usuario Google");
    const email = encodeURIComponent(user.email || "");
    const next = encodeURIComponent(returnTo);
    res.redirect(
      `/cadastro.html?mode=login&auth=success&provider=google&name=${name}&email=${email}&next=${next}`,
    );
  });
});

app.get("/auth/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }

    req.session.destroy(() => {
      res.redirect("/index.html");
    });
  });
});

app.get("/api/auth/me", (req, res) => {
  const user = req.user || null;
  res.json({ authenticated: Boolean(user), user });
});

app.get("/api/auth/config", (_req, res) => {
  res.json({ googleOAuthConfigured });
});
app.use(express.json());

// ── Registro ──
app.post("/api/register", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de email inválido." });
    }

    // Validar senha mínimo 8 caracteres
    if (senha.length < 8) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
    }

    // Verificar se email já existe
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return res.status(409).json({ error: "Email já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome: "", email, cpf: "", telefone: "", senha: senhaHash },
    });

    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (err) {
    console.error("Erro no registro:", err);
    res.status(500).json({ error: "Erro interno ao registrar." });
  }
});

// ── Login ──
app.post("/api/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Gerar access token (15min)
    const accessToken = gerarAccessToken(usuario);

    // Gerar refresh token (7 dias)
    const refreshToken = gerarRefreshToken();

    // Salvar refresh token no banco
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        usuarioId: usuario.id,
        expiresAt,
      },
    });

    // Criar sessão
    req.session.userId = usuario.id;

    res.json({
      accessToken,
      refreshToken,
      user: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro interno ao fazer login." });
  }
});

// ── Logout ──
app.post("/api/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token é obrigatório." });
    }

    // Remover refresh token do banco
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    // Destruir sessão
    req.session.destroy();

    res.json({ message: "Logout realizado com sucesso." });
  } catch (err) {
    console.error("Erro no logout:", err);
    res.status(500).json({ error: "Erro interno ao fazer logout." });
  }
});

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token é obrigatório." });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access token inválido." });
    }
    req.user = user;
    next();
  });
}

// ── Área Logada (exemplo) ──
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "Área protegida acessada.", user: req.user });
});
app.use(express.static(baseDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(baseDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`AutoShine ativo em http://localhost:${PORT}`);
  if (!googleOAuthConfigured) {
    console.log(
      "OAuth Google desativado: configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env",
    );
  }
});
