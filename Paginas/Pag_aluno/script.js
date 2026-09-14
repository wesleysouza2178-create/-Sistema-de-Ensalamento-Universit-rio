const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');
const studentLabFilter = document.getElementById('studentLabFilter');
const studentLabSearch = document.getElementById('studentLabSearch');
const studentLabSort = document.getElementById('studentLabSort');
const studentLabStats = document.getElementById('studentLabStats');
const studentLabList = document.getElementById('studentLabList');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebarAluno');
const reservationsKey = 'reservasAlunoCampusSync';

function getUsuarioLogado() {
  const localUser = localStorage.getItem('usuarioLogado');
  const sessionUser = sessionStorage.getItem('usuarioLogado');
  const rawUser = localUser || sessionUser;

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

const user = getUsuarioLogado();

if (user) {
  userBadge.textContent = `${user.perfil.toUpperCase()} • ${user.usuario}`;
} else {
  userBadge.textContent = 'Visitante';
  window.location.replace('../Pagina_login/index.html');
}

const STORAGE_KEY = 'laboratoriosCampusSync';

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
  });
}

function getLabs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : getDefaultLabs();
  } catch {
    return getDefaultLabs();
  }
}

function getDefaultLabs() {
  return [
        {
          id: 1,
          nome: 'Laboratório de Informática 01',
          bloco: 'Bloco A',
          capacidade: 30,
          tipo: 'Informática',
          equipamentos: '20 computadores, projetor, impressora',
          status: 'Disponível',
          observacoes: 'Acesso por credencial da turma.'
        },
        {
          id: 2,
          nome: 'Laboratório de Química',
          bloco: 'Bloco C',
          capacidade: 24,
          tipo: 'Química',
          equipamentos: 'Bancadas, ventilação, microscópio',
          status: 'Em uso',
          observacoes: 'Reservado para aulas práticas.'
        },
        {
          id: 3,
          nome: 'Laboratório de Eletrônica',
          bloco: 'Bloco D',
          capacidade: 18,
          tipo: 'Eletrônica',
          equipamentos: 'Osciloscópios, protoboards, soldagem',
          status: 'Em manutenção',
          observacoes: 'Acesso restrito até revisão.'
        }
  ];
}

function renderStudentLabs() {
  const selected = studentLabFilter.value;
  const search = studentLabSearch?.value.trim().toLowerCase() || '';
  const sortBy = studentLabSort?.value || 'nome';
  const allLabs = getLabs();
  const labs = allLabs
    .filter((lab) => selected === 'todos' || lab.status === selected)
    .filter((lab) => !search || `${lab.nome} ${lab.bloco} ${lab.tipo} ${lab.equipamentos}`.toLowerCase().includes(search))
    .sort((first, second) => {
      if (sortBy === 'capacidade') return Number(second.capacidade) - Number(first.capacidade);
      if (sortBy === 'status') return first.status.localeCompare(second.status);
      return first.nome.localeCompare(second.nome);
    });

  if (studentLabStats) {
    const available = allLabs.filter((lab) => lab.status === 'Disponível').length;
    const inUse = allLabs.filter((lab) => lab.status === 'Em uso').length;
    const maintenance = allLabs.filter((lab) => lab.status === 'Em manutenção').length;
    studentLabStats.innerHTML = `<span><strong>${allLabs.length}</strong>Total</span><span class="is-available"><strong>${available}</strong>Disponíveis</span><span class="is-use"><strong>${inUse}</strong>Em uso</span><span class="is-maintenance"><strong>${maintenance}</strong>Manutenção</span>`;
  }

  if (!labs.length) {
    studentLabList.innerHTML = '<div class="empty-state">Nenhum laboratório encontrado para este filtro.</div>';
    return;
  }

  const reservations = getReservations();
  studentLabList.innerHTML = labs
    .map(
      (lab) => `
        <article class="lab-visual-item">
          <div style="display:flex; gap: 1rem; flex-wrap: wrap; align-items:flex-start;">
            ${lab.foto ? `<img class="lab-photo" src="${lab.foto}" alt="${escapeHtml(lab.nome)}" />` : '<div class="lab-photo" style="display:flex;align-items:center;justify-content:center;color:#3d6db5;font-size:0.8rem;">Foto</div>'}
            <div>
              <h3>${escapeHtml(lab.nome)}</h3>
              <div class="lab-detail-grid"><p><strong>Local</strong>${escapeHtml(lab.bloco)}</p><p><strong>Tipo</strong>${escapeHtml(lab.tipo)}</p><p><strong>Capacidade</strong>${escapeHtml(lab.capacidade)} alunos</p></div>
              <p class="lab-equipment"><strong>Equipamentos</strong>${escapeHtml(lab.equipamentos)}</p>
            </div>
          </div>
          <div class="lab-visual-meta">
            <span class="status-badge ${lab.status === 'Em uso' ? 'warning-badge' : ''}">${lab.status}</span>
            ${lab.status === 'Disponível' ? `<button type="button" class="lab-reserve-btn ${reservations.includes(String(lab.id)) ? 'is-reserved' : ''}" data-lab-id="${lab.id}">${reservations.includes(String(lab.id)) ? 'Cancelar reserva' : 'Reservar'}</button>` : '<small class="lab-unavailable">Indisponível para reserva</small>'}
          </div>
        </article>
      `
    )
    .join('');

  studentLabList.querySelectorAll('.lab-reserve-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const labId = String(button.dataset.labId);
      const reservations = getReservations();
      const nextReservations = reservations.includes(labId) ? reservations.filter((item) => item !== labId) : [...reservations, labId];
      localStorage.setItem(reservationsKey, JSON.stringify(nextReservations));
      renderStudentLabs();
    });
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function getReservations() {
  try {
    const reservations = JSON.parse(localStorage.getItem(reservationsKey));
    return Array.isArray(reservations) ? reservations : [];
  } catch {
    return [];
  }
}

studentLabFilter.addEventListener('change', renderStudentLabs);
studentLabSearch?.addEventListener('input', renderStudentLabs);
studentLabSort?.addEventListener('change', renderStudentLabs);
window.addEventListener('campusSyncDataChanged', renderStudentLabs);
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) renderStudentLabs();
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioLogado');
    window.location.replace('../Pagina_login/index.html');
  });
}

renderStudentLabs();
