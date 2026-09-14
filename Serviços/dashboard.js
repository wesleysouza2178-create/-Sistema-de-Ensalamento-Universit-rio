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
  const calendarPanel = document.querySelector('.calendar-panel');
  const currentUser = getLoggedUser();
  const currentUsername = currentUser?.usuario || profile;
  const eventsStorageKey = 'compromissosCampusSync';
  const roomReservationsKey = 'reservasSalasCampusSync';
  const resourcesStorageKey = 'recursosCampusSync';
  const attendanceStorageKey = 'chamadasCampusSync';
  let weekOffset = 0;

  const profileRoutes = { aluno: '../Pag_aluno/index.html', professor: '../Pag_Prof/index.html', coordenador: '../Pag_Coordenador/index.html', admin: '../Pag_Adm/index.html' };
  if (!currentUser) {
    window.location.replace('../Pagina_login/index.html');
  } else if (currentUser.perfil !== profile && profileRoutes[currentUser.perfil]) {
    window.location.replace(profileRoutes[currentUser.perfil]);
  }

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

  function getLoggedUser() {
    try {
      const raw = localStorage.getItem('usuarioLogado') || sessionStorage.getItem('usuarioLogado');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getSavedEvents() {
    try {
      const saved = JSON.parse(localStorage.getItem(eventsStorageKey));
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  }

  function saveEvents(events) {
    localStorage.setItem(eventsStorageKey, JSON.stringify(events));
  }

  function getRoomReservations() {
    try {
      const saved = JSON.parse(localStorage.getItem(roomReservationsKey));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveRoomReservations(reservations) {
    localStorage.setItem(roomReservationsKey, JSON.stringify(reservations));
  }

  function getSharedResources() {
    const defaults = { rooms: ['Sala 101', 'Sala 108', 'Sala 204', 'Sala 214', 'Sala 305', 'Sala de estudos A'], auditoriums: ['Auditório 1', 'Auditório 2', 'Auditório principal'] };
    try {
      const saved = JSON.parse(localStorage.getItem(resourcesStorageKey));
      return saved && Array.isArray(saved.rooms) && Array.isArray(saved.auditoriums) ? saved : defaults;
    } catch {
      return defaults;
    }
  }

  function saveSharedResources(resources) {
    localStorage.setItem(resourcesStorageKey, JSON.stringify(resources));
    window.dispatchEvent(new Event('campusSyncDataChanged'));
  }

  function setupRoomReservations() {
    if (!document.getElementById('roomReservationList') && calendarPanel) {
      calendarPanel.insertAdjacentHTML('afterend', `<section class="room-booking-panel shared-room-panel" id="sharedRoomReservations" aria-labelledby="sharedRoomTitle"><div class="room-booking-header"><div><span class="card-label">Agenda compartilhada</span><h2 id="sharedRoomTitle">Reservas de salas</h2><p>Consulte as salas ocupadas pela comunidade acadêmica.</p></div></div><div class="room-reservation-list" id="roomReservationList"></div></section>`);
    }
    const form = document.getElementById('roomBookingForm');
    const dateInput = form?.querySelector('[name="date"]');
    if (dateInput && !dateInput.value) dateInput.value = formatDateInput(new Date());
    if (dateInput) dateInput.min = formatDateInput(new Date());
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const room = data.get('room').toString();
      const date = data.get('date').toString();
      const start = data.get('start').toString();
      const end = data.get('end').toString();
      const feedback = document.getElementById('roomBookingFeedback');
      if (end <= start) {
        if (feedback) feedback.textContent = 'O horário final deve ser depois do horário inicial.';
        return;
      }
      const reservations = getRoomReservations();
      const hasConflict = reservations.some((reservation) => reservation.room === room && reservation.date === date && start < reservation.end && end > reservation.start);
      if (hasConflict) {
        if (feedback) feedback.textContent = 'Esta sala já está reservada nesse intervalo.';
        return;
      }
      reservations.push({ id: `${currentUsername}-${Date.now()}`, owner: currentUsername, date, room, start, end });
      saveRoomReservations(reservations);
      form.reset();
      if (dateInput) dateInput.value = formatDateInput(new Date());
      if (feedback) feedback.textContent = 'Sala reservada com sucesso e agenda atualizada.';
      renderRoomReservations();
    });
    renderRoomReservations();
  }

  function renderRoomReservations() {
    const list = document.getElementById('roomReservationList');
    if (!list) return;
    const reservations = getRoomReservations().sort((first, second) => `${first.date}${first.start}`.localeCompare(`${second.date}${second.start}`));
    list.innerHTML = reservations.length ? reservations.map((reservation) => `<article class="room-reservation-item"><div><strong>${escapeHtml(reservation.room)}</strong><span>${new Date(`${reservation.date}T12:00:00`).toLocaleDateString('pt-BR')} · ${escapeHtml(reservation.start)} às ${escapeHtml(reservation.end)}</span></div><small>Responsável: ${escapeHtml(reservation.owner)}</small>${profile === 'admin' || reservation.owner === currentUsername ? `<button type="button" class="delete-room-reservation" data-reservation-id="${escapeHtml(reservation.id)}">Cancelar</button>` : ''}</article>`).join('') : '<p class="empty-state">Nenhuma sala reservada.</p>';
    list.querySelectorAll('.delete-room-reservation').forEach((button) => button.addEventListener('click', () => {
      if (!window.confirm('Cancelar esta reserva de sala?')) return;
      saveRoomReservations(getRoomReservations().filter((reservation) => reservation.id !== button.dataset.reservationId));
      renderRoomReservations();
    }));
  }

  function setupSharedResources() {
    if (!calendarPanel || document.getElementById('sharedResourcesPanel')) return;
    const canManage = profile === 'admin' || profile === 'coordenador';
    calendarPanel.insertAdjacentHTML('afterend', `<section class="shared-resources-panel" id="sharedResourcesPanel" aria-labelledby="sharedResourcesTitle"><div class="shared-resources-header"><div><span class="card-label">Base compartilhada</span><h2 id="sharedResourcesTitle">Salas, laboratórios e auditórios</h2><p>Alterações feitas pela Administração ou Coordenação aparecem para todos.</p></div>${canManage ? '<button type="button" class="secondary-btn" id="toggleResourceForm">Adicionar espaço</button>' : ''}</div>${canManage ? '<form class="resource-form" id="resourceForm" hidden><select name="type" required><option value="rooms">Sala</option><option value="auditoriums">Auditório</option></select><input name="name" type="text" placeholder="Nome do espaço" required><button class="primary-btn" type="submit">Adicionar</button></form>' : ''}<div class="shared-resource-list" id="sharedResourceList"></div></section>`);
    document.getElementById('toggleResourceForm')?.addEventListener('click', () => {
      const form = document.getElementById('resourceForm');
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector('input').focus();
    });
    document.getElementById('resourceForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const resources = getSharedResources();
      const type = data.get('type').toString();
      const name = data.get('name').toString().trim();
      if (!name || resources[type].some((item) => item.toLowerCase() === name.toLowerCase())) return;
      resources[type].push(name);
      saveSharedResources(resources);
      event.currentTarget.reset();
      event.currentTarget.hidden = true;
      renderSharedResources();
    });
    renderSharedResources();
  }

  function renderSharedResources() {
    const list = document.getElementById('sharedResourceList');
    if (!list) return;
    const resources = getSharedResources();
    let labs = [];
    try { const saved = JSON.parse(localStorage.getItem('laboratoriosCampusSync')); labs = Array.isArray(saved) ? saved : []; } catch { labs = []; }
    const canManage = profile === 'admin' || profile === 'coordenador';
    const group = (title, type, items) => `<div class="resource-group"><h3>${title}</h3>${items.length ? items.map((item) => `<div class="shared-resource-item"><span>${escapeHtml(item)}</span>${canManage ? `<button type="button" class="delete-resource-btn" data-resource-type="${type}" data-resource-name="${escapeHtml(item)}">Excluir</button>` : ''}</div>`).join('') : '<p class="empty-state">Nenhum recurso cadastrado.</p>'}</div>`;
    list.innerHTML = group('Salas', 'rooms', resources.rooms) + group('Auditórios', 'auditoriums', resources.auditoriums) + group('Laboratórios', 'labs', labs.map((lab) => lab.nome));
    list.querySelectorAll('.delete-resource-btn').forEach((button) => button.addEventListener('click', () => {
      const type = button.dataset.resourceType;
      const name = button.dataset.resourceName;
      if (!window.confirm(`Excluir ${name} da base compartilhada?`)) return;
      if (type === 'labs') {
        try { const savedLabs = JSON.parse(localStorage.getItem('laboratoriosCampusSync')) || []; localStorage.setItem('laboratoriosCampusSync', JSON.stringify(savedLabs.filter((lab) => lab.nome !== name))); } catch { return; }
      } else {
        const nextResources = getSharedResources();
        nextResources[type] = nextResources[type].filter((item) => item !== name);
        saveSharedResources(nextResources);
      }
      renderSharedResources();
      window.dispatchEvent(new Event('campusSyncDataChanged'));
    }));
  }

  function getLocationOptions() {
    let labs = [];
    try {
      const savedLabs = JSON.parse(localStorage.getItem('laboratoriosCampusSync'));
      labs = Array.isArray(savedLabs) ? savedLabs.map((lab) => lab.nome).filter(Boolean) : [];
    } catch {
      labs = [];
    }
    if (!labs.length) labs = ['Laboratório de Informática 01', 'Laboratório de Química', 'Laboratório de Eletrônica'];
    const sharedResources = getSharedResources();
    const rooms = sharedResources.rooms;
    const auditoriums = sharedResources.auditoriums;
    const options = (items) => items.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    return `<option value="">Selecione um local</option><optgroup label="Laboratórios">${options(labs)}</optgroup><optgroup label="Salas">${options(rooms)}</optgroup><optgroup label="Auditórios">${options(auditoriums)}</optgroup>`;
  }

  function getVisibleEvents() {
    const defaults = (schedules[profile] || schedules.aluno).map((event) => ({ day: event[0], time: event[1], title: event[2], location: event[3], owner: profile, fixed: true }));
    const saved = getSavedEvents();
    const ownEvents = (saved[currentUsername] || []).map((event) => ({ ...event, owner: currentUsername }));
    if (profile !== 'admin') return [...defaults, ...ownEvents];
    const allEvents = Object.entries(saved).flatMap(([owner, ownerEvents]) => (ownerEvents || []).map((event) => ({ ...event, owner })));
    return [...defaults, ...allEvents];
  }

  function getMonday(offset) {
    const date = new Date();
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1 + offset * 7);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getWeekday(date) {
    return dayNames[(date.getDay() + 6) % 7];
  }

  function renderCalendar() {
    if (!calendar) return;
    const monday = getMonday(weekOffset);
    const events = getVisibleEvents();
    const today = new Date();
    calendar.innerHTML = dayNames.map((name, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const isToday = date.toDateString() === today.toDateString();
      const dateInput = formatDateInput(date);
      const dayEvents = events.filter((event) => event.date ? event.date === dateInput : event.day === name).sort((first, second) => first.time.localeCompare(second.time));
      return `<article class="calendar-day${isToday ? ' is-today' : ''}">
        <header class="calendar-day-header"><h3>${name}</h3><span class="calendar-date">${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></header>
        ${dayEvents.length ? dayEvents.map((event) => `<div class="class-event"><span class="event-time">${escapeHtml(event.time)}</span><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.location)}${profile === 'admin' && !event.fixed ? ` · ${escapeHtml(event.owner)}` : ''}</span>${!event.fixed && (profile === 'admin' || event.owner === currentUsername) ? `<button type="button" class="delete-calendar-event" data-event-id="${escapeHtml(event.id)}" data-event-owner="${escapeHtml(event.owner)}" aria-label="Excluir ${escapeHtml(event.title)}">Excluir</button>` : ''}</div>`).join('') : '<p class="empty-calendar">Livre</p>'}
      </article>`;
    }).join('');
    if (weekLabel) {
      const end = new Date(monday);
      end.setDate(monday.getDate() + 6);
      weekLabel.textContent = `${monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    const summary = document.getElementById('calendarSummary');
    if (summary) {
      const nextEvent = [...events].sort((first, second) => first.time.localeCompare(second.time))[0];
      summary.innerHTML = `<span><strong>${events.length}</strong> compromissos visíveis</span><span><strong>${events.filter((event) => event.day !== 'Sáb' && event.day !== 'Dom').length}</strong> atividades em dias úteis</span><span><strong>${nextEvent ? escapeHtml(nextEvent.time) : '--'}</strong> próximo horário</span>`;
    }
    calendar.querySelectorAll('.delete-calendar-event').forEach((button) => button.addEventListener('click', () => deleteCalendarEvent(button.dataset.eventId, button.dataset.eventOwner)));
  }

  function deleteCalendarEvent(eventId, owner) {
    if (!window.confirm('Excluir este compromisso?')) return;
    const saved = getSavedEvents();
    saved[owner] = (saved[owner] || []).filter((event) => String(event.id) !== String(eventId));
    if (!saved[owner].length) delete saved[owner];
    saveEvents(saved);
    renderCalendar();
  }

  function renderEventForm() {
    if (!calendarPanel || document.getElementById('calendarEventForm')) return;
    const form = document.createElement('form');
    form.id = 'calendarEventForm';
    form.className = 'calendar-event-form';
    form.innerHTML = `<div><strong>Novo compromisso</strong><span>Escolha a data e selecione um espaço cadastrado.</span></div><label>Data<input name="date" type="date" min="${formatDateInput(new Date())}" value="${formatDateInput(new Date())}" required></label><label>Horário<input name="time" type="time" required></label><label>Compromisso<input name="title" type="text" placeholder="Ex.: Estudo para prova" required></label><label>Local<select name="location" required>${getLocationOptions()}</select></label><div class="calendar-event-form-actions"><button class="primary-btn" type="submit">Adicionar</button><button class="secondary-btn" id="cancelCalendarEvent" type="button">Cancelar</button></div>`;
    calendarPanel.insertBefore(form, calendarPanel.querySelector('.calendar-grid'));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const saved = getSavedEvents();
      const ownerEvents = saved[currentUsername] || [];
      const selectedDate = new Date(`${data.get('date')}T12:00:00`);
      ownerEvents.push({ id: `${currentUsername}-${Date.now()}`, date: data.get('date'), day: getWeekday(selectedDate), time: data.get('time'), title: data.get('title').toString().trim(), location: data.get('location').toString().trim() });
      saved[currentUsername] = ownerEvents;
      saveEvents(saved);
      form.remove();
      renderCalendar();
    });
    document.getElementById('cancelCalendarEvent').addEventListener('click', () => form.remove());
  }

  function renderNotifications() {
    if (!notificationPanel) return;
    notificationPanel.innerHTML = `<h3>Notificações</h3>${(notifications[profile] || []).map((item) => `<div class="notification-item"><span>●</span><div><strong>${item[0]}</strong>${item[1]}</div></div>`).join('')}`;
  }

  function getAttendanceStudents() {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('usuariosCampusSync')) || [];
      const alunos = Array.isArray(savedUsers) ? savedUsers.filter((user) => user.perfil === 'aluno') : [];
      if (alunos.length) {
        return alunos.map((student) => ({
          usuario: student.usuario,
          nome: student.nome || student.usuario,
          status: 'Presente'
        }));
      }
    } catch {
      // ignora e usa lista padrão
    }

    return [
      { usuario: 'ana.silva', nome: 'Ana Silva', status: 'Presente' },
      { usuario: 'bruno.souza', nome: 'Bruno Souza', status: 'Presente' },
      { usuario: 'carlos.menezes', nome: 'Carlos Menezes', status: 'Presente' },
      { usuario: 'daniela.oliveira', nome: 'Daniela Oliveira', status: 'Presente' },
      { usuario: 'eduardo.ferreira', nome: 'Eduardo Ferreira', status: 'Presente' },
      { usuario: 'fernanda.rios', nome: 'Fernanda Rios', status: 'Presente' }
    ];
  }

  function getAttendanceRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(attendanceStorageKey));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveAttendanceRecords(records) {
    localStorage.setItem(attendanceStorageKey, JSON.stringify(records));
  }

  function getAvailableRooms() {
    const resources = getSharedResources();
    const labs = (() => {
      try {
        const saved = JSON.parse(localStorage.getItem('laboratoriosCampusSync')) || [];
        return Array.isArray(saved) ? saved.map((lab) => lab.nome).filter(Boolean) : [];
      } catch {
        return [];
      }
    })();

    return [...resources.rooms, ...resources.auditoriums, ...labs];
  }

  function getAttendanceOptions() {
    return {
      turmas: ['ADS - 1º Semestre', 'ADS - 2º Semestre', 'ADS - 3º Semestre', 'Sistemas de Informação - 1º Semestre', 'Sistemas de Informação - 2º Semestre'],
      disciplinas: ['Banco de Dados', 'Engenharia de Software', 'Física Aplicada', 'Matemática Discreta', 'Sistemas Distribuídos', 'Projeto Integrador'],
      locais: ['Bloco A', 'Bloco B', 'Bloco C', 'Bloco D', 'Laboratório de Informática', 'Laboratório de Redes', 'Auditório principal']
    };
  }

  function renderAttendancePanel() {
    if (!['professor', 'coordenador', 'admin'].includes(profile)) return;

    if (document.getElementById('attendancePanel')) {
      renderAttendanceList();
      return;
    }

    const panel = document.createElement('section');
    panel.id = 'attendancePanel';
    panel.className = 'attendance-panel';
    const canEditAttendance = profile === 'professor';
    panel.innerHTML = `
      <div class="attendance-header">
        <div>
          <span class="card-label">Lista de chamada</span>
          <h2>${canEditAttendance ? 'Controle de presença' : 'Chamadas registradas'}</h2>
          <p>${canEditAttendance ? 'Registre a presença da turma e finalize para guardar no histórico.' : 'Visualize as chamadas finalizadas pelos professores.'}</p>
        </div>
        ${canEditAttendance ? '<button class="primary-btn" type="button" id="startAttendanceButton">Iniciar chamada</button>' : ''}
      </div>

      ${canEditAttendance ? `<form id="attendanceForm" class="attendance-form" hidden>
        <input type="hidden" id="attendanceId" name="attendanceId" />
        <label>Data<input id="attendanceDate" name="attendanceDate" type="date" required /></label>
        <label>Turma<select id="attendanceClass" name="attendanceClass" required></select></label>
        <label>Disciplina<select id="attendanceSubject" name="attendanceSubject" required></select></label>
        <label>Sala<select id="attendanceRoom" name="attendanceRoom" required></select></label>
        <label>Local<select id="attendanceLocation" name="attendanceLocation" required></select></label>
        <div class="attendance-student-field">
          <span class="attendance-field-label">Alunos da turma</span>
          <div id="attendanceStudentList" class="attendance-student-list"></div>
        </div>
        <div class="attendance-form-actions">
          <button class="primary-btn" type="submit" id="saveAttendanceBtn">Finalizar chamada</button>
          <button class="secondary-btn" type="button" id="cancelAttendanceEdit">Cancelar</button>
        </div>
      </form>` : ''}

      <div class="attendance-history-heading">
        <h3>Histórico de chamadas</h3>
        <span>As chamadas ficam minimizadas após o encerramento.</span>
      </div>
      <div id="attendanceRecordList" class="attendance-record-list"></div>
    `;

    const target = document.querySelector('.calendar-panel') || document.querySelector('.lab-visual-panel') || document.querySelector('.insight-panel');
    if (target && target.parentNode) target.parentNode.insertBefore(panel, target.nextSibling);

    if (!canEditAttendance) {
      renderAttendanceList();
      return;
    }

    const roomSelect = document.getElementById('attendanceRoom');
    const attendanceOptions = getAttendanceOptions();
    const fillSelect = (selectId, placeholder, values) => {
      const select = document.getElementById(selectId);
      select.innerHTML = [`<option value="">${placeholder}</option>`, ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join('');
      return select;
    };
    const classSelect = fillSelect('attendanceClass', 'Selecione a turma', attendanceOptions.turmas);
    const subjectSelect = fillSelect('attendanceSubject', 'Selecione a disciplina', attendanceOptions.disciplinas);
    fillSelect('attendanceRoom', 'Selecione a sala', getAvailableRooms());
    const locationSelect = fillSelect('attendanceLocation', 'Selecione o local', attendanceOptions.locais);
    classSelect.value = 'ADS - 3º Semestre';
    subjectSelect.value = 'Sistemas Distribuídos';
    roomSelect.value = 'Sala 204';
    locationSelect.value = 'Bloco B';
    document.getElementById('attendanceDate').value = formatDateInput(new Date());

    document.getElementById('startAttendanceButton').addEventListener('click', () => {
      resetAttendanceForm();
      document.getElementById('attendanceForm').hidden = false;
      document.getElementById('startAttendanceButton').hidden = true;
      document.getElementById('attendanceDate').focus();
    });

    document.getElementById('attendanceForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const recordId = formData.get('attendanceId')?.toString();
      const attendanceDate = formData.get('attendanceDate')?.toString();
      const turma = formData.get('attendanceClass')?.toString().trim();
      const disciplina = formData.get('attendanceSubject')?.toString().trim();
      const sala = formData.get('attendanceRoom')?.toString().trim();
      const local = formData.get('attendanceLocation')?.toString().trim();
      const alunos = [...document.querySelectorAll('#attendanceStudentList select[data-user]')].map((select) => ({
        usuario: select.dataset.user,
        nome: select.dataset.name,
        status: select.value
      }));

      if (!attendanceDate || !turma || !disciplina || !sala || !local || !alunos.length) return;

      const records = getAttendanceRecords();

      if (recordId) {
        const index = records.findIndex((record) => record.id === recordId);
        if (index !== -1) {
          records[index] = { ...records[index], date: attendanceDate, turma, disciplina, sala, local, alunos };
        }
      } else {
        records.unshift({ id: `attendance-${Date.now()}`, date: attendanceDate, turma, disciplina, sala, local, alunos });
      }

      saveAttendanceRecords(records);
      form.reset();
      document.getElementById('attendanceId').value = '';
      document.getElementById('attendanceDate').value = formatDateInput(new Date());
      document.getElementById('attendanceClass').value = 'ADS - 3º Semestre';
      document.getElementById('attendanceSubject').value = 'Sistemas Distribuídos';
      document.getElementById('attendanceLocation').value = 'Bloco B';
      roomSelect.value = 'Sala 204';
      document.getElementById('saveAttendanceBtn').textContent = 'Finalizar chamada';
      document.getElementById('attendanceForm').hidden = true;
      document.getElementById('startAttendanceButton').hidden = false;
      renderAttendanceList();
    });

    document.getElementById('cancelAttendanceEdit').addEventListener('click', () => {
      document.getElementById('attendanceForm').reset();
      document.getElementById('attendanceId').value = '';
      document.getElementById('attendanceDate').value = formatDateInput(new Date());
      document.getElementById('attendanceClass').value = 'ADS - 3º Semestre';
      document.getElementById('attendanceSubject').value = 'Sistemas Distribuídos';
      document.getElementById('attendanceLocation').value = 'Bloco B';
      roomSelect.value = 'Sala 204';
      document.getElementById('saveAttendanceBtn').textContent = 'Finalizar chamada';
      document.getElementById('attendanceForm').hidden = true;
      document.getElementById('startAttendanceButton').hidden = false;
    });

    function resetAttendanceForm(record = null) {
      const form = document.getElementById('attendanceForm');
      form.reset();
      document.getElementById('attendanceId').value = record?.id || '';
      document.getElementById('attendanceDate').value = record?.date || formatDateInput(new Date());
      ensureAttendanceOption('attendanceClass', record?.turma || 'ADS - 3º Semestre');
      ensureAttendanceOption('attendanceSubject', record?.disciplina || 'Sistemas Distribuídos');
      ensureAttendanceOption('attendanceLocation', record?.local || 'Bloco B');
      document.getElementById('attendanceClass').value = record?.turma || 'ADS - 3º Semestre';
      document.getElementById('attendanceSubject').value = record?.disciplina || 'Sistemas Distribuídos';
      document.getElementById('attendanceLocation').value = record?.local || 'Bloco B';
      ensureAttendanceOption('attendanceRoom', record?.sala || 'Sala 204');
      roomSelect.value = record?.sala || 'Sala 204';
      document.getElementById('saveAttendanceBtn').textContent = record ? 'Finalizar alterações' : 'Finalizar chamada';
      renderAttendanceStudents(record?.alunos || getAttendanceStudents());
    }

    function ensureAttendanceOption(selectId, value) {
      const select = document.getElementById(selectId);
      if (!value || Array.from(select.options).some((option) => option.value === value)) return;
      select.add(new Option(value, value));
    }

    function renderAttendanceStudents(students) {
      const studentList = document.getElementById('attendanceStudentList');
      if (!studentList) return;
      studentList.innerHTML = students.length ? students.map((student) => `
        <label class="attendance-student-row">
          <span><strong>${escapeHtml(student.nome)}</strong><small>${escapeHtml(student.usuario)}</small></span>
          <select data-user="${escapeHtml(student.usuario)}" data-name="${escapeHtml(student.nome)}" aria-label="Presença de ${escapeHtml(student.nome)}">
            ${['Presente', 'Ausente', 'Atrasado', 'Justificado'].map((status) => `<option value="${status}" ${student.status === status ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
        </label>
      `).join('') : '<p class="empty-state">Nenhum aluno cadastrado para esta turma.</p>';
    }

    renderAttendanceList();
  }

  function renderAttendanceList() {
    const list = document.getElementById('attendanceRecordList');
    if (!list) return;

    const records = getAttendanceRecords();
    const canEditAttendance = profile === 'professor';

    list.innerHTML = records.length ? records.map((record) => `
      <details class="attendance-record-card">
        <summary class="attendance-record-head">
          <div>
            <strong>${escapeHtml(record.turma)}</strong>
            <small>${new Date(`${record.date}T12:00:00`).toLocaleDateString('pt-BR')} · ${escapeHtml(record.disciplina)}</small>
          </div>
          <div class="attendance-record-meta">
            <span>${escapeHtml(record.sala)}</span>
            <span>${escapeHtml(record.local)}</span>
          </div>
        </summary>
        <div class="attendance-record-body">
          <div class="attendance-summary" aria-label="Resumo da presença">
            <span><strong>${record.alunos.length}</strong> alunos</span>
            <span><strong>${record.alunos.filter((student) => student.status === 'Presente').length}</strong> presentes</span>
            <span><strong>${record.alunos.filter((student) => student.status === 'Ausente').length}</strong> ausentes</span>
          </div>
          ${canEditAttendance ? `<div class="attendance-actions">
            <button type="button" class="secondary-btn" data-action="edit-attendance" data-record-id="${escapeHtml(record.id)}">Editar</button>
            <button type="button" class="delete-btn" data-action="delete-attendance" data-record-id="${escapeHtml(record.id)}">Excluir</button>
          </div>` : ''}
        <table class="attendance-table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Presença</th>
            </tr>
          </thead>
          <tbody>
            ${record.alunos.map((student) => `
              <tr>
                <td>${escapeHtml(student.nome)}</td>
                <td>
                  ${canEditAttendance ? `<select class="attendance-status-select" data-record-id="${escapeHtml(record.id)}" data-user="${escapeHtml(student.usuario)}">
                    ${['Presente', 'Ausente', 'Atrasado', 'Justificado'].map((status) => `<option value="${status}" ${student.status === status ? 'selected' : ''}>${status}</option>`).join('')}
                  </select>` : `<span class="attendance-status-text">${escapeHtml(student.status)}</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      </details>
    `).join('') : '<div class="empty-state">Nenhuma chamada registrada.</div>';

    list.querySelectorAll('[data-action="edit-attendance"]').forEach((button) => {
      button.addEventListener('click', () => {
        const recordId = button.dataset.recordId;
        const record = getAttendanceRecords().find((item) => item.id === recordId);
        if (!record) return;

        const form = document.getElementById('attendanceForm');
        const roomSelect = document.getElementById('attendanceRoom');
        if (!Array.from(roomSelect.options).some((option) => option.value === record.sala)) {
          const option = new Option(record.sala, record.sala);
          roomSelect.add(option);
        }
        resetAttendanceForm(record);
        document.getElementById('attendanceForm').hidden = false;
        document.getElementById('startAttendanceButton').hidden = true;
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    list.querySelectorAll('[data-action="delete-attendance"]').forEach((button) => {
      button.addEventListener('click', () => {
        const recordId = button.dataset.recordId;
        if (!window.confirm('Excluir esta lista de chamada? Esta ação não pode ser desfeita.')) return;
        const records = getAttendanceRecords().filter((record) => record.id !== recordId);
        saveAttendanceRecords(records);
        renderAttendanceList();
      });
    });

    list.querySelectorAll('.attendance-status-select').forEach((select) => {
      select.addEventListener('change', (event) => {
        const recordId = event.currentTarget.dataset.recordId;
        const user = event.currentTarget.dataset.user;
        const status = event.currentTarget.value;
        const records = getAttendanceRecords();
        const record = records.find((item) => item.id === recordId);
        if (!record) return;
        const student = record.alunos.find((item) => item.usuario === user);
        if (!student) return;
        student.status = status;
        saveAttendanceRecords(records);
      });
    });
  }

  function exportSchedule() {
    const events = getVisibleEvents();
    const profileNames = { aluno: 'Aluno', professor: 'Professor', coordenador: 'Coordenador', admin: 'Administração' };
    const rows = events.map((event) => `<tr><td>${escapeHtml(event.day)}</td><td>${escapeHtml(event.time)}</td><td>${escapeHtml(event.title)}</td><td>${escapeHtml(event.location)}${profile === 'admin' && !event.fixed ? ` · ${escapeHtml(event.owner)}` : ''}</td></tr>`).join('');
    const reservationRows = getRoomReservations().map((reservation) => `<tr><td>${escapeHtml(reservation.room)}</td><td>${new Date(`${reservation.date}T12:00:00`).toLocaleDateString('pt-BR')}</td><td>${escapeHtml(reservation.start)} às ${escapeHtml(reservation.end)}</td><td>${escapeHtml(reservation.owner)}</td></tr>`).join('');
    const reportWindow = window.open('', '_blank', 'width=1000,height=750');
    if (!reportWindow) {
      window.alert('Permita pop-ups para gerar a agenda em PDF.');
      return;
    }
    reportWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Agenda CampusSync</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#172b43;margin:0}.header{border-bottom:4px solid #e26d3f;padding-bottom:18px;margin-bottom:24px}.brand{font-size:25px;font-weight:800;color:#155fa0}.brand span{color:#172b43}h1{font-size:28px;margin:28px 0 8px}h2{color:#155fa0;font-size:17px;margin:28px 0 8px}p{color:#526578}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#155fa0;color:#fff;text-align:left;text-transform:uppercase;font-size:10px}th,td{padding:10px;border:1px solid #dce8f2}tr:nth-child(even){background:#f5f9fc}.footer{margin-top:28px;padding-top:10px;border-top:1px solid #dce8f2;color:#748494;font-size:10px}</style></head><body><div class="header"><div class="brand">Campus<span>Sync</span></div><h1>Agenda semanal</h1><p>Perfil: <strong>${escapeHtml(profileNames[profile] || profile)}</strong><br>Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</p></div><table><thead><tr><th>Dia</th><th>Horário</th><th>Atividade</th><th>Local</th></tr></thead><tbody>${rows}</tbody></table><h2>Reservas de salas</h2><table><thead><tr><th>Sala</th><th>Data</th><th>Horário</th><th>Responsável</th></tr></thead><tbody>${reservationRows || '<tr><td colspan="4">Nenhuma reserva registrada.</td></tr>'}</tbody></table><div class="footer">CampusSync · Agenda acadêmica · Documento preparado para salvar como PDF</div></body></html>`);
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

  function excelCell(value) {
    const text = String(value ?? '');
    const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return escapeHtml(safeText);
  }

  function exportUsersToExcel() {
    const headers = ['Nome', 'Usuário', 'E-mail', 'Perfil', 'Status', 'Último acesso', 'Criado em', 'Senha configurada', 'Proteção da senha'];
    const rows = getUsers().map((user) => {
      const hasPassword = Boolean(user.passwordHash || user.senha);
      const passwordProtection = user.passwordHash ? 'Hash SHA-256 armazenado' : user.senha ? 'Senha legada não exportada' : 'Não configurada';
      return [
        user.nome,
        user.usuario,
        user.email,
        user.perfil,
        user.status || 'Ativo',
        user.acesso || 'Ainda não acessou',
        user.criadoEm ? new Date(user.criadoEm).toLocaleString('pt-BR') : 'Não informado',
        hasPassword ? 'Sim' : 'Não',
        passwordProtection
      ];
    });
    const table = `<table><thead><tr>${headers.map((header) => `<th>${excelCell(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${excelCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const workbook = `<!doctype html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial,sans-serif}th,td{border:1px solid #b8c4d3;padding:7px;text-align:left}th{background:#0d3b66;color:#fff}td{mso-number-format:"\\@"}</style></head><body><h2>Base de usuários CampusSync</h2><p>Senhas e hashes não são exportados por segurança.</p>${table}</body></html>`;
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([`\ufeff${workbook}`], { type: 'application/vnd.ms-excel;charset=utf-8' }));
    link.href = url;
    link.download = `base-usuarios-campussync-${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadReport(type) {
    const labs = (() => { try { const saved = JSON.parse(localStorage.getItem('laboratoriosCampusSync')); return Array.isArray(saved) ? saved : []; } catch { return []; } })();
    const users = getUsers();
    const resources = getSharedResources();
    const reservations = getRoomReservations();
    const generatedAt = new Date().toLocaleString('pt-BR');
    const reportNames = { campus: 'Relatório executivo do campus', users: 'Relatório de usuários', labs: 'Relatório de laboratórios' };
    const reportTitle = reportNames[type] || reportNames.campus;
    const profileNames = { aluno: 'Aluno', professor: 'Professor', coordenador: 'Coordenador', admin: 'Administração' };
    const scheduleRows = getVisibleEvents().map((item) => `<tr><td>${escapeHtml(item.day)}</td><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.location)}${profile === 'admin' && !item.fixed ? ` · ${escapeHtml(item.owner)}` : ''}</td></tr>`).join('');
    const userRows = users.map((item) => `<tr><td>${escapeHtml(item.nome)}</td><td>${escapeHtml(item.usuario)}</td><td>${escapeHtml(item.perfil)}</td><td><span class="tag">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.acesso)}</td></tr>`).join('');
    const labRows = labs.length ? labs.map((item) => `<tr><td>${escapeHtml(item.nome)}</td><td>${escapeHtml(item.bloco)}</td><td>${escapeHtml(item.tipo)}</td><td>${escapeHtml(item.capacidade)}</td><td><span class="tag">${escapeHtml(item.status)}</span></td></tr>`).join('') : '<tr><td colspan="5">Nenhum laboratório cadastrado.</td></tr>';
    const resourceRows = [...resources.rooms.map((name) => ['Sala', name]), ...resources.auditoriums.map((name) => ['Auditório', name]), ...labs.map((lab) => ['Laboratório', lab.nome])].map((item) => `<tr><td>${escapeHtml(item[0])}</td><td>${escapeHtml(item[1])}</td><td>Disponível na base compartilhada</td></tr>`).join('');
    const reservationRows = reservations.length ? reservations.map((item) => `<tr><td>${escapeHtml(item.room)}</td><td>${new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR')}</td><td>${escapeHtml(item.start)} às ${escapeHtml(item.end)}</td><td>${escapeHtml(item.owner)}</td></tr>`).join('') : '<tr><td colspan="4">Nenhuma reserva registrada.</td></tr>';
    const attendanceRecords = getAttendanceRecords();
    const attendanceRows = attendanceRecords.length ? attendanceRecords.map((record) => `
      <tr>
        <td>${escapeHtml(record.date)}</td>
        <td>${escapeHtml(record.turma)}</td>
        <td>${escapeHtml(record.disciplina)}</td>
        <td>${escapeHtml(record.sala)}</td>
        <td>${escapeHtml(record.local)}</td>
        <td>${record.alunos.map((student) => `${escapeHtml(student.nome)}: ${escapeHtml(student.status)}`).join('<br>')}</td>
      </tr>
    `).join('') : '<tr><td colspan="6">Nenhuma chamada registrada.</td></tr>';
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
      ${type === 'campus' || type === 'labs' ? `<section class="section"><h2>Laboratórios e recursos</h2><table><thead><tr><th>Laboratório</th><th>Bloco</th><th>Tipo</th><th>Capacidade</th><th>Status</th></tr></thead><tbody>${labRows}</tbody></table><h3>Base compartilhada</h3><table><thead><tr><th>Tipo</th><th>Nome</th><th>Situação</th></tr></thead><tbody>${resourceRows}</tbody></table></section>` : ''}
      ${type === 'campus' ? `<section class="section"><h2>Reservas de salas</h2><table><thead><tr><th>Espaço</th><th>Data</th><th>Horário</th><th>Responsável</th></tr></thead><tbody>${reservationRows}</tbody></table></section>` : ''}
      ${type === 'campus' ? `<section class="section"><h2>Lista de chamada</h2><table><thead><tr><th>Data</th><th>Turma</th><th>Disciplina</th><th>Sala</th><th>Local</th><th>Alunos</th></tr></thead><tbody>${attendanceRows}</tbody></table></section>` : ''}
      <section class="section"><h2>Agenda do perfil</h2><table><thead><tr><th>Dia</th><th>Horário</th><th>Atividade</th><th>Local</th></tr></thead><tbody>${scheduleRows}</tbody></table></section><div class="footer">CampusSync · Sistema de Ensalamento Universitário · Relatório gerado automaticamente</div></main></body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.addEventListener('afterprint', () => reportWindow.close());
    reportWindow.setTimeout(() => reportWindow.print(), 350);
  }

  document.getElementById('previousWeek')?.addEventListener('click', () => { weekOffset -= 1; renderCalendar(); });
  document.getElementById('nextWeek')?.addEventListener('click', () => { weekOffset += 1; renderCalendar(); });
  document.getElementById('todayWeek')?.addEventListener('click', () => { weekOffset = 0; renderCalendar(); });
  document.getElementById('addCalendarEvent')?.addEventListener('click', renderEventForm);
  document.getElementById('exportSchedule')?.addEventListener('click', exportSchedule);
  document.getElementById('printSchedule')?.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-report]').forEach((button) => button.addEventListener('click', () => downloadReport(button.dataset.report)));
  userSearch?.addEventListener('input', renderUsers);
  userProfileFilter?.addEventListener('change', renderUsers);
  document.getElementById('addDemoUser')?.addEventListener('click', () => {
    const users = getUsers();
    const nextNumber = users.length + 1;
    users.push({ usuario: `novo.usuario${nextNumber}`, nome: `Novo usuário ${nextNumber}`, email: `novo.usuario${nextNumber}@campussync.edu.br`, perfil: 'aluno', status: 'Ativo', acesso: 'Ainda não acessou', senha: '123456' });
    localStorage.setItem('usuariosCampusSync', JSON.stringify(users));
    renderUsers();
  });
  document.getElementById('exportUsersDatabase')?.addEventListener('click', exportUsersToExcel);
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
  renderAttendancePanel();
  setupRoomReservations();
  setupSharedResources();
  window.addEventListener('campusSyncDataChanged', () => {
    renderSharedResources();
    renderRoomReservations();
    renderAttendancePanel();
  });
  window.addEventListener('storage', (event) => {
    if ([resourcesStorageKey, 'laboratoriosCampusSync', roomReservationsKey].includes(event.key)) {
      renderSharedResources();
      renderRoomReservations();
    }
  });
})();
