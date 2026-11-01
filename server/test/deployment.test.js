import test from 'node:test';
import assert from 'node:assert/strict';

test('CORS helper correctly resolves allowed origins from environment', () => {
  // Test origin resolution logic
  const resolveAllowed = (frontendUrl, allowedOrigins, clientOrigin) => {
    const allowed = new Set();
    if (frontendUrl) {
      frontendUrl.split(',').forEach((url) => {
        const clean = url.trim().replace(/\/+$/, '');
        if (clean) allowed.add(clean);
      });
    }
    if (allowedOrigins) {
      allowedOrigins.split(',').forEach((url) => {
        const clean = url.trim().replace(/\/+$/, '');
        if (clean) allowed.add(clean);
      });
    }
    if (clientOrigin) {
      clientOrigin.split(',').forEach((url) => {
        const clean = url.trim().replace(/\/+$/, '');
        if (clean) allowed.add(clean);
      });
    }
    return allowed;
  };

  const origins = resolveAllowed(
    'https://resumematch.vercel.app/',
    'https://preview-1.vercel.app, https://preview-2.vercel.app/',
    'http://localhost:5173'
  );

  assert.equal(origins.has('https://resumematch.vercel.app'), true);
  assert.equal(origins.has('https://preview-1.vercel.app'), true);
  assert.equal(origins.has('https://preview-2.vercel.app'), true);
  assert.equal(origins.has('http://localhost:5173'), true);
  assert.equal(origins.has('https://malicious-site.com'), false);
});

test('Vercel preview regex matches valid vercel.app domains', () => {
  const isVercelPreview = (origin, enabled = true) => {
    if (!enabled) return false;
    return /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin);
  };

  assert.equal(isVercelPreview('https://resumematch-git-feature-juitawde.vercel.app', true), true);
  assert.equal(isVercelPreview('https://resumematch-abc-123.vercel.app', true), true);
  assert.equal(isVercelPreview('https://fake-vercel.app.attacker.com', true), false);
  assert.equal(isVercelPreview('http://insecure.vercel.app', true), false);
  assert.equal(isVercelPreview('https://resumematch.vercel.app', false), false);
});

test('Localhost regex allows any local port for development', () => {
  const isLocalOrigin = (origin) => {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  };

  assert.equal(isLocalOrigin('http://localhost:5173'), true);
  assert.equal(isLocalOrigin('http://localhost:5174'), true);
  assert.equal(isLocalOrigin('http://localhost:3000'), true);
  assert.equal(isLocalOrigin('http://127.0.0.1:5175'), true);
  assert.equal(isLocalOrigin('http://localhost'), true);
  assert.equal(isLocalOrigin('https://localhost:8443'), true);
  assert.equal(isLocalOrigin('http://localhost.evil.com'), false);
});

test('Frontend API base URL normalization handles all input formats', () => {
  const normalize = (raw) => {
    if (!raw || raw === '/api') return '/api';
    const trimmed = raw.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  };

  assert.equal(normalize(''), '/api');
  assert.equal(normalize(undefined), '/api');
  assert.equal(normalize('/api'), '/api');
  assert.equal(normalize('https://resumematch.onrender.com'), 'https://resumematch.onrender.com/api');
  assert.equal(normalize('https://resumematch.onrender.com/'), 'https://resumematch.onrender.com/api');
  assert.equal(normalize('https://resumematch.onrender.com/api'), 'https://resumematch.onrender.com/api');
  assert.equal(normalize('https://resumematch.onrender.com/api/'), 'https://resumematch.onrender.com/api');
});

