const PASSWORD_HASH = '65ede29a424d62280361d2d5b42c2ffe5205c5411e45f8afe55ef20af6a96896';
const ACCESS_KEY = 'dhis-access';

async function hash(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function requireAccess() {
  if (sessionStorage.getItem(ACCESS_KEY) === PASSWORD_HASH) return;

  document.body.classList.add('access-locked');
  document.querySelector('#app').innerHTML = `
    <main class="access-gate">
      <section class="access-card" aria-labelledby="access-title">
        <img src="${import.meta.env.BASE_URL}dhis-logo.png" alt="DHIS — Laboratório de Design e histórias">
        <p class="eyebrow">ACERVO AUDIOVISUAL</p>
        <h1 id="access-title">Acesso restrito</h1>
        <p>Digite a senha para explorar o acervo.</p>
        <form id="access-form">
          <label for="access-password">Senha</label>
          <div class="access-input"><input id="access-password" name="password" type="password" autocomplete="current-password" required autofocus><button type="submit">Entrar</button></div>
          <p id="access-error" class="access-error" role="alert" aria-live="polite"></p>
        </form>
      </section>
    </main>`;

  await new Promise(resolve => {
    document.querySelector('#access-form').addEventListener('submit', async event => {
      event.preventDefault();
      const input = document.querySelector('#access-password');
      const candidate = await hash(input.value);
      if (candidate === PASSWORD_HASH) {
        sessionStorage.setItem(ACCESS_KEY, PASSWORD_HASH);
        document.body.classList.remove('access-locked');
        resolve();
        return;
      }
      document.querySelector('#access-error').textContent = 'Senha incorreta. Tente novamente.';
      input.select();
      input.focus();
    });
  });
}
