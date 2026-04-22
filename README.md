# AutoShine Marketplace

Projeto de design responsivo para marketplace de lava jato e estetica automotiva, inspirado em iFood/Uber.

## Tecnologias

- HTML5
- CSS3
- JavaScript (vanilla)
<<<<<<< HEAD
- Node.js + Express
- Passport Google OAuth 2.0
=======
- Node.js (servidor estatico sem dependencias)
>>>>>>> d9ad1df3fd54b43e3aeda2acaa47786fe5c3887b

## Telas implementadas

1. `index.html` - Home com busca, localizacao, categorias e lista de lava jatos
2. `mapa.html` - Mapa com pins, filtro e card do estabelecimento selecionado
3. `perfil.html` - Perfil do lava jato com servicos, precos e CTA de agendamento
4. `agendamento.html` - Formulario de agendamento com data, horario e tipo de veiculo
5. `avaliacoes.html` - Media geral e lista de comentarios de clientes
6. `dashboard.html` - Painel administrativo para dono do lava jato

## Executar localmente

```bash
<<<<<<< HEAD
npm install
npm run dev
=======
node server.js
>>>>>>> d9ad1df3fd54b43e3aeda2acaa47786fe5c3887b
```

Acesse no navegador: `http://localhost:3000`

<<<<<<< HEAD
## Login com Google (OAuth real)

1. Crie credenciais OAuth no Google Cloud Console.
2. Configure a URI de redirecionamento autorizada:

```text
http://localhost:3000/auth/google/callback
```

3. Copie `.env.example` para `.env` e preencha:

```env
PORT=3000
SESSION_SECRET=uma_frase_bem_longa_e_aleatoria_123
GOOGLE_CLIENT_ID=447228936649-43lr13i41pdl1pucmrir6ig0e4jfbted.apps googleusercontent.com
GOOGLE_CLIENT_SECRET=****A7N6
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
DATABASE_URL="file:./dev.db"
```

4. Reinicie o servidor e use o botao `Continuar com Google` na tela `cadastro.html`.

## Estrutura

- `assets/css/styles.css` - estilo global e responsividade
- `assets/js/app.js` - interacoes (filtros, mapa, agendamento, avaliacoes e cadastro)
- `server.js` - servidor Express com sessoes e autenticacao Google
- `.env.example` - modelo de configuracao de variaveis de ambiente
=======
## Estrutura

- `assets/css/styles.css` - estilo global e responsividade
- `assets/js/app.js` - interacoes (filtros, mapa e agendamento)
- `server.js` - servidor Node para servir arquivos estaticos
>>>>>>> d9ad1df3fd54b43e3aeda2acaa47786fe5c3887b
