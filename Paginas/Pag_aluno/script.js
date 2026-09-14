const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');
const studentLabFilter = document.getElementById('studentLabFilter');
const studentLabList = document.getElementById('studentLabList');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebarAluno');

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
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return Array.isArray(saved) && saved.length
    ? saved
    : [
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
  const labs = getLabs().filter((lab) => selected === 'todos' || lab.status === selected);

  if (!labs.length) {
    studentLabList.innerHTML = '<div class="empty-state">Nenhum laboratório encontrado para este filtro.</div>';
    return;
  }

  studentLabList.innerHTML = labs
    .map(
      (lab) => `
        <article class="lab-visual-item">
          <div style="display:flex; gap: 1rem; flex-wrap: wrap; align-items:flex-start;">
            ${lab.foto ? `<img class="lab-photo" src="${lab.foto}" alt="${lab.nome}" />` : '<div class="lab-photo" style="display:flex;align-items:center;justify-content:center;color:#3d6db5;font-size:0.8rem;">Foto</div>'}
            <div>
              <h3>${lab.nome}</h3>
              <p>Bloco: ${lab.bloco}</p>
              <p>Tipo: ${lab.tipo}</p>
              <p>Capacidade: ${lab.capacidade} alunos</p>
              <p>Equipamentos: ${lab.equipamentos}</p>
            </div>
          </div>
          <div class="lab-visual-meta">
            <span class="status-badge ${lab.status === 'Em uso' ? 'warning-badge' : ''}">${lab.status}</span>
          </div>
        </article>
      `
    )
    .join('');
}

studentLabFilter.addEventListener('change', renderStudentLabs);

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioLogado');
    sessionStorage.clear();
    window.location.replace('../Pagina_login/index.html');
  });
}

renderStudentLabs();
