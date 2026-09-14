# CampusSync - Sistema de Ensalamento Universitário

Projeto web de ensalamento universitário para centralizar horários, salas, laboratórios, auditórios, reservas e comunicação acadêmica em uma experiência responsiva para alunos, professores, coordenação e administração.

## Funcionalidades principais

- Página inicial responsiva e moderna
- Login por perfil (aluno, professor, coordenador e administração)
- Cadastro de usuários com nome, e-mail, perfil e senha
- Recuperação de senha por usuário e e-mail cadastrados
- Base persistente de usuários no navegador com hash de senha quando disponível
- Painel específico para cada tipo de usuário
- Informações de horários, avisos e localização do campus
- Mapa de localização com OpenStreetMap
- Estrutura organizada em HTML, CSS e JavaScript puro
- Calendário semanal navegável por perfil, com geração de agenda em PDF
- Busca instantânea nos cards, laboratórios e agenda
- Central de notificações e modo de contraste persistente
- Layout responsivo com menu lateral para celular e tablet
- Reservas compartilhadas de salas com validação de conflitos
- Base compartilhada de salas, laboratórios e auditórios
- Gestão de usuários, permissões de perfil e relatórios em PDF
- Exportação da base de usuários em JSON pelo painel administrativo
- Controle de acesso entre painéis conforme o perfil autenticado

## Estrutura

- `index.html` — página inicial do site
- `Css_geral/global.css` — estilos globais e responsivos
- `Paginas/Pagina_login/` — login, cadastro e recuperação de acesso
- `Paginas/Pag_aluno/` — painel do aluno
- `Paginas/Pag_Prof/` — painel do professor
- `Paginas/Pag_Coordenador/` — painel do coordenador
- `Paginas/Pag_Adm/` — painel da administração
- `Serviços/dashboard.js` — calendário, reservas, recursos compartilhados e PDFs

## Como executar

1. Abra a pasta do projeto no VS Code.
2. Acesse `index.html` para abrir a página inicial.
3. Entre em `Paginas/Pagina_login/index.html` ou use o botão de login da página inicial.
4. Para uma experiência mais consistente com `localStorage`, use um servidor estático local.

## Credenciais de demonstração

- Aluno: usuário `aluno` / senha `123456`
- Professor: usuário `professor` / senha `123456`
- Coordenador: usuário `coordenador` / senha `123456`
- Admin: usuário `admin` / senha `123456`

## Armazenamento e segurança

O protótipo usa `localStorage` como banco local do navegador. Os dados compartilhados incluem usuários, laboratórios, salas, auditórios, compromissos e reservas. As alterações aparecem em outras páginas abertas por meio dos eventos de sincronização do navegador.

O Admin pode exportar a base de usuários em JSON e os painéis de Administração e Coordenação podem gerar relatórios em PDF. A recuperação de senha funciona localmente com usuário e e-mail, mas não envia mensagens reais.

Para produção, substitua o armazenamento local por uma API com banco de dados, autenticação no servidor, hash seguro com salt, tokens de recuperação com expiração, envio real de e-mail, controle de permissões no backend e auditoria de alterações.

## Recursos dos painéis

Todos os painéis exibem uma agenda contextual ao perfil, com navegação entre semanas, criação de compromissos vinculados ao usuário e geração de PDF. Alunos podem reservar salas, com validação de conflitos; o responsável pode cancelar sua reserva e o Admin pode gerenciar todas.

Administração e Coordenação podem cadastrar, editar e excluir laboratórios, além de adicionar ou remover salas e auditórios da base compartilhada. Todos os perfis visualizam as alterações atualizadas.