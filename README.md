# AutoShine Marketplace

Projeto de design responsivo para marketplace de lava jato e estetica automotiva, inspirado em iFood/Uber.

## Tecnologias

- HTML5
- CSS3
- JavaScript (vanilla)
- Node.js + Express
- Passport Google OAuth 2.0

## Telas implementadas

1. `index.html` - Home com busca, localizacao, categorias e lista de lava jatos
2. `mapa.html` - Mapa com pins, filtro e card do estabelecimento selecionado
3. `perfil.html` - Perfil do lava jato com servicos, precos e CTA de agendamento
4. `agendamento.html` - Formulario de agendamento com data, horario e tipo de veiculo
5. `avaliacoes.html` - Media geral e lista de comentarios de clientes
6. `dashboard.html` - Painel administrativo para dono do lava jato

## Executar localmente

```bash
npm install
npm run dev
```

Acesse no navegador: `http://localhost:3000`

## Login com Google (OAuth real)

1. Crie credenciais OAuth no Google Cloud Console.
2. Configure a URI de redirecionamento autorizada:

```text
http://localhost:3000/auth/google/callback
```

3. Copie `.env.example` para `.env` e preencha:

```env
PORT=3000
SESSION_SECRET=sua-chave-segura
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

4. Reinicie o servidor e use o botao `Continuar com Google` na tela `cadastro.html`.

## Estrutura

- `assets/css/styles.css` - estilo global e responsividade
- `assets/js/app.js` - interacoes (filtros, mapa, agendamento, avaliacoes e cadastro)
- `server.js` - servidor Express com sessoes e autenticacao Google
- `.env.example` - modelo de configuracao de variaveis de ambiente
