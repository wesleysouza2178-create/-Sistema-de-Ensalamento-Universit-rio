(function () {
  'use strict';

  const root = document.body;
  const profile = root.dataset.profile || 'aluno';
  const calendar = document.getElementById('weeklyCalendar');
  const weekLabel = document.getElementById('calendarWeekLabel');
  const notificationPanel = document.getElementById('notificationPanel');
  const searchInput = document.getElementById('dashboardSearch');
  const userList = document.getElementById('userList');
  const userSearch = document.getElementById('userSearch');
  const userProfileFilter = document.getElementById('userProfileFilter');
  let weekOffset = 0;

  const schedules = {
    aluno: [
      ['Seg', '08:00', 'Engenharia de Software', 'Bloco B - 214'],
      ['Seg', '10:00', 'Física Aplicada', 'Bloco A - 108'],
      ['Ter', '13:30', 'Língua Portuguesa', 'Bloco C - 302'],
      ['Qua', '08:00', 'Banco de Dados', 'Lab de Informática 01'],
      ['Qui', '19:00', 'Projeto Integrador', 'Bloco B - 210'],
      ['Sex', '10:00', 'Matemática Discreta', 'Bloco A - 204']
    ],
    professor: [
      ['Seg', '13:00', 'Sistemas Distribuídos', 'ADS - 3º Semestre'],
      ['Ter', '15:00', 'Banco de Dados', 'ADS - 2º Semestre'],
      ['Qua', '13:00', 'Sistemas Distribuídos', 'Lab de Redes'],
      ['Qui', '10:00', 'Orientação de projetos', 'Sala dos professores'],
      ['Sex', '08:00', 'Reunião acadêmica', 'Auditório 1']
    ],
    coordenador: [
      ['Seg', '08:00', 'Revisão de ensalamento', 'Sala da coordenação'],
      ['Ter', '10:00', 'Conselho de curso', 'Auditório 2'],
      ['Qua', '14:00', 'Acompanhamento de turmas', 'Bloco B'],
      ['Qui', '09:00', 'Reunião de professores', 'Sala da coordenação'],
      ['Sex', '16:00', 'Fechamento semanal', 'Sala da coordenação']
    ],
    admin: [
      ['Seg', '08:00', 'Manutenção preventiva', 'Bloco B'],
      ['Ter', '11:00', 'Auditoria de acessos', 'Administração'],
      ['Qua', '14:00', 'Inventário de equipamentos', 'Almoxarifado'],
      ['Qui', '09:00', 'Backup operacional', 'Data center'],
      ['Sex', '15:00', 'Relatório semanal', 'Administração']
    ]
  };

  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const notifications = {
    aluno: [['Nova alteração', 'A aula de Banco de Dados mudou para o Lab 01.'], ['Lembrete', 'Você tem uma atividade com prazo hoje.']],
    professor: [['Presença pendente', 'Registre a frequência da turma ADS - 3º Semestre.'], ['Reserva confirmada', 'O Lab de Redes está reservado para quarta.']],
    coordenador: [['Conflito detectado', 'Existem 2 horários aguardando revisão.'], ['Atualização', '3 laboratórios foram atualizados hoje.']],
    admin: [['Sistema operacional', 'Backup automático concluído com sucesso.'], ['Atenção', 'Manutenção do Bloco B agendada para amanhã.']]
  };

  function getMonday(offset) {
    const date = new Date();
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1 + offset * 7);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  function renderCalendar() {
    if (!calendar) return;
    const monday = getMonday(weekOffset);
    const events = schedules[profile] || schedules.aluno;
    const today = new Date();
    calendar.innerHTML = dayNames.map((name, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const isToday = date.toDateString() === today.toDateString();
      const dayEvents = events.filter((event) => event[0] === name).sort((first, second) => first[1].localeCompare(second[1]));
      return `<article class="calendar-day${isToday ? ' is-today' : ''}">
        <header class="calendar-day-header"><h3>${name}</h3><span class="calendar-date">${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></header>
        ${dayEvents.length ? dayEvents.map((event) => `<div class="class-event"><span class="event-time">${escapeHtml(event[1])}</span><strong>${escapeHtml(event[2])}</strong><span>${escapeHtml(event[3])}</span></div>`).join('') : '<p class="empty-calendar">Livre</p>'}
      </article>`;
    }).join('');
    if (weekLabel) {
      const end = new Date(monday);
      end.setDate(monday.getDate() + 6);
      weekLabel.textContent = `${monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    const summary = document.getElementById('calendarSummary');
    if (summary) {
      const nextEvent = events[0];
      summary.innerHTML = `<span><strong>${events.length}</strong> compromissos na semana</span><span><strong>${events.filter((event) => event[0] !== 'Sáb' && event[0] !== 'Dom').length}</strong> atividades em dias úteis</span><span><strong>${nextEvent ? escapeHtml(nextEvent[1]) : '--'}</strong> próxima atividade</span>`;
    }
  }

  function renderNotifications() {
    if (!notificationPanel) return;
    notificationPanel.innerHTML = `<h3>Notificações</h3>${(notifications[profile] || []).map((item) => `<div class="notification-item"><span>●</span><div><strong>${item[0]}</strong>${item[1]}</div></div>`).join('')}`;
  }

  function exportSchedule() {
    const events = schedules[profile] || schedules.aluno;
    const profileNames = { aluno: 'Aluno', professor: 'Professor', coordenador: 'Coordenador', admin: 'Administração' };
    const rows = events.map((event) => `<tr><td>${escapeHtml(event[0])}</td><td>${escapeHtml(event[1])}</td><td>${escapeHtml(event[2])}</td><td>${escapeHtml(event[3])}</td></tr>`).join('');
    const reportWindow = window.open('', '_blank', 'width=1000,height=750');
    if (!reportWindow) {
      window.alert('Permita pop-ups para gerar a agenda em PDF.');
      return;
    }
    reportWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Agenda CampusSync</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#172b43;margin:0}.header{border-bottom:4px solid #e26d3f;padding-bottom:18px;margin-bottom:24px}.brand{font-size:25px;font-weight:800;color:#155fa0}.brand span{color:#172b43}h1{font-size:28px;margin:28px 0 8px}p{color:#526578}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#155fa0;color:#fff;text-align:left;text-transform:uppercase;font-size:10px}th,td{padding:10px;border:1px solid #dce8f2}tr:nth-child(even){background:#f5f9fc}.footer{margin-top:28px;padding-top:10px;border-top:1px solid #dce8f2;color:#748494;font-size:10px}</style></head><body><div class="header"><div class="brand">Campus<span>Sync</span></div><h1>Agenda semanal</h1><p>Perfil: <strong>${escapeHtml(profileNames[profile] || profile)}</strong><br>Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</p></div><table><thead><tr><th>Dia</th><th>Horário</th><th>Atividade</th><th>Local</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">CampusSync · Agenda acadêmica · Documento preparado para salvar como PDF</div></body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.addEventListener('afterprint', () => reportWindow.close());
    reportWindow.setTimeout(() => reportWindow.print(), 350);
  }

  const defaultUsers = [
    { usuario: 'ana.silva', nome: 'Ana Silva', perfil: 'aluno', status: 'Ativo', acesso: 'Hoje, 08:42' },
    { usuario: 'bruno.souza', nome: 'Bruno Souza', perfil: 'aluno', status: 'Ativo', acesso: 'Hoje, 07:15' },
    { usuario: 'carla.mendes', nome: 'Carla Mendes', perfil: 'professor', status: 'Ativo', acesso: 'Ontem, 18:20' },
    { usuario: 'diego.lima', nome: 'Diego Lima', perfil: 'coordenador', status: 'Ativo', acesso: 'Hoje, 09:05' },
    { usuario: 'admin', nome: 'Administrador', perfil: 'admin', status: 'Ativo', acesso: 'Hoje, 10:12' }
  ];

  function getUsers() {
    try {
      const saved = JSON.parse(localStorage.getItem('usuariosCampusSync'));
      return Array.isArray(saved) && saved.length ? saved : defaultUsers;
    } catch {
      return defaultUsers;
    }
  }

  function renderUsers() {
    if (!userList) return;
    const term = userSearch?.value.toLowerCase().trim() || '';
    const selectedProfile = userProfileFilter?.value || 'todos';
    const users = getUsers().filter((item) => {
      const matchesText = !term || `${item.nome} ${item.usuario}`.toLowerCase().includes(term);
      const matchesProfile = selectedProfile === 'todos' || item.perfil === selectedProfile;
      return matchesText && matchesProfile;
    });
    userList.innerHTML = users.length ? users.map((item) => {
      const canDelete = item.usuario !== 'admin';
      const canEditRole = profile === 'admin' || (profile === 'coordenador' && item.perfil !== 'admin');
      const allowedProfiles = profile === 'admin' ? ['aluno', 'professor', 'coordenador', 'admin'] : ['aluno', 'professor', 'coordenador'];
      const roleControl = canEditRole
        ? `<select class="user-role-select" data-user="${escapeHtml(item.usuario)}" aria-label="Alterar perfil de ${escapeHtml(item.nome)}">${allowedProfiles.map((role) => `<option value="${role}"${item.perfil === role ? ' selected' : ''}>${role}</option>`).join('')}</select><button type="button" class="save-user-btn" data-user="${escapeHtml(item.usuario)}">Salvar</button>`
        : '<span class="protected-user">Acesso restrito</span>';
      return `<tr><td><strong>${escapeHtml(item.nome)}</strong><br><small>${escapeHtml(item.usuario)}</small></td><td>${escapeHtml(item.perfil)}</td><td><span class="status-badge">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.acesso)}</td><td><div class="user-actions">${roleControl}${canDelete ? `<button type="button" class="delete-user-btn" data-user="${escapeHtml(item.usuario)}">Excluir</button>` : '<span class="protected-user">Protegido</span>'}</div></td></tr>`;
    }).join('') : '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
    userList.querySelectorAll('.save-user-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const username = button.dataset.user;
        const selectedRole = userList.querySelector(`.user-role-select[data-user="${CSS.escape(username)}"]`)?.value;
        if (!selectedRole) return;
        const updatedUsers = getUsers().map((item) => item.usuario === username ? { ...item, perfil: selectedRole } : item);
        localStorage.setItem('usuariosCampusSync', JSON.stringify(updatedUsers));
        renderUsers();
      });
    });
    userList.querySelectorAll('.delete-user-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const username = button.dataset.user;
        const selectedUser = getUsers().find((item) => item.usuario === username);
        if (!selectedUser || !window.confirm(`Excluir o usuário ${selectedUser.nome}? Esta ação não pode ser desfeita.`)) return;
        const updatedUsers = getUsers().filter((item) => item.usuario !== username);
        localStorage.setItem('usuariosCampusSync', JSON.stringify(updatedUsers));
        renderUsers();
      });
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function downloadReport(type) {
    const labs = (() => { try { const saved = JSON.parse(localStorage.getItem('laboratoriosCampusSync')); return Array.isArray(saved) ? saved : []; } catch { return []; } })();
    const users = getUsers();
    const generatedAt = new Date().toLocaleString('pt-BR');
    const reportNames = { campus: 'Relatório executivo do campus', users: 'Relatório de usuários', labs: 'Relatório de laboratórios' };
    const reportTitle = reportNames[type] || reportNames.campus;
    const profileNames = { aluno: 'Aluno', professor: 'Professor', coordenador: 'Coordenador', admin: 'Administração' };
    const scheduleRows = (schedules[profile] || schedules.aluno).map((item) => `<tr><td>${escapeHtml(item[0])}</td><td>${escapeHtml(item[1])}</td><td>${escapeHtml(item[2])}</td><td>${escapeHtml(item[3])}</td></tr>`).join('');
    const userRows = users.map((item) => `<tr><td>${escapeHtml(item.nome)}</td><td>${escapeHtml(item.usuario)}</td><td>${escapeHtml(item.perfil)}</td><td><span class="tag">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.acesso)}</td></tr>`).join('');
    const labRows = labs.length ? labs.map((item) => `<tr><td>${escapeHtml(item.nome)}</td><td>${escapeHtml(item.bloco)}</td><td>${escapeHtml(item.tipo)}</td><td>${escapeHtml(item.capacidade)}</td><td><span class="tag">${escapeHtml(item.status)}</span></td></tr>`).join('') : '<tr><td colspan="5">Nenhum laboratório cadastrado.</td></tr>';
    const reportWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!reportWindow) {
      window.alert('Permita pop-ups para gerar o relatório em PDF.');
      return;
    }
    reportWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(reportTitle)}</title><style>
      @page { size: A4; margin: 16mm; } * { box-sizing: border-box; } body { margin: 0; color: #172b43; font: 12px Arial, sans-serif; background: #fff; } .cover { min-height: 245mm; display: flex; flex-direction: column; justify-content: space-between; padding: 18mm 8mm; page-break-after: always; } .brand { color: #155fa0; font-size: 25px; font-weight: 800; } .brand span { color: #172b43; } .accent { width: 70px; height: 5px; background: #e26d3f; margin: 28px 0; } h1 { font-size: 35px; line-height: 1.1; max-width: 500px; margin: 0; } h2 { color: #155fa0; font-size: 19px; border-bottom: 2px solid #dce8f2; padding-bottom: 8px; margin: 0 0 15px; } h3 { color: #172b43; font-size: 14px; margin: 24px 0 9px; } p { color: #526578; line-height: 1.5; } .meta { border-top: 1px solid #dce8f2; padding-top: 12px; color: #526578; } .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0 24px; } .metric { border: 1px solid #dce8f2; border-radius: 7px; padding: 13px; background: #f5f9fc; } .metric strong { display: block; color: #155fa0; font-size: 22px; margin-top: 4px; } table { width: 100%; border-collapse: collapse; margin: 8px 0 18px; } th { background: #155fa0; color: white; text-align: left; font-size: 10px; text-transform: uppercase; } th, td { border: 1px solid #dce8f2; padding: 8px; vertical-align: top; } tr:nth-child(even) { background: #f5f9fc; } .tag { color: #19735b; font-weight: 700; } .section { page-break-inside: avoid; } .footer { margin-top: 24px; border-top: 1px solid #dce8f2; padding-top: 8px; color: #748494; font-size: 10px; }
    </style></head><body><section class="cover"><div><div class="brand">Campus<span>Sync</span></div><div class="accent"></div><h1>${escapeHtml(reportTitle)}</h1><p>Documento consolidado de acompanhamento acadêmico e operacional.</p></div><div class="meta"><strong>Perfil responsável:</strong> ${escapeHtml(profileNames[profile] || profile)}<br><strong>Gerado em:</strong> ${escapeHtml(generatedAt)}<br><strong>Classificação:</strong> Uso interno</div></section><main>
      <section class="section"><h2>Resumo executivo</h2><div class="summary"><div class="metric">Usuários cadastrados<strong>${users.length}</strong></div><div class="metric">Laboratórios<strong>${labs.length}</strong></div><div class="metric">Ocupação estimada<strong>78%</strong></div></div><p>Este relatório reúne os principais registros disponíveis no CampusSync para apoiar decisões, acompanhamento de recursos e organização da rotina universitária.</p></section>
      ${type === 'campus' || type === 'users' ? `<section class="section"><h2>Usuários e acessos</h2><table><thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th><th>Status</th><th>Último acesso</th></tr></thead><tbody>${userRows}</tbody></table></section>` : ''}
      ${type === 'campus' || type === 'labs' ? `<section class="section"><h2>Laboratórios e recursos</h2><table><thead><tr><th>Laboratório</th><th>Bloco</th><th>Tipo</th><th>Capacidade</th><th>Status</th></tr></thead><tbody>${labRows}</tbody></table></section>` : ''}
      <section class="section"><h2>Agenda do perfil</h2><table><thead><tr><th>Dia</th><th>Horário</th><th>Atividade</th><th>Local</th></tr></thead><tbody>${scheduleRows}</tbody></table></section><div class="footer">CampusSync · Sistema de Ensalamento Universitário · Relatório gerado automaticamente</div></main></body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.addEventListener('afterprint', () => reportWindow.close());
    reportWindow.setTimeout(() => reportWindow.print(), 350);
  }

  document.getElementById('previousWeek')?.addEventListener('click', () => { weekOffset -= 1; renderCalendar(); });
  document.getElementById('nextWeek')?.addEventListener('click', () => { weekOffset += 1; renderCalendar(); });
  document.getElementById('todayWeek')?.addEventListener('click', () => { weekOffset = 0; renderCalendar(); });
  document.getElementById('exportSchedule')?.addEventListener('click', exportSchedule);
  document.getElementById('printSchedule')?.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-report]').forEach((button) => button.addEventListener('click', () => downloadReport(button.dataset.report)));
  userSearch?.addEventListener('input', renderUsers);
  userProfileFilter?.addEventListener('change', renderUsers);
  document.getElementById('addDemoUser')?.addEventListener('click', () => {
    const users = getUsers();
    const nextNumber = users.length + 1;
    users.push({ usuario: `novo.usuario${nextNumber}`, nome: `Novo usuário ${nextNumber}`, perfil: 'aluno', status: 'Ativo', acesso: 'Ainda não acessou' });
    localStorage.setItem('usuariosCampusSync', JSON.stringify(users));
    renderUsers();
  });
  document.getElementById('notificationToggle')?.addEventListener('click', () => notificationPanel?.classList.toggle('is-visible'));
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    root.classList.toggle('theme-dim');
    localStorage.setItem('campusTheme', root.classList.contains('theme-dim') ? 'dim' : 'light');
  });
  if (localStorage.getItem('campusTheme') === 'dim') root.classList.add('theme-dim');

  searchInput?.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('.dashboard-card, .insight-card, .lab-visual-item, .coord-lab-item, .lab-item').forEach((item) => {
      item.hidden = Boolean(term) && !item.textContent.toLowerCase().includes(term);
    });
  });

  renderCalendar();
  renderNotifications();
  renderUsers();
})();
