# Planilha como fonte de dados (backend)

## Plano

A planilha do Google Sheets passa a ser a fonte dos vídeos. Um script do Google Apps Script, publicado como aplicativo da web, lê a aba de dados, limpa e converte as linhas para o formato que o site já entende (o mesmo de `data/videos.json`) e devolve JSON.

No frontend, apenas `loadVideos()` em `src/data.js` muda: busca o endereço do script e mantém o `data/videos.json` embutido como reserva, para o acervo continuar funcionando se a rede ou o Google falharem (importante em apresentações presenciais).

Esta etapa ainda não foi implementada. Este documento registra os procedimentos que a equipe responsável pela planilha precisa seguir para que ela funcione como backend.

## Procedimentos para a planilha

Os quatro primeiros são os críticos: sem eles o site pode quebrar sem aviso.

### Estrutura (ajuste feito uma vez)

1. **Coluna `ID` fixa.** Cada vídeo tem um identificador único e permanente (ex.: `v001`), que nunca é reaproveitado nem alterado. Assim reordenar ou apagar linhas não quebra links nem referências.
2. **Cabeçalho estável.** Uma linha de cabeçalho com `NOME`, `LINK`, `PROJETO`, `CONTEÚDO`, `LOCAL`, `TEMA`, `TIPO`, `ANO`, `PARCEIROS`. Não renomear, não inserir colunas no meio e não deixar espaço sobrando nos nomes.
3. **Uma aba só para os dados.** Anotações e rascunhos ficam em outras abas; o script lê apenas a aba combinada.
4. **Coluna `PUBLICAR` (sim/não).** Permite deixar um vídeo em rascunho sem apagar a linha. Só o que estiver como "sim" aparece no site.

### Preenchimento (no dia a dia)

5. **Uma linha por vídeo, sempre completa.** Nome e link são obrigatórios. Linhas sem link ou sem nome não aparecem no site, então não deixar linhas soltas só com projeto preenchido.
6. **Link do YouTube completo**, em `youtu.be/...` ou `youtube.com/watch?v=...`. Não repetir o mesmo vídeo em duas linhas.
7. **Valores múltiplos separados por vírgula**, por exemplo `Pesquisa DHIS, Mascarados Afroiberoamericanos`. Nomes de projeto, tema etc. não podem conter vírgula.
8. **Grafia padronizada.** "Bate-Bolas" e "Bate-bolas" viram filtros diferentes no site. O ideal é usar validação de dados (lista suspensa) em `PROJETO`, `CONTEÚDO`, `LOCAL`, `TEMA` e `TIPO`, aceitando só valores já cadastrados.
9. **`ANO` com quatro dígitos**, só o número (`2020`, não `2020/21`).
10. **Sem aspas soltas nem espaços** no começo ou no fim das células. O script limpa o que puder, mas é mais seguro não depender disso.

### Segurança

11. **Edição restrita** a um grupo pequeno; os demais acessam só leitura.
12. **Cópia antes de mudanças grandes** (Arquivo > Fazer uma cópia). O histórico de versões do Google também permite voltar atrás.

### Rotina

13. **Esperar cerca de 5 minutos após editar** para a mudança aparecer no site, por causa do cache. Avisar a equipe antes de eventos.
14. **Conferir no site** se o vídeo novo apareceu e se o player abre.

## Decisões em aberto

- **Identificador:** usar a coluna `ID` da planilha; se ela não existir, usar o ID do vídeo no YouTube.
- **Separador de múltiplos valores:** vírgula (padrão atual do `videos.json`) ou ponto e vírgula.
