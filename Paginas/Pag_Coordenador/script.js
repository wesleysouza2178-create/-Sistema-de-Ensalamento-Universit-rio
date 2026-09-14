const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');
const labForm = document.getElementById('coordLabForm');
const labList = document.getElementById('coordLabList');
const labSearch = document.getElementById('labSearch');
const labFilterStatus = document.getElementById('labFilterStatus');
const resetBtn = document.getElementById('resetCoordLabsBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebarCoordenador');
const labFotoInput = document.getElementById('labFoto');
const labPreviewImage = document.getElementById('labPreviewImageCoordenador');
const labPreviewWrapper = document.getElementById('labPhotoPreviewCoordenador');
const editBanner = document.getElementById('coordEditBanner');
const cancelEditTop = document.getElementById('cancelEditTop');
const saveLabBtn = document.getElementById('coordSaveLabBtn');
const labFeedback = document.getElementById('coordLabFeedback');

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

const defaultLabs = [
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
  }
];

function getLabs() {
  try {
    const labs = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(labs) && labs.length ? labs : defaultLabs;
  } catch {
    return defaultLabs;
  }
}

function saveLabs(labs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(labs));
  window.dispatchEvent(new Event('campusSyncDataChanged'));
}

function getFilteredLabs() {
  const search = labSearch.value.trim().toLowerCase();
  const status = labFilterStatus.value;
  let labs = getLabs();

  if (status !== 'todos') {
    labs = labs.filter((lab) => lab.status === status);
  }

  if (search) {
    labs = labs.filter((lab) =>
      lab.nome.toLowerCase().includes(search) ||
      lab.bloco.toLowerCase().includes(search) ||
      lab.tipo.toLowerCase().includes(search)
    );
  }

  return labs;
}

function setLabPreview(src) {
  if (!labPreviewWrapper || !labPreviewImage) return;
  if (!src) {
    labPreviewWrapper.style.display = 'none';
    labPreviewImage.src = '';
    return;
  }

  labPreviewWrapper.style.display = 'block';
  labPreviewImage.src = src;
}

function showFeedback(text) {
  if (!labFeedback) return;
  labFeedback.textContent = text;
  window.setTimeout(() => { labFeedback.textContent = ''; }, 3500);
}

function clearEditMode() {
  labForm.reset();
  document.getElementById('labIdEdit').value = '';
  setLabPreview('');
  if (labFotoInput) labFotoInput.value = '';
  if (editBanner) editBanner.hidden = true;
  if (saveLabBtn) saveLabBtn.textContent = 'Salvar laboratório';
}

function startEdit(lab) {
  document.getElementById('labIdEdit').value = lab.id;
  document.getElementById('labNome').value = lab.nome;
  document.getElementById('labBloco').value = lab.bloco;
  document.getElementById('labCapacidade').value = lab.capacidade;
  document.getElementById('labTipo').value = lab.tipo;
  document.getElementById('labEquipamentos').value = lab.equipamentos;
  document.getElementById('labStatus').value = lab.status;
  document.getElementById('labObs').value = lab.observacoes || '';
  setLabPreview(lab.foto || '');
  if (editBanner) editBanner.hidden = false;
  if (saveLabBtn) saveLabBtn.textContent = 'Atualizar laboratório';
  document.getElementById('labNome').focus();
  labForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

labFotoInput.addEventListener('change', () => {
  const file = labFotoInput.files[0];
  if (!file) {
    setLabPreview('');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => setLabPreview(event.target.result);
  reader.readAsDataURL(file);
});

function renderLabs() {
  const labs = getFilteredLabs();

  if (!labs.length) {
    labList.innerHTML = '<div class="empty-state">Nenhum laboratório encontrado.</div>';
    return;
  }

  labList.innerHTML = labs
    .map(
      (lab) => `
        <article class="coord-lab-item">
          <div style="display:flex; gap: 1rem; flex-wrap: wrap; align-items:flex-start;">
            ${lab.foto ? `<img class="lab-photo" src="${lab.foto}" alt="${lab.nome}" />` : '<div class="lab-photo" style="display:flex;align-items:center;justify-content:center;color:#3d6db5;font-size:0.8rem;">Foto</div>'}
            <div>
              <h4>${lab.nome}</h4>
              <p>Bloco: ${lab.bloco}</p>
              <p>Capacidade: ${lab.capacidade} alunos</p>
              <p>Tipo: ${lab.tipo}</p>
              <p>Equipamentos: ${lab.equipamentos}</p>
              <p>Observações: ${lab.observacoes || 'Sem observações'}</p>
            </div>
          </div>
          <div class="coord-lab-actions">
            <span class="status-badge ${lab.status === 'Em uso' ? 'warning-badge' : ''}">${lab.status}</span>
            <div class="mini-actions">
              <button type="button" class="secondary-btn edit-btn" data-id="${lab.id}">Editar</button>
              <button type="button" class="delete-btn" data-id="${lab.id}">Excluir</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lab = getLabs().find((item) => item.id === Number(btn.dataset.id));
      if (!lab) return;

      startEdit(lab);
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lab = getLabs().find((item) => item.id === Number(btn.dataset.id));
      if (!lab || !window.confirm(`Excluir o laboratório ${lab.nome}? Esta ação não pode ser desfeita.`)) return;
      const updated = getLabs().filter((lab) => lab.id !== Number(btn.dataset.id));
      saveLabs(updated);
      renderLabs();
      showFeedback('Laboratório excluído com sucesso.');
    });
  });
}

labForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const idEdit = Number(document.getElementById('labIdEdit').value);
  const labs = getLabs();
  const fotoSelecionada = labFotoInput.files[0] ? labPreviewImage.src : (labs.find((lab) => lab.id === idEdit)?.foto || '');

  const novoLab = {
    id: idEdit || Date.now(),
    nome: document.getElementById('labNome').value.trim(),
    bloco: document.getElementById('labBloco').value.trim(),
    capacidade: Number(document.getElementById('labCapacidade').value),
    tipo: document.getElementById('labTipo').value,
    equipamentos: document.getElementById('labEquipamentos').value.trim(),
    status: document.getElementById('labStatus').value,
    observacoes: document.getElementById('labObs').value.trim(),
    foto: fotoSelecionada
  };

  if (!novoLab.nome || !novoLab.bloco || !novoLab.tipo || !novoLab.equipamentos || !novoLab.capacidade) {
    return;
  }

  if (idEdit) {
    const index = labs.findIndex((lab) => lab.id === idEdit);
    if (index !== -1) labs[index] = { ...labs[index], ...novoLab };
  } else {
    labs.unshift(novoLab);
  }

  saveLabs(labs);
  const wasEditing = Boolean(idEdit);
  clearEditMode();
  renderLabs();
  showFeedback(wasEditing ? 'Laboratório atualizado com sucesso.' : 'Laboratório cadastrado com sucesso.');
});

labSearch.addEventListener('input', renderLabs);
labFilterStatus.addEventListener('change', renderLabs);

resetBtn.addEventListener('click', () => {
  if (!window.confirm('Restaurar a lista padrão de laboratórios? Os dados atuais serão removidos.')) return;
  localStorage.removeItem(STORAGE_KEY);
  clearEditMode();
  renderLabs();
  showFeedback('Lista padrão restaurada.');
});

cancelEditBtn.addEventListener('click', () => {
  clearEditMode();
});
cancelEditTop?.addEventListener('click', clearEditMode);

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioLogado');
    sessionStorage.clear();
    window.location.replace('../Pagina_login/index.html');
  });
}

renderLabs();

