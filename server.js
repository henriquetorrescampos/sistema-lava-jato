const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const baseDir = __dirname;

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/auth/google/callback`;
const sessionSecret = process.env.SESSION_SECRET || 'autoshine-dev-session-secret';
const googleOAuthConfigured = Boolean(googleClientId && googleClientSecret);

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

if (googleOAuthConfigured) {
  passport.use(new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl
    },
    (_accessToken, _refreshToken, profile, done) => {
      const firstEmail = Array.isArray(profile.emails) && profile.emails[0] ? profile.emails[0].value : '';
      const user = {
        id: profile.id,
        name: profile.displayName || 'Usuario Google',
        email: firstEmail,
        provider: 'google'
      };
      done(null, user);
    }
  ));
}

app.get('/auth/google', (req, res, next) => {
  req.session.returnTo = typeof req.query.next === 'string' ? req.query.next : 'index.html';

  if (!googleOAuthConfigured) {
    res.redirect('/cadastro.html?mode=login&auth=google_not_configured');
    return;
  }

  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
  const returnTo = req.session.returnTo || 'index.html';
  delete req.session.returnTo;

  if (!googleOAuthConfigured) {
    res.redirect('/cadastro.html?mode=login&auth=google_not_configured');
    return;
  }

  passport.authenticate('google', { failureRedirect: '/cadastro.html?mode=login&auth=google_failed' })(req, res, () => {
    const user = req.user || {};
    const name = encodeURIComponent(user.name || 'Usuario Google');
    const email = encodeURIComponent(user.email || '');
    const next = encodeURIComponent(returnTo);
    res.redirect(`/cadastro.html?mode=login&auth=success&provider=google&name=${name}&email=${email}&next=${next}`);
  });
});

app.get('/auth/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }

    req.session.destroy(() => {
      res.redirect('/index.html');
    });
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = req.user || null;
  res.json({ authenticated: Boolean(user), user });
});

app.get('/api/auth/config', (_req, res) => {
  res.json({ googleOAuthConfigured });
});

app.use(express.static(baseDir));

app.get('/', (_req, res) => {
  res.sendFile(path.join(baseDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AutoShine ativo em http://localhost:${PORT}`);
  if (!googleOAuthConfigured) {
    console.log('OAuth Google desativado: configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env');
  }
});
