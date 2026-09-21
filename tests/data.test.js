import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadVideos, filterVideos, graphElements, youtubeId } from '../src/data.js';

test('base real: IDs únicos e relações do grafo apontam para nós existentes', async () => {
  const videos = await loadVideos();
  assert.equal(videos.length, 46);
  assert.equal(new Set(videos.map(v => v.id)).size, videos.length);
  const elements = graphElements(videos, 'all');
  const nodes = new Set(elements.filter(e => !e.data.source).map(e => e.data.id));
  for (const { data } of elements.filter(e => e.data.source)) {
    assert.ok(nodes.has(data.source));
    assert.ok(nodes.has(data.target));
  }
  assert.equal(new Set(elements.map(e => e.data.id)).size, elements.length);
});
test('busca sem acentos e filtros combinados preservam a mesma seleção', async () => {
  const videos = await loadVideos();
  const found = filterVideos(videos, 'motiro', { projeto: 'MOTIRÔ', ano: '2020' });
  assert.ok(found.length > 0);
  assert.ok(found.every(v => v.projeto.includes('MOTIRÔ') && v.ano.includes('2020')));
  assert.equal(graphElements(found, 'projeto').filter(e => e.data.kind === 'video').length, found.length);
  assert.equal(filterVideos(videos, 'termo inexistente xyz', {}).length, 0);
});
test('endereços do player aceitam apenas IDs e hosts do YouTube', () => {
  assert.equal(youtubeId('https://youtu.be/GBlCmHgqY90?si=abc'), 'GBlCmHgqY90');
  assert.equal(youtubeId('https://www.youtube.com/watch?v=GBlCmHgqY90'), 'GBlCmHgqY90');
  assert.equal(youtubeId('https://example.com/watch?v=GBlCmHgqY90'), null);
  assert.equal(youtubeId('javascript:alert(1)'), null);
});
