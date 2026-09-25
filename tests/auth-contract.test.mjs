import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Lab account UI uses shared cookie SSO and preserves its local progress store', async () => {
  const [html, config, auth, app] = await Promise.all([
    read('../index.html'), read('../api-config.js'), read('../auth.js'), read('../app.js')
  ]);
  assert.match(html, /id="accountBtn"/);
  assert.match(html, /auth\.js\?v=1/);
  assert.match(config, /https:\/\/api\.lzdsg\.top/);
  assert.match(auth, /credentials:\s*'include'/);
  for (const route of ['/api/v1/auth/me', "'register' : 'login'", '/api/v1/auth/logout']) {
    assert.ok(auth.includes(route), `missing SSO route ${route}`);
  }
  assert.doesNotMatch(auth, /localStorage|sessionStorage|authorization\s*:/i);
  assert.match(app, /lzdsg-network-lab-v3/);
});

test('Lab re-checks the shared API session on focus', async () => {
  const auth = await read('../auth.js');
  assert.match(auth, /window\.addEventListener\('focus'/);
  assert.ok(auth.includes('/api/v1/auth/me'));
});
