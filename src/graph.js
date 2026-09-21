import cytoscape from 'cytoscape';
import { graphElements } from './data.js';

export function createGraph(container, videos, dimension, onVideo, onTerm) {
  const cy = cytoscape({
    container, elements: graphElements(videos, dimension),
    minZoom: 0.12, maxZoom: 3, wheelSensitivity: 0.2,
    style: [
      { selector: 'node', style: { label: 'data(label)', color: '#f6f6f6', 'font-family': 'Chivo, sans-serif', 'font-size': 11, 'text-valign': 'bottom', 'text-margin-y': 8, 'text-wrap': 'ellipsis', 'text-max-width': 125, 'text-outline-color': '#161616', 'text-outline-width': 2 } },
      { selector: 'node[kind="video"]', style: { shape: 'round-rectangle', width: 88, height: 52, 'background-color': '#363636', 'background-image': 'data(image)', 'background-fit': 'cover', 'border-width': 1, 'border-color': '#a8a8a8' } },
      { selector: 'node[kind="term"]', style: { width: 13, height: 13, 'background-color': 'data(color)', 'font-size': 12 } },
      { selector: 'edge', style: { width: 0.8, 'line-color': 'data(color)', opacity: 0.22, 'curve-style': 'haystack' } },
      { selector: '.muted', style: { opacity: 0.1 } },
      { selector: 'edge.highlight', style: { width: 2, opacity: 0.95 } },
      { selector: 'node.highlight', style: { 'border-width': 3, 'border-color': '#e8782f' } },
    ],
    layout: { name: 'cose', animate: false, padding: 65, nodeRepulsion: () => 16000, idealEdgeLength: () => 150, nodeOverlap: 25, randomize: false },
  });
  cy.on('tap', 'node', event => {
    const node = event.target;
    if (node.data('kind') === 'video') onVideo(node.data('videoId'));
    else onTerm(node.data('facet'), node.data('value'));
  });
  cy.on('mouseover', 'node', event => {
    const connected = event.target.closedNeighborhood();
    cy.elements().not(connected).addClass('muted');
    connected.addClass('highlight');
    container.style.cursor = 'pointer';
  });
  cy.on('mouseout', 'node', () => { cy.elements().removeClass('muted highlight'); container.style.cursor = ''; });
  const observer = new ResizeObserver(() => cy.resize());
  observer.observe(container);
  return { fit: () => cy.fit(undefined, 65), zoom: factor => cy.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }), destroy: () => { observer.disconnect(); cy.destroy(); } };
}
