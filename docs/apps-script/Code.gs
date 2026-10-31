// Acervo DHIS: devolve os vídeos da planilha em JSON para o site.
const SHEET_NAME = 'SITE';          // aba preferida; se não existir, usa a primeira com cabeçalho NOME + LINK
const CACHE_SECONDS = 300;

function doGet() {
  const cache = CacheService.getScriptCache();
  let json = cache.get('videos');
  if (!json) {
    json = JSON.stringify({ generated: new Date().toISOString(), videos: buildVideos() });
    if (json.length < 90000) cache.put('videos', json, CACHE_SECONDS);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

const clean = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const key = s => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const multi = s => clean(s).split(',').map(clean).filter(Boolean);
const slugify = s => key(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video';

function youtubeId(url) {
  const m = String(url).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function findSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const named = ss.getSheetByName(SHEET_NAME);
  if (named) return named;
  return ss.getSheets().find(sh => {
    const head = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(key);
    return head.includes('NOME') && head.includes('LINK');
  });
}

function buildVideos() {
  const sheet = findSheet();
  if (!sheet) throw new Error('Aba com cabeçalho NOME e LINK não encontrada');
  const [head, ...rows] = sheet.getDataRange().getValues();
  const col = Object.fromEntries(head.map((h, i) => [key(h), i]));
  const get = (row, name) => (name in col ? row[col[name]] : '');
  const seen = new Set(), slugs = new Set(), videos = [];

  for (const row of rows) {
    if (col.PUBLICAR !== undefined && key(get(row, 'PUBLICAR')) !== 'SIM') continue;
    const title = clean(get(row, 'NOME')), url = clean(get(row, 'LINK')), id = youtubeId(url);
    if (!title || !id || seen.has(id)) continue;
    seen.add(id);
    let slug = slugify(title), n = 2;
    while (slugs.has(slug)) slug = slugify(title) + '-' + n++;
    slugs.add(slug);
    const ano = parseInt(clean(get(row, 'ANO')), 10);
    videos.push({
      id, date: null, slug, status: 'publish', type: 'video', link: '/videos/' + slug + '/',
      title: { rendered: title }, content: { rendered: '', protected: false }, meta: { video_url: url },
      projeto: multi(get(row, 'PROJETO')), conteudo: multi(get(row, 'CONTEUDO')),
      local: multi(get(row, 'LOCAL')), tema: multi(get(row, 'TEMA')), tipo: multi(get(row, 'TIPO')),
      ano: isNaN(ano) ? null : ano, parceiros: multi(get(row, 'PARCEIROS')),
    });
  }
  return videos;
}
