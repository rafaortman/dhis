import './style.css';
import { facets, loadVideos, filterVideos } from './data.js';
import { createGraph } from './graph.js';
import { requireAccess } from './auth.js';

const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
await requireAccess();
const videos = await loadVideos();
const params = new URLSearchParams(location.search);
const state = { view: params.get('view') === 'network' ? 'network' : 'gallery', query: params.get('q') || '', filters: Object.fromEntries(facets.map(f => [f.key, params.get(f.key) || ''])), dimension: 'projeto', page: 0 };
const PAGE_SIZE = 8;
const mobile = matchMedia('(max-width: 599px)');
const pageSize = () => mobile.matches ? Infinity : PAGE_SIZE;
let graph;
document.querySelector('#app').innerHTML = `
  <a class="skip" href="#results">Pular para o acervo</a>
  <header class="header"><a href="./" aria-label="Acervo DHIS, início"><img class="logo" src="${import.meta.env.BASE_URL}dhis-logo.png" alt="DHIS — Laboratório de Design e histórias"></a><div class="busca"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Buscar..." aria-label="Buscar no acervo" value="${escape(state.query)}"></label><button id="toggle-filters" class="filters-toggle" aria-expanded="false" aria-controls="filters"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/></svg>Filtros <b id="filters-count"></b></button></div><div class="filters" id="filters" role="group" aria-label="Filtros">${facets.map(f => `<label><span>${f.label}</span><select data-facet="${f.key}" aria-label="Filtrar por ${f.label.toLowerCase()}"><option value="">${f.key === 'ano' ? 'Todos os anos' : 'Todos'}</option>${[...new Set(videos.flatMap(v => v[f.key]))].sort((a,b) => f.key === 'ano' ? Number(b)-Number(a) : a.localeCompare(b, 'pt-BR')).map(v => `<option value="${escape(v)}" ${state.filters[f.key] === v ? 'selected' : ''}>${escape(v)}</option>`).join('')}</select></label>`).join('')}</div><div class="view-switch" role="group" aria-label="Modo de visualização"><button data-view="gallery" aria-label="Galeria"><i aria-hidden="true">▦</i> <span>Galeria</span></button><button data-view="network" aria-label="Em rede"><i aria-hidden="true">⌘</i> <span>Em rede</span></button></div></header>
  <div class="layout">
    <main>
      <section class="explorer" aria-label="Explorar acervo"><div id="active-filters" class="active-filters"></div><div id="results" tabindex="-1"></div></section>
    </main>
  </div>
  <footer><div class="results-bar"><p id="result-count" role="status" aria-live="polite"></p><button id="clear" class="text-button">Limpar filtros <span aria-hidden="true">×</span></button></div><nav id="pagination" class="pagination" aria-label="Paginação do acervo"></nav></footer>
  <dialog id="video-dialog" aria-labelledby="video-title"><button class="close-dialog" aria-label="Fechar vídeo">×</button><div id="video-content"></div></dialog>`;

function saveUrl() {
  const next = new URLSearchParams();
  if (state.view === 'network') next.set('view', 'network');
  if (state.query) next.set('q', state.query);
  for (const [key, value] of Object.entries(state.filters)) if (value) next.set(key, value);
  history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
}

