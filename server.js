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

const prisma = new PrismaClient();
const jwtSecret =
  process.env.JWT_SECRET || "autoshine-jwt-secret-mude-em-producao";
const jwtExpiresIn = "7d";

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    jwtSecret,
    { expiresIn: jwtExpiresIn },
  );
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

// ── Cadastro ──
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { nome, email, cpf, telefone, senha } = req.body;

    if (!nome || !email || !cpf || !telefone || !senha) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    const existente = await prisma.usuario.findFirst({
      where: { OR: [{ email }, { cpf }] },
    });

    if (existente) {
      return res
        .status(409)
        .json({ error: "Já existe um cadastro com este email ou CPF." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, cpf, telefone, senha: senhaHash },
    });

    req.session.userId = usuario.id;
    const token = gerarToken(usuario);
    res.status(201).json({
      token,
      user: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    console.error("Erro no cadastro:", err);
    res.status(500).json({ error: "Erro interno ao criar conta." });
  }
});

// ── Login ──
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Informe email e senha." });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    req.session.userId = usuario.id;
    const token = gerarToken(usuario);
    res.json({
      token,
      user: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro interno ao fazer login." });
  }
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
