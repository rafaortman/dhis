import source from '../data/videos.json' with { type: 'json' };

export const facets = [
  { key: 'projeto', label: 'Projeto', color: '#e89852' },
  { key: 'conteudo', label: 'Conteúdo', color: '#b49bd8' },
  { key: 'local', label: 'Local', color: '#74bfa6' },
  { key: 'tema', label: 'Tema', color: '#e3c668' },
  { key: 'tipo', label: 'Tipo', color: '#dd8995' },
  { key: 'ano', label: 'Ano', color: '#8eafe0' },
];

export function youtubeId(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    const id = host === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com', 'm.youtube.com'].includes(host) ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] : null;
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}

export function normalizeVideo(record) {
  const video = { id: String(record.id), title: record.title?.rendered || 'Vídeo sem título', url: record.meta?.video_url || '', slug: record.slug };
  for (const { key } of facets) video[key] = (Array.isArray(record[key]) ? record[key] : [record[key]]).filter(v => v != null && v !== '').map(String);
  video.youtubeId = youtubeId(video.url);
  video.thumbnail = video.youtubeId ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg` : '';
  return video;
}

// A futura integração REST deve resolver IDs de taxonomias antes de normalizar.
export async function loadVideos() { return source.map(normalizeVideo); }

export const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function filterVideos(videos, query, filters) {
  return videos.filter(video => (!query || fold([video.title, ...facets.flatMap(({ key }) => video[key])].join(' ')).includes(fold(query))) && facets.every(({ key }) => !filters[key] || video[key].includes(filters[key])));
}

export function graphElements(videos, dimension) {
  const elements = [], terms = new Set();
  for (const video of videos) {
    const id = `video:${video.id}`;
    elements.push({ data: { id, videoId: video.id, label: video.title, image: video.thumbnail, kind: 'video' } });
    for (const facet of facets.filter(f => dimension === 'all' || f.key === dimension)) {
      for (const value of video[facet.key]) {
        const term = `${facet.key}:${value}`;
        if (!terms.has(term)) {
          elements.push({ data: { id: term, label: value, kind: 'term', facet: facet.key, value, color: facet.color } });
          terms.add(term);
        }
        elements.push({ data: { id: `${id}->${term}`, source: id, target: term, color: facet.color } });
      }
    }
  }
  return elements;
}
