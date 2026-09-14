(function () {
  'use strict';

  const root = document.body;
  const profile = root.dataset.profile || 'aluno';
  const calendar = document.getElementById('weeklyCalendar');
  const weekLabel = document.getElementById('calendarWeekLabel');
  const notificationPanel = document.getElementById('notificationPanel');
  const searchInput = document.getElementById('dashboardSearch');
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
      const dayEvents = events.filter((event) => event[0] === name);
      return `<article class="calendar-day${isToday ? ' is-today' : ''}">
        <h3>${name}<span class="calendar-date">${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></h3>
        ${dayEvents.length ? dayEvents.map((event) => `<div class="class-event"><strong>${event[1]} · ${event[2]}</strong><span>${event[3]}</span></div>`).join('') : '<p class="empty-calendar">Sem compromissos</p>'}
      </article>`;
    }).join('');
    if (weekLabel) {
      const end = new Date(monday);
      end.setDate(monday.getDate() + 6);
      weekLabel.textContent = `${monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
  }

  function renderNotifications() {
    if (!notificationPanel) return;
    notificationPanel.innerHTML = `<h3>Notificações</h3>${(notifications[profile] || []).map((item) => `<div class="notification-item"><span>●</span><div><strong>${item[0]}</strong>${item[1]}</div></div>`).join('')}`;
  }

  function exportSchedule() {
    const rows = [['Dia', 'Horário', 'Atividade', 'Local'], ...(schedules[profile] || schedules.aluno)];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `agenda-campussync-${profile}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  document.getElementById('previousWeek')?.addEventListener('click', () => { weekOffset -= 1; renderCalendar(); });
  document.getElementById('nextWeek')?.addEventListener('click', () => { weekOffset += 1; renderCalendar(); });
  document.getElementById('todayWeek')?.addEventListener('click', () => { weekOffset = 0; renderCalendar(); });
  document.getElementById('exportSchedule')?.addEventListener('click', exportSchedule);
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
})();
