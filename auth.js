const API_BASE = (() => {
  try {
    const configured = globalThis.LZDSG_CONFIG?.apiBaseUrl;
    const endpoint = new URL(configured);
    return endpoint.protocol === 'https:' ? endpoint.origin : '';
  } catch {
    return '';
  }
})();

const modal = document.querySelector('#modal');
const accountButton = document.querySelector('#accountBtn');
const modalTitle = document.querySelector('#modalTitle');
const modalCategory = document.querySelector('#modalCategory');
const modalBody = document.querySelector('#modalBody');
let currentUser = null;
let authMode = 'login';
let requestVersion = 0;

class AuthError extends Error {
  constructor(status) {
    super('Account request failed');
    this.status = status;
  }
}

const safeMessage = (error) => {
  if (error instanceof AuthError) {
    if (error.status === 401) return '邮箱或密码不正确，请重试。';
    if (error.status === 403) return '此来源暂不允许进行账号操作。';
    if (error.status === 409) return '用户名或邮箱已被使用。';
    if (error.status === 429) return '操作过于频繁，请稍后重试。';
    if (error.status >= 500) return '账号服务暂时不可用，请稍后重试。';
    if (error.status === 400) return '请检查填写的信息是否正确。';
  }
  return '暂时无法连接账号服务，请稍后重试。';
};

const request = async (path, { method = 'GET', body } = {}) => {
  if (!API_BASE) throw new Error('API is unavailable');
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      credentials: 'include',
      signal: AbortSignal.timeout(10_000)
    });
  } catch {
    throw new Error('Network request failed');
  }
  if (response.status === 204) return null;
  let payload = {};
  try { payload = await response.json(); } catch { /* Keep failures status-based. */ }
  if (!response.ok) throw new AuthError(response.status);
  return payload;
};

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const setUser = (user) => {
  currentUser = user;
  accountButton.textContent = user ? (user.displayName || user.username) : '账号';
  accountButton.title = user ? `已登录：${user.username}` : 'LZDSG 统一账号';
  accountButton.setAttribute('aria-label', user ? `已登录 ${user.username}，打开账号` : '登录 LZDSG 统一账号');
};

const setStatus = (message) => {
  const status = modalBody.querySelector('.account-status');
  if (status) status.textContent = message;
};

const renderPanel = (message = '登录后可在 LZDSG 项目间共享账号状态。') => {
  modalBody.replaceChildren();
  modalBody.append(element('p', 'account-status', message));
  if (currentUser) {
    const identity = element('div', 'account-identity');
    identity.append(element('strong', '', currentUser.displayName || currentUser.username));
    identity.append(element('span', '', currentUser.email));
    const logout = element('button', 'account-logout', '退出登录');
    logout.type = 'button';
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      try {
        await request('/api/v1/auth/logout', { method: 'POST' });
        setUser(null);
        renderPanel('已退出登录。');
      } catch (error) {
        if (error instanceof AuthError && error.status === 401) {
          setUser(null);
          renderPanel('登录状态已失效。');
        } else {
          logout.disabled = false;
          setStatus(safeMessage(error));
        }
      }
    });
    modalBody.append(identity, logout);
    return;
  }

  const tabs = element('div', 'account-tabs');
  const loginTab = element('button', '', '登录');
  const registerTab = element('button', '', '注册');
  loginTab.type = registerTab.type = 'button';
  loginTab.setAttribute('aria-pressed', String(authMode === 'login'));
  registerTab.setAttribute('aria-pressed', String(authMode === 'register'));
  loginTab.addEventListener('click', () => { authMode = 'login'; renderPanel(); });
  registerTab.addEventListener('click', () => { authMode = 'register'; renderPanel(); });
  tabs.append(loginTab, registerTab);

  const form = element('form', 'account-form');
  const username = element('input');
  username.name = 'username';
  username.autocomplete = 'username';
  username.minLength = 3;
  username.maxLength = 32;
  username.pattern = '[A-Za-z0-9_]+';
  username.required = authMode === 'register';
  const usernameLabel = element('label', '', '用户名');
  usernameLabel.hidden = authMode !== 'register';
  usernameLabel.append(username);

  const email = element('input');
  email.type = 'email';
  email.name = 'email';
  email.autocomplete = 'email';
  email.maxLength = 320;
  email.required = true;
  const emailLabel = element('label', '', '邮箱');
  emailLabel.append(email);

  const password = element('input');
  password.type = 'password';
  password.name = 'password';
  password.autocomplete = authMode === 'register' ? 'new-password' : 'current-password';
  password.minLength = authMode === 'register' ? 12 : 1;
  password.maxLength = 128;
  password.required = true;
  const passwordLabel = element('label', '', authMode === 'register' ? '密码（至少 12 位）' : '密码');
  passwordLabel.append(password);

  const error = element('p', 'account-error');
  error.setAttribute('role', 'alert');
  error.hidden = true;
  const submit = element('button', 'account-submit', authMode === 'register' ? '创建账号' : '登录');
  submit.type = 'submit';
  form.append(usernameLabel, emailLabel, passwordLabel, error, submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    error.hidden = true;
    const data = new FormData(form);
    const registering = authMode === 'register';
    let credentialsAccepted = false;
    const body = {
      email: String(data.get('email') || '').trim(),
      password: String(data.get('password') || '')
    };
    if (registering) body.username = String(data.get('username') || '').trim();
    try {
      await request(`/api/v1/auth/${registering ? 'register' : 'login'}`, { method: 'POST', body });
      credentialsAccepted = true;
      const result = await request('/api/v1/auth/me');
      setUser(result.user);
      renderPanel(registering ? '账号已创建并登录。' : '登录成功。');
    } catch (failure) {
      error.textContent = credentialsAccepted && failure instanceof AuthError && failure.status === 401
        ? '账号认证成功，但浏览器未保存共享登录状态。请检查 Cookie 设置后重试。'
        : safeMessage(failure);
      error.hidden = false;
      submit.disabled = false;
    } finally {
      password.value = '';
    }
  });
  modalBody.append(tabs, form);
};

const refreshSession = async () => {
  const version = ++requestVersion;
  try {
    const result = await request('/api/v1/auth/me');
    if (version !== requestVersion) return;
    setUser(result.user);
    if (modal.classList.contains('open')) renderPanel();
  } catch (error) {
    if (version !== requestVersion) return;
    if (error instanceof AuthError && error.status === 401) {
      setUser(null);
      if (modal.classList.contains('open')) renderPanel();
    } else if (modal.classList.contains('open')) {
      setStatus(safeMessage(error));
    }
  }
};

accountButton.addEventListener('click', async () => {
  modalTitle.textContent = 'LZDSG 统一账号';
  modalCategory.textContent = 'ACCOUNT / SSO';
  renderPanel(currentUser ? '正在确认登录状态…' : '正在检查登录状态…');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  await refreshSession();
});

window.addEventListener('focus', () => { void refreshSession(); });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void refreshSession();
});

void refreshSession();
