const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');
const teacherLabFilter = document.getElementById('teacherLabFilter');
const teacherLabList = document.getElementById('teacherLabList');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebarProfessor');
const { getLoggedUser, getLabs, escapeHtml, logout } = window.CampusSync;

const user = getLoggedUser();

if (user) {
  userBadge.textContent = `${user.perfil.toUpperCase()} • ${user.usuario}`;
} else {
  userBadge.textContent = 'Visitante';
  window.location.replace('../Pagina_login/index.html');
}

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
  });
}

function renderTeacherLabs() {
  const selected = teacherLabFilter.value;
  const labs = getLabs().filter((lab) => selected === 'todos' || lab.status === selected);

  if (!labs.length) {
    teacherLabList.innerHTML = '<div class="empty-state">Nenhum laboratório encontrado para este filtro.</div>';
    return;
  }

  teacherLabList.innerHTML = labs
    .map(
      (lab) => `
        <article class="lab-visual-item">
          <div style="display:flex; gap: 1rem; flex-wrap: wrap; align-items:flex-start;">
            ${lab.foto ? `<img class="lab-photo" src="${escapeHtml(lab.foto)}" alt="${escapeHtml(lab.nome)}" />` : '<div class="lab-photo" style="display:flex;align-items:center;justify-content:center;color:#3d6db5;font-size:0.8rem;">Foto</div>'}
            <div>
              <h3>${escapeHtml(lab.nome)}</h3>
              <p>Bloco: ${escapeHtml(lab.bloco)}</p>
              <p>Tipo: ${escapeHtml(lab.tipo)}</p>
              <p>Capacidade: ${escapeHtml(lab.capacidade)} alunos</p>
              <p>Equipamentos: ${escapeHtml(lab.equipamentos)}</p>
              <p>Observações: ${escapeHtml(lab.observacoes || 'Sem observações')}</p>
            </div>
          </div>
          <div class="lab-visual-meta">
            <span class="status-badge ${lab.status === 'Em uso' ? 'warning-badge' : ''}">${escapeHtml(lab.status)}</span>
          </div>
        </article>
      `
    )
    .join('');
}

teacherLabFilter.addEventListener('change', renderTeacherLabs);

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

renderTeacherLabs();
