# CampusSync - Sistema de Ensalamento Universitário

Projeto web de ensalamento para universidades, com objetivo de automatizar e centralizar a organização de horários, salas, professores e informações acadêmicas para alunos, coordenadores e administração.

## Funcionalidades principais

- Página inicial responsiva e moderna
- Login por perfil (aluno, professor, coordenador e administração)
- Painel específico para cada tipo de usuário
- Informações de horários, avisos e localização do campus
- Mapa de localização com OpenStreetMap
- Estrutura organizada em HTML, CSS e JavaScript puro
- Calendário semanal navegável por perfil, com exportação CSV
- Busca instantânea nos cards, laboratórios e agenda
- Central de notificações e modo de contraste persistente
- Layout responsivo com menu lateral para celular e tablet

## Estrutura

- `index.html` — página inicial do site
- `Css_geral/global.css` — estilos globais e responsivos
- `Paginas/Pagina_login/` — login e autenticação simples
- `Paginas/Pag_aluno/` — painel do aluno
- `Paginas/Pag_Prof/` — painel do professor
- `Paginas/Pag_Coordenador/` — painel do coordenador
- `Paginas/Pag_Adm/` — painel da administração
- `Serviços/guia.html` — guia interno do projeto

## Como executar

1. Abra a pasta do projeto no navegador.
2. Acesse `index.html` para abrir a landing page.
3. Faça login usando um perfil e senha de demonstração.

## Credenciais de demonstração

- Aluno: usuário `aluno` / senha `123456`
- Professor: usuário `professor` / senha `123456`
- Coordenador: usuário `coordenador` / senha `123456`
- Admin: usuário `admin` / senha `123456`

Este é um protótipo funcional e inicial, pensado para evoluir com banco de dados, API e integração real no futuro.

## Recursos dos painéis

Todos os painéis exibem uma agenda contextual ao perfil, com navegação entre semanas e botão para exportar os compromissos. A busca filtra os conteúdos visíveis em tempo real e as preferências de contraste ficam salvas no navegador. O cadastro de laboratórios compartilhado entre coordenação e administração continua persistido em `localStorage` para facilitar a demonstração sem backend.