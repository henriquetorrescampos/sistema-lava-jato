# AutoShine Marketplace

Projeto de design responsivo para marketplace de lava jato e estetica automotiva, inspirado em iFood/Uber.

## Tecnologias

- HTML5
- CSS3
- JavaScript (vanilla)
- Node.js (servidor estatico sem dependencias)

## Telas implementadas

1. `index.html` - Home com busca, localizacao, categorias e lista de lava jatos
2. `mapa.html` - Mapa com pins, filtro e card do estabelecimento selecionado
3. `perfil.html` - Perfil do lava jato com servicos, precos e CTA de agendamento
4. `agendamento.html` - Formulario de agendamento com data, horario e tipo de veiculo
5. `avaliacoes.html` - Media geral e lista de comentarios de clientes
6. `dashboard.html` - Painel administrativo para dono do lava jato

## Executar localmente

```bash
node server.js
```

Acesse no navegador: `http://localhost:3000`

## Estrutura

- `assets/css/styles.css` - estilo global e responsividade
- `assets/js/app.js` - interacoes (filtros, mapa e agendamento)
- `server.js` - servidor Node para servir arquivos estaticos
