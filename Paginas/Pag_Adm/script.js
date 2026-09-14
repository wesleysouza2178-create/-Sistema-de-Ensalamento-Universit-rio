const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');
const labForm = document.getElementById('labForm');
const labList = document.getElementById('labList');
const resetLabsBtn = document.getElementById('resetLabsBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebarAdmin');
const photoInput = document.getElementById('fotoLaboratorio');
const previewImage = document.getElementById('labPreviewImage');
const previewWrapper = document.getElementById('labPhotoPreview');
const cancelEditBtn = document.getElementById('cancelAdminEditBtn');
const saveLabBtn = document.getElementById('adminSaveLabBtn');
const labFeedback = document.getElementById('adminLabFeedback');
const { getLoggedUser, getLabs, saveLabs, escapeHtml, logout } = window.CampusSync;
const STORAGE_KEY = 'laboratoriosCampusSync';

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

function showFeedback(text) {
  if (!labFeedback) return;
  labFeedback.textContent = text;
  window.setTimeout(() => { labFeedback.textContent = ''; }, 3500);
}

function clearEditMode() {
  labForm.reset();
  document.getElementById('labIdEdit').value = '';
  previewWrapper.style.display = 'none';
  previewImage.src = '';
  if (photoInput) photoInput.value = '';
  if (saveLabBtn) saveLabBtn.textContent = 'Adicionar laboratório';
}

function startEdit(lab) {
  document.getElementById('labIdEdit').value = lab.id;
  document.getElementById('nomeLaboratorio').value = lab.nome;
  document.getElementById('blocoLaboratorio').value = lab.bloco;
  document.getElementById('capacidadeLaboratorio').value = lab.capacidade;
  document.getElementById('tipoLaboratorio').value = lab.tipo;
  document.getElementById('equipamentosLaboratorio').value = lab.equipamentos;
  document.getElementById('statusLaboratorio').value = lab.status;
  document.getElementById('obsLaboratorio').value = lab.observacoes || '';
  if (lab.foto) { previewWrapper.style.display = 'block'; previewImage.src = lab.foto; }
  if (saveLabBtn) saveLabBtn.textContent = 'Atualizar laboratório';
  document.getElementById('nomeLaboratorio').focus();
  labForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderLabs() {
  const labs = getLabs();

  if (!labs.length) {
    labList.innerHTML = '<div class="empty-state">Nenhum laboratório cadastrado ainda.</div>';
    return;
  }

  labList.innerHTML = labs
    .map(
      (lab, index) => `
        <article class="lab-item">
          <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
            ${lab.foto ? `<img class="lab-photo" src="${escapeHtml(lab.foto)}" alt="${escapeHtml(lab.nome)}" />` : '<div class="lab-photo" style="display:flex;align-items:center;justify-content:center;color:#3d6db5;font-size:0.8rem;">Foto</div>'}
            <div>
              <strong>${escapeHtml(lab.nome)}</strong>
              <div class="lab-meta">
                <span>Bloco: ${escapeHtml(lab.bloco)}</span>
                <span>Capacidade: ${escapeHtml(lab.capacidade)} alunos</span>
                <span>Tipo: ${escapeHtml(lab.tipo)}</span>
                <span>Equipamentos: ${escapeHtml(lab.equipamentos)}</span>
                <span>Observações: ${escapeHtml(lab.observacoes || 'Sem observações')}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
            <span class="status-badge">${escapeHtml(lab.status)}</span>
            <div class="mini-actions"><button class="secondary-btn admin-edit-lab-btn" type="button" data-index="${index}">Editar</button><button class="delete-btn" type="button" data-index="${index}">Excluir</button></div>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const index = Number(event.currentTarget.dataset.index);
      const labsAtualizados = getLabs();
      if (!labsAtualizados[index] || !window.confirm(`Excluir o laboratório ${labsAtualizados[index].nome}? Esta ação não pode ser desfeita.`)) return;
      labsAtualizados.splice(index, 1);
      saveLabs(labsAtualizados);
      renderLabs();
      showFeedback('Laboratório excluído com sucesso.');
    });
  });
  document.querySelectorAll('.admin-edit-lab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const lab = getLabs()[Number(button.dataset.index)];
      if (lab) startEdit(lab);
    });
  });
}

photoInput.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) {
    previewWrapper.style.display = 'none';
    previewImage.src = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    previewWrapper.style.display = 'block';
    previewImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

labForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(labForm);
  const foto = photoInput.files[0] ? previewImage.src : '';
  const idEdit = Number(document.getElementById('labIdEdit').value);
  const labs = getLabs();
  const fotoAtual = labs.find((lab) => lab.id === idEdit)?.foto || '';
  const novoLab = {
    id: idEdit || Date.now(),
    nome: formData.get('nomeLaboratorio').toString().trim(),
    bloco: formData.get('blocoLaboratorio').toString().trim(),
    capacidade: Number(formData.get('capacidadeLaboratorio')),
    tipo: formData.get('tipoLaboratorio').toString(),
    equipamentos: formData.get('equipamentosLaboratorio').toString().trim(),
    status: formData.get('statusLaboratorio').toString(),
    observacoes: formData.get('obsLaboratorio').toString().trim(),
    foto: foto || fotoAtual
  };

  if (!novoLab.nome || !novoLab.bloco || !novoLab.tipo || !novoLab.equipamentos || !novoLab.capacidade) {
    return;
  }

  const wasEditing = Boolean(idEdit);
  if (wasEditing) {
    const index = labs.findIndex((lab) => lab.id === idEdit);
    if (index !== -1) labs[index] = novoLab;
  } else {
    labs.unshift(novoLab);
  }
  saveLabs(labs);
  renderLabs();
  clearEditMode();
  showFeedback(wasEditing ? 'Laboratório atualizado com sucesso.' : 'Laboratório cadastrado com sucesso.');
});

resetLabsBtn.addEventListener('click', () => {
  if (!window.confirm('Restaurar a lista padrão de laboratórios? Os dados atuais serão removidos.')) return;
  localStorage.removeItem(STORAGE_KEY);
  clearEditMode();
  renderLabs();
  showFeedback('Lista padrão restaurada.');
});

cancelEditBtn?.addEventListener('click', clearEditMode);

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

renderLabs();
