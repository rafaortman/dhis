import './style.css';
import { facets, loadVideos, filterVideos } from './data.js';
import { createGraph } from './graph.js';

const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const videos = await loadVideos();
const params = new URLSearchParams(location.search);
const state = { view: params.get('view') === 'network' ? 'network' : 'gallery', query: params.get('q') || '', filters: Object.fromEntries(facets.map(f => [f.key, params.get(f.key) || ''])), dimension: 'projeto' };
let graph;
document.querySelector('#app').innerHTML = `
  <a class="skip" href="#results">Pular para o acervo</a>
  <header class="header"><a href="./" aria-label="Acervo DHIS, início"><img class="logo" src="${import.meta.env.BASE_URL}dhis-logo.png" alt="DHIS — Laboratório de Design e histórias"></a><div class="header-right"><span>Laboratório de Design e histórias</span><a href="#about">Sobre o acervo <span aria-hidden="true">↗</span></a></div></header>
  <main>
    <section class="intro"><div><p class="eyebrow">MEMÓRIA, CULTURA E CONEXÕES</p><h1>Histórias que se encontram.</h1><p class="intro-copy">Explore o acervo audiovisual do DHIS. Percorra projetos, descubra relações<br class="desktop"> e conheça as pessoas e os lugares que fazem parte dessas histórias.</p></div><div class="archive-count"><strong>${String(videos.length).padStart(2, '0')}</strong><span>vídeos no acervo<br>múltiplos caminhos</span></div></section>
    <section class="explorer" aria-label="Explorar acervo">
      <div class="toolbar"><div class="view-switch" role="group" aria-label="Modo de visualização"><button data-view="gallery">▦ <span>Galeria</span></button><button data-view="network">⌘ <span>Em rede</span></button></div><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Buscar histórias, lugares, temas…" aria-label="Buscar no acervo" value="${escape(state.query)}"><kbd>/</kbd></label></div>
      <div class="filters">${facets.map(f => `<label><span>${f.label}</span><select data-facet="${f.key}" aria-label="Filtrar por ${f.label.toLowerCase()}"><option value="">${f.key === 'ano' ? 'Todos os anos' : 'Todos'}</option>${[...new Set(videos.flatMap(v => v[f.key]))].sort((a,b) => f.key === 'ano' ? Number(b)-Number(a) : a.localeCompare(b, 'pt-BR')).map(v => `<option value="${escape(v)}" ${state.filters[f.key] === v ? 'selected' : ''}>${escape(v)}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="results-bar"><p id="result-count" role="status" aria-live="polite"></p><button id="clear" class="text-button">Limpar filtros <span aria-hidden="true">×</span></button></div>
      <div id="active-filters" class="active-filters"></div>
      <div id="results" tabindex="-1"></div>
    </section>
    <section id="about" class="about"><p class="eyebrow">SOBRE O ACERVO</p><h2>Um acervo. Muitas relações.</h2><p>Vídeos de pesquisa, registros culturais e histórias de vida reunidos pelo laboratório DHIS. Explore pela galeria ou navegue em rede para descobrir como projetos, temas e lugares se conectam.</p></section>
  </main><footer><span>DHIS <span class="footer-dot">●</span> Design e histórias</span><span>Acervo audiovisual</span></footer>
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
  document.querySelectorAll('[data-view]').forEach(button => { const selected = button.dataset.view === state.view; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected); });
  document.querySelectorAll('[data-facet]').forEach(select => { select.value = state.filters[select.dataset.facet]; });
  document.querySelector('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'vídeo' : 'vídeos'}${filtered.length !== videos.length ? ` de ${videos.length}` : ''} · ${state.view === 'gallery' ? 'Explore as histórias do acervo' : 'Descubra o que conecta cada história'}`;
  document.querySelector('#clear').hidden = !state.query && !Object.values(state.filters).some(Boolean);
  document.querySelector('#active-filters').innerHTML = facets.filter(f => state.filters[f.key]).map(f => `<button data-remove="${f.key}">${f.label}: ${escape(state.filters[f.key])} <span aria-hidden="true">×</span></button>`).join('');
  const target = document.querySelector('#results');
  if (!filtered.length) target.innerHTML = '<div class="empty"><span>⌕</span><h2>Nenhuma história encontrada</h2><p>Experimente outro termo ou remova um dos filtros.</p><button id="empty-clear">Limpar busca e filtros</button></div>';
  else if (state.view === 'gallery') target.innerHTML = `<div class="gallery">${filtered.map((v, index) => `<button class="video-card" data-video="${v.id}" aria-label="Assistir: ${escape(v.title)}"><div class="thumbnail">${v.thumbnail ? `<img src="${v.thumbnail}" alt="" loading="${index < 6 ? 'eager' : 'lazy'}">` : ''}<span class="fallback">DHIS / ACERVO</span><span class="play" aria-hidden="true">▶</span><span class="year">${escape(v.ano.join(' · '))}</span></div><div class="card-info"><p class="card-project">${escape(v.projeto.join(' / '))}</p><h2>${escape(v.title)}</h2><p class="card-meta">${escape([v.conteudo[0], v.local[0]].filter(Boolean).join(' · '))}</p></div></button>`).join('')}</div>`;
  else {
    target.innerHTML = `<div class="network-shell"><div class="network-top"><label>Conectar por <select id="dimension">${[{key:'all', label:'Todos os metadados'}, ...facets].map(f => `<option value="${f.key}" ${state.dimension === f.key ? 'selected' : ''}>${f.label}</option>`).join('')}</select></label><p>Selecione um vídeo para assistir · Selecione um termo para filtrar</p></div><div id="graph" role="img" aria-label="Rede de vídeos conectados por metadados. Os mesmos vídeos estão disponíveis nos botões abaixo e na galeria."></div><div class="network-bottom"><div class="legend">${facets.filter(f => state.dimension === 'all' || state.dimension === f.key).map(f => `<span><i style="background:${f.color}"></i>${f.label}</span>`).join('')}<span class="network-note">Arraste para explorar</span></div><div class="zoom-controls"><button data-zoom="in" aria-label="Ampliar rede">+</button><button data-zoom="out" aria-label="Reduzir rede">−</button><button data-zoom="fit" aria-label="Enquadrar toda a rede">⛶</button></div></div></div><details class="network-access"><summary>Vídeos nesta rede (${filtered.length})</summary><div>${filtered.map(v => `<button data-video="${v.id}">${escape(v.title)}</button>`).join('')}</div></details>`;
    graph = createGraph(document.querySelector('#graph'), filtered, state.dimension, openVideo, (key, value) => { state.filters[key] = value; render(); });
    document.querySelector('#dimension').addEventListener('change', event => { state.dimension = event.target.value; render(); });
  }
  document.querySelectorAll('.thumbnail img').forEach(img => img.addEventListener('error', () => img.remove(), { once: true }));
  saveUrl();
}

const dialog = document.querySelector('#video-dialog');
function openVideo(id) {
  const video = videos.find(v => v.id === id);
  if (!video) return;
  document.querySelector('#video-content').innerHTML = `${video.youtubeId ? `<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${video.youtubeId}" title="${escape(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : '<div class="player unavailable">Reprodução indisponível para este endereço.</div>'}<div class="video-description"><p class="eyebrow">${escape(video.projeto.join(' / '))}</p><h2 id="video-title">${escape(video.title)}</h2><div class="video-tags">${facets.flatMap(f => video[f.key].map(value => `<button data-term-facet="${f.key}" data-term="${escape(value)}"><span>${f.label}</span>${escape(value)}</button>`)).join('')}</div>${video.youtubeId ? `<a class="youtube-link" href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank" rel="noopener noreferrer">Abrir no YouTube ↗</a>` : ''}</div>`;
  dialog.showModal();
  document.body.classList.add('modal-open');
}
dialog.addEventListener('close', () => { document.querySelector('#video-content').innerHTML = ''; document.body.classList.remove('modal-open'); });
dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());

function reset() { state.query = ''; Object.keys(state.filters).forEach(key => state.filters[key] = ''); document.querySelector('#search').value = ''; render(); }
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.view) { state.view = button.dataset.view; render(); }
  if (button.dataset.video) openVideo(button.dataset.video);
  if (button.dataset.remove) { state.filters[button.dataset.remove] = ''; render(); }
  if (button.id === 'clear' || button.id === 'empty-clear') reset();
  if (button.dataset.zoom === 'fit') graph?.fit();
  else if (button.dataset.zoom) graph?.zoom(button.dataset.zoom === 'in' ? 1.25 : 0.8);
  if (button.dataset.termFacet) { state.filters[button.dataset.termFacet] = button.dataset.term; dialog.close(); render(); }
});
document.querySelectorAll('[data-facet]').forEach(select => select.addEventListener('change', () => { state.filters[select.dataset.facet] = select.value; render(); }));
let searchTimer;
document.querySelector('#search').addEventListener('input', event => { state.query = event.target.value; clearTimeout(searchTimer); searchTimer = setTimeout(render, 180); });
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName) && !dialog.open) { event.preventDefault(); document.querySelector('#search').focus(); } });
render();
