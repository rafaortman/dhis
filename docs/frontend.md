# Estrutura do frontend

## Insumos

Pasta de referência: https://drive.google.com/drive/folders/1xsyD7B8CDg_bNa994y2nnjH0AlzqsD9H

- `orcamento_dhis.pdf`: escopo, base única, duas navegações, responsividade e uso de biblioteca especializada para rede.
- `WhatsApp Video 2026-09-14 at 17.27.38.mp4`: referência de galeria escura, alternância para rede com miniaturas e termos, destaque de conexões e player sobreposto.
- `WhatsApp Image 2026-09-14 at 17.32.46.jpeg`: captura da organização da planilha; não é um layout de tela.
- `5aab33a6cb0fa2cbf77b0d01_Dhis_LOGO_HOR.png`: logo original em `public/dhis-logo.png`.
- `videos.json`: base real já presente no repositório, 46 registros. `base.csv` permanece como fonte original no Drive; o JSON é a fonte desta versão.

## Organização

Identidade conferida em https://www.dhis.com.br/: Comfortaa nos títulos, Chivo nos textos, laranja institucional `#e8782f`, cinza `#a8a8a8` e branco `#f6f6f6`. O acervo adapta esses elementos a um fundo escuro neutro `#161616`. O logo original é exibido com transparência e inversão via CSS, sem caixa clara; o arquivo fonte permanece intacto.

- `src/data.js`: normalização, busca, filtros e construção das relações. Ponto de entrada para a futura fonte REST.
- `src/main.js`: estado compartilhado, galeria, filtros, URL de consulta e diálogo do vídeo.
- `src/graph.js`: integração com Cytoscape.js, disposição CoSE, zoom, arraste, seleção e destaque de vizinhança.
- `src/style.css`: identidade e comportamento responsivo.

Vite prepara o ambiente e o bundle de produção; JavaScript em módulos mantém esta primeira versão simples e integrável ao tema WordPress. Cytoscape.js atende ao requisito de usar tecnologia especializada, com licença MIT. Documentação: https://js.cytoscape.org/ e https://vite.dev/guide/.

## Comportamentos

Galeria e rede recebem o mesmo subconjunto filtrado. Busca ignora acentos e consulta título e metadados. Os seis filtros se combinam por interseção. A URL guarda modo, busca e filtros para compartilhamento/reabertura.

A rede inicia conectando por projeto. É possível escolher conteúdo, local, tema, tipo, ano ou todos. Cada termo é único dentro de sua categoria. Passar o ponteiro destaca vizinhos; selecionar vídeo abre o player; selecionar termo filtra o acervo. Existe lista alternativa de botões acessível por teclado abaixo do grafo.

O diálogo usa `dialog` nativo, fecha com Escape, interrompe o player ao fechar e apresenta os metadados como atalhos de filtragem. O vídeo externo só é carregado quando aberto. Miniaturas usam o YouTube e têm fallback local; as fontes web também têm fallback de sistema.

## Integração WordPress pendente

Substituir `loadVideos()` pela consulta paginada ao endpoint real, resolver IDs das taxonomias para nomes e manter o formato normalizado. O JSON atual se aproxima de posts REST, mas não estabelece o contrato final: endpoint, paginação, campos e taxonomias dependem da configuração do WordPress.

Nesta etapa não foram implementados instalação do WordPress, importação de planilha, publicação nem administração do conteúdo. A rede e o layout são uma primeira interpretação funcional para validação com a equipe, não reprodução literal do estudo.