function render() {
  graph?.destroy(); graph = null;
  const filtered = filterVideos(videos, state.query, state.filters);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize()));
  state.page = Math.min(state.page, pages - 1);
  const visible = state.view === 'gallery' ? filtered.slice(state.page * pageSize(), (state.page + 1) * pageSize()) : filtered;
  const pagination = document.querySelector('#pagination');
  pagination.hidden = state.view !== 'gallery' || pages < 2;
  pagination.innerHTML = pagination.hidden ? '' : `<button data-page="${state.page - 1}" aria-label="Página anterior" ${state.page === 0 ? 'disabled' : ''}>‹</button>${Array.from({ length: pages }, (_, i) => `<button data-page="${i}" aria-label="Página ${i + 1}" ${i === state.page ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('')}<button data-page="${state.page + 1}" aria-label="Próxima página" ${state.page === pages - 1 ? 'disabled' : ''}>›</button>`;
  document.querySelectorAll('[data-view]').forEach(button => { const selected = button.dataset.view === state.view; button.hidden = selected; });
  document.querySelectorAll('[data-facet]').forEach(select => { select.value = state.filters[select.dataset.facet]; });
  document.querySelector('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'vídeo' : 'vídeos'}${filtered.length !== videos.length ? ` de ${videos.length}` : ''} · ${state.view === 'gallery' ? 'Explore as histórias do acervo' : 'Descubra o que conecta cada história'}`;
  const activeCount = Object.values(state.filters).filter(Boolean).length;
  document.querySelector('#filters-count').textContent = activeCount ? `(${activeCount})` : '';
  document.querySelector('#clear').hidden = !state.query && !Object.values(state.filters).some(Boolean);
  document.querySelector('#active-filters').innerHTML = facets.filter(f => state.filters[f.key]).map(f => `<button data-remove="${f.key}">${f.label}: ${escape(state.filters[f.key])} <span aria-hidden="true">×</span></button>`).join('');
  const target = document.querySelector('#results');
  if (!filtered.length) target.innerHTML = '<div class="empty"><span>⌕</span><h2>Nenhuma história encontrada</h2><p>Experimente outro termo ou remova um dos filtros.</p><button id="empty-clear">Limpar busca e filtros</button></div>';
  else if (state.view === 'gallery') target.innerHTML = `<div class="gallery">${visible.map((v, index) => `<button class="video-card" data-video="${v.id}" aria-label="Assistir: ${escape(v.title)}"><div class="thumbnail">${v.thumbnail ? `<img src="${v.thumbnail}" alt="" loading="${index < 6 ? 'eager' : 'lazy'}">` : ''}<span class="fallback">DHIS / ACERVO</span><span class="play" aria-hidden="true">▶</span><span class="year">${escape(v.ano.join(' · '))}</span></div><div class="card-info"><p class="card-project">${escape(v.projeto.join(' / '))}</p><h2>${escape(v.title)}</h2><p class="card-meta sr-only">${escape([v.conteudo[0], v.local[0]].filter(Boolean).join(' · '))}</p></div></button>`).join('')}</div>`;
  else {
    target.innerHTML = `<div class="network-shell"><div class="network-top"><label>Conectar por <select id="dimension">${[{key:'all', label:'Todos os metadados'}, ...facets].map(f => `<option value="${f.key}" ${state.dimension === f.key ? 'selected' : ''}>${f.label}</option>`).join('')}</select></label><p>Selecione um vídeo para assistir · Selecione um termo para filtrar</p></div><div id="graph" role="img" aria-label="Rede de vídeos conectados por metadados. Os mesmos vídeos estão disponíveis nos botões abaixo e na galeria."></div><div class="network-bottom"><div class="legend">${facets.filter(f => state.dimension === 'all' || state.dimension === f.key).map(f => `<span><i style="background:${f.color}"></i>${f.label}</span>`).join('')}<span class="network-note">Arraste para explorar</span></div><div class="zoom-controls"><button data-zoom="in" aria-label="Ampliar rede">+</button><button data-zoom="out" aria-label="Reduzir rede">−</button><button data-zoom="fit" aria-label="Enquadrar toda a rede">⛶</button></div></div></div><details class="network-access"><summary>Vídeos nesta rede (${filtered.length})</summary><div>${filtered.map(v => `<button data-video="${v.id}">${escape(v.title)}</button>`).join('')}</div></details>`;
    graph = createGraph(document.querySelector('#graph'), filtered, state.dimension, openVideo, (key, value) => { state.page = 0; state.filters[key] = value; render(); });
    document.querySelector('#dimension').addEventListener('change', event => { state.dimension = event.target.value; render(); });
  }
  document.querySelectorAll('.thumbnail img').forEach(img => img.addEventListener('error', () => img.remove(), { once: true }));
  saveUrl();
}

const dialog = document.querySelector('#video-dialog');
function openVideo(id) {
  const video = videos.find(v => v.id === id);
  if (!video) return;
  const metadata = facets.filter(f => video[f.key].length).map(f => `<div class="video-tag-group"><span>${f.label}</span><div class="video-tag-values">${video[f.key].map(value => `<button data-term-facet="${f.key}" data-term="${escape(value)}">${escape(value)}</button>`).join('')}</div></div>`).join('');
  document.querySelector('#video-content').innerHTML = `${video.youtubeId ? `<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${video.youtubeId}" title="${escape(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : '<div class="player unavailable">Reprodução indisponível para este endereço.</div>'}<div class="video-description"><p class="card-project">${escape(video.projeto.join(' / '))}</p><h2 id="video-title">${escape(video.title)}</h2><div class="video-tags">${metadata}</div></div>`;
  dialog.showModal();
  document.body.classList.add('modal-open');
}
dialog.addEventListener('close', () => { document.querySelector('#video-content').innerHTML = ''; document.body.classList.remove('modal-open'); });
dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());

function closeFilters() { document.querySelector('.header').classList.remove('filters-open'); document.querySelector('#toggle-filters').setAttribute('aria-expanded', 'false'); }
function reset() { state.page = 0; state.query = ''; Object.keys(state.filters).forEach(key => state.filters[key] = ''); document.querySelector('#search').value = ''; render(); }
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.id === 'toggle-filters') { const open = document.querySelector('.header').classList.toggle('filters-open'); button.setAttribute('aria-expanded', open); }
  if (button.dataset.page) { state.page = Number(button.dataset.page); render(); }
  if (button.dataset.view) { state.page = 0; state.view = button.dataset.view; render(); }
  if (button.dataset.video) openVideo(button.dataset.video);
  if (button.dataset.remove) { state.page = 0; state.filters[button.dataset.remove] = ''; render(); }
  if (button.id === 'clear' || button.id === 'empty-clear') reset();
  if (button.dataset.zoom === 'fit') graph?.fit();
  else if (button.dataset.zoom) graph?.zoom(button.dataset.zoom === 'in' ? 1.25 : 0.8);
  if (button.dataset.termFacet) { state.page = 0; state.filters[button.dataset.termFacet] = button.dataset.term; dialog.close(); render(); }
});
document.querySelectorAll('[data-facet]').forEach(select => select.addEventListener('change', () => { closeFilters(); state.page = 0; state.filters[select.dataset.facet] = select.value; render(); }));
let searchTimer;
document.querySelector('#search').addEventListener('input', event => { state.page = 0; state.query = event.target.value; clearTimeout(searchTimer); searchTimer = setTimeout(render, 180); });
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName) && !dialog.open) { event.preventDefault(); document.querySelector('#search').focus(); } });
mobile.addEventListener('change', render);
render();
