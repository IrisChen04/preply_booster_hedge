let data = [], filtered = [], currentPage = 1, pageSize = 25, totalPages = 1;
let currentFilters = {
  gender: 'all',
  language: 'all',
  country: 'all',
  nativeness: 'all',
  word: 'all',
  sort: 'name-asc'
};
let edits = {};
let editingId = null;
let annotationMenu = null;

async function loadData() {
  data = await fetch('data/hedges.json').then(r => r.json());
  loadEdits();
  setupAutoBackup();
  render();
}

function loadEdits() {
  const stored = localStorage.getItem('corpus_edits');
  if (stored) {
    try {
      edits = JSON.parse(stored);
    } catch(e) {
      console.error('Failed to load edits:', e);
      edits = {};
    }
  }
}

function saveEdits() {
  localStorage.setItem('corpus_edits', JSON.stringify(edits));
}

function setupAutoBackup() {
  window.addEventListener('beforeunload', (e) => {
    if (Object.keys(edits).length > 0) {
      downloadEdits();
    }
  });
}

function downloadEdits() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const blob = new Blob([JSON.stringify(edits, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `edits_backup_${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportEdits() {
  if (Object.keys(edits).length === 0) {
    alert('No edits to export');
    return;
  }
  downloadEdits();
  alert('Edits exported successfully!');
}

function getEditedCount() {
  return Object.keys(edits).length;
}

function toggleEdit(id) {
  closeAnnotationMenu();
  if (editingId === id) {
    editingId = null;
  } else {
    editingId = id;
  }
  render();
}

function handleTextSelection(e, id, item) {
  if (editingId !== id) return;
  
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showAnnotationMenu(rect, selectedText, id, item);
    }
  }, 10);
}

function showAnnotationMenu(rect, text, id, item) {
  closeAnnotationMenu();
  
  const menu = document.createElement('div');
  menu.className = 'annotation-menu';
  menu.style.left = rect.left + window.scrollX + 'px';
  menu.style.top = rect.bottom + window.scrollY + 5 + 'px';
  
  const currentEdit = edits[id] || {};
  const editedBoosters = currentEdit.edited_boosters || item.originalBoosters || [];
  const editedHedges = currentEdit.edited_hedges || item.originalHedges || [];
  
  const isBooster = editedBoosters.includes(text);
  const isHedge = editedHedges.includes(text);
  
  menu.innerHTML = `
    <div class="annotation-menu-title">Selected text:</div>
    <input type="text" id="annotationInput" value="${text.replace(/"/g, '&quot;')}" />
    <button class="btn-booster" onclick="addAnnotation('${id}', 'booster')">✅ Mark as Booster</button>
    <button class="btn-hedge" onclick="addAnnotation('${id}', 'hedge')">⚠️ Mark as Hedge</button>
    ${isBooster || isHedge ? '<button class="btn-remove" onclick="removeAnnotation(\''+id+'\')">❌ Remove Mark</button>' : ''}
    <button class="btn-cancel" onclick="closeAnnotationMenu()">Cancel</button>
  `;
  
  document.body.appendChild(menu);
  annotationMenu = menu;
  
  setTimeout(() => {
    const input = document.getElementById('annotationInput');
    if (input) input.focus();
  }, 50);
}

function closeAnnotationMenu() {
  if (annotationMenu) {
    annotationMenu.remove();
    annotationMenu = null;
  }
}

function addAnnotation(id, type) {
  const input = document.getElementById('annotationInput');
  if (!input) return;
  
  const word = input.value.trim();
  if (!word) return;
  
  const item = data.find(i => i.id === id);
  if (!item) return;
  
  if (!edits[id]) {
    edits[id] = {
      original_boosters: item.originalBoosters || [],
      original_hedges: item.originalHedges || [],
      edited_boosters: [...(item.originalBoosters || [])],
      edited_hedges: [...(item.originalHedges || [])],
      timestamp: new Date().toISOString()
    };
  }
  
  if (type === 'booster') {
    if (!edits[id].edited_boosters.includes(word)) {
      edits[id].edited_boosters.push(word);
    }
    edits[id].edited_hedges = edits[id].edited_hedges.filter(w => w !== word);
  } else {
    if (!edits[id].edited_hedges.includes(word)) {
      edits[id].edited_hedges.push(word);
    }
    edits[id].edited_boosters = edits[id].edited_boosters.filter(w => w !== word);
  }
  
  edits[id].timestamp = new Date().toISOString();
  saveEdits();
  closeAnnotationMenu();
  render();
}

function removeAnnotation(id) {
  const input = document.getElementById('annotationInput');
  if (!input) return;
  
  const word = input.value.trim();
  if (!word) return;
  
  if (edits[id]) {
    edits[id].edited_boosters = edits[id].edited_boosters.filter(w => w !== word);
    edits[id].edited_hedges = edits[id].edited_hedges.filter(w => w !== word);
    edits[id].timestamp = new Date().toISOString();
    saveEdits();
  }
  
  closeAnnotationMenu();
  render();
}

function highlightWithEdits(text, item) {
  const edit = edits[item.id];
  const originalBoosters = item.originalBoosters || [];
  const originalHedges = item.originalHedges || [];
  const editedBoosters = edit ? edit.edited_boosters : originalBoosters;
  const editedHedges = edit ? edit.edited_hedges : originalHedges;
  
  const newBoosters = editedBoosters.filter(w => !originalBoosters.includes(w));
  const newHedges = editedHedges.filter(w => !originalHedges.includes(w));
  const removedBoosters = originalBoosters.filter(w => !editedBoosters.includes(w));
  const removedHedges = originalHedges.filter(w => !editedHedges.includes(w));
  
  let result = text;
  
  const allWords = [
    ...newBoosters.map(w => ({word: w, type: 'booster-new'})),
    ...newHedges.map(w => ({word: w, type: 'hedge-new'})),
    ...editedBoosters.filter(w => originalBoosters.includes(w)).map(w => ({word: w, type: 'booster'})),
    ...editedHedges.filter(w => originalHedges.includes(w)).map(w => ({word: w, type: 'hedge'})),
    ...removedBoosters.map(w => ({word: w, type: 'removed'})),
    ...removedHedges.map(w => ({word: w, type: 'removed'}))
  ];
  
  allWords.sort((a, b) => b.word.length - a.word.length);
  
  allWords.forEach(({word, type}) => {
    const regex = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    result = result.replace(regex, `<span class="highlight-${type}">${word}</span>`);
  });
  
  return result;
}

function attachListeners() {
  ['genderFilter', 'languageFilter', 'countryFilter', 'nativenessFilter', 'wordFilter', 'sortFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', handleFilterChange);
    }
  });
  
  document.addEventListener('click', (e) => {
    if (annotationMenu && !annotationMenu.contains(e.target)) {
      closeAnnotationMenu();
    }
  });
}

function handleFilterChange(e) {
  const id = e.target.id;
  const value = e.target.value;
  
  if (id === 'genderFilter') currentFilters.gender = value;
  else if (id === 'languageFilter') currentFilters.language = value;
  else if (id === 'countryFilter') currentFilters.country = value;
  else if (id === 'nativenessFilter') currentFilters.nativeness = value;
  else if (id === 'wordFilter') currentFilters.word = value;
  else if (id === 'sortFilter') currentFilters.sort = value;
  
  currentPage = 1;
  render();
}

function changePageSize() {
  pageSize = parseInt(document.getElementById('pageSize').value);
  currentPage = 1;
  render();
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  render();
  window.scrollTo(0, 0);
}

function render() {
  filtered = data.filter(item => {
    return (currentFilters.gender === 'all' || item.gender === currentFilters.gender) &&
           (currentFilters.language === 'all' || item.language === currentFilters.language) &&
           (currentFilters.country === 'all' || item.country === currentFilters.country) &&
           (currentFilters.nativeness === 'all' || item.nativeness === currentFilters.nativeness) &&
           (currentFilters.word === 'all' || item.allWords?.includes(currentFilters.word));
  });
  
  filtered.sort((a, b) => {
    switch(currentFilters.sort) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'boosters-desc': return b.boosterCount - a.boosterCount;
      case 'hedges-desc': return b.hedgeCount - a.hedgeCount;
      default: return 0;
    }
  });
  
  totalPages = Math.ceil(filtered.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = 1;
  
  const start = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);
  
  const genders = [...new Set(data.map(i => i.gender))].filter(v => v).sort();
  const languages = [...new Set(data.map(i => i.language))].filter(v => v).sort();
  const countries = [...new Set(data.map(i => i.country))].filter(v => v).sort();
  const nativenesses = [...new Set(data.map(i => i.nativeness))].filter(v => v).sort();
  const allWords = new Set();
  data.forEach(i => i.allWords?.forEach(w => allWords.add(w)));
  const words = [...allWords].sort();
  
  const cardsHtml = pageData.length === 0 ? '<div class="no-results">No results</div>' : 
    pageData.map(item => {
      const isEdited = !!edits[item.id];
      const isEditing = editingId === item.id;
      const displayText = isEdited ? highlightWithEdits(item.plainSentence, item) : item.sentence;
      const itemJson = JSON.stringify(item).replace(/'/g, "\\'").replace(/"/g, '\\"');
      
      return `
        <div class="card hedge ${isEdited ? 'edited' : ''}">
          ${isEdited ? '<div class="edited-badge">✏️ Edited</div>' : ''}
          <div class="card-header">
            <div class="card-name">${item.name}</div>
            <div class="badges">
              <span class="badge badge-${item.gender.toLowerCase()}">${item.gender}</span>
              <span class="badge badge-native">${item.nativeness}</span>
              <span class="badge badge-price">$${item.price}</span>
            </div>
          </div>
          <div class="card-meta">
            <span>${item.language}</span>
            <span>${item.country}</span>
            <span>Sentence ${item.sentenceIndex + 1}</span>
            <span>B: ${item.boosterCount} | H: ${item.hedgeCount}</span>
          </div>
          <div class="text-content ${isEditing ? 'editing' : ''}" 
               onmouseup="handleTextSelection(event, '${item.id}', JSON.parse('${itemJson}'))">
            ${displayText}
          </div>
          <button class="edit-btn ${isEditing ? 'active' : ''}" onclick="toggleEdit('${item.id}')">
            ${isEditing ? '✓ Done Editing' : '✏️ Edit Annotations'}
          </button>
        </div>
      `;
    }).join('');
  
  const html = `
    <div class="edit-toolbar">
      <div class="edit-info">
        Edited items: <span class="edit-count">${getEditedCount()}</span>
      </div>
      <button class="export-btn" onclick="exportEdits()">📥 Export Edits</button>
    </div>
  
    <div class="controls">
      <div class="filters">
        <div class="filter-group">
          <label>Gender</label>
          <select id="genderFilter">
            <option value="all">All</option>
            ${genders.map(v => `<option value="${v}" ${currentFilters.gender === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Language</label>
          <select id="languageFilter">
            <option value="all">All</option>
            ${languages.map(v => `<option value="${v}" ${currentFilters.language === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Country</label>
          <select id="countryFilter">
            <option value="all">All</option>
            ${countries.map(v => `<option value="${v}" ${currentFilters.country === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Nativeness</label>
          <select id="nativenessFilter">
            <option value="all">All</option>
            ${nativenesses.map(v => `<option value="${v}" ${currentFilters.nativeness === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Matched Word</label>
          <select id="wordFilter">
            <option value="all">All</option>
            ${words.map(v => `<option value="${v}" ${currentFilters.word === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Sort By</label>
          <select id="sortFilter">
            <option value="name-asc" ${currentFilters.sort === 'name-asc' ? 'selected' : ''}>Name A-Z</option>
            <option value="name-desc" ${currentFilters.sort === 'name-desc' ? 'selected' : ''}>Name Z-A</option>
            <option value="price-asc" ${currentFilters.sort === 'price-asc' ? 'selected' : ''}>Price Low-High</option>
            <option value="price-desc" ${currentFilters.sort === 'price-desc' ? 'selected' : ''}>Price High-Low</option>
            <option value="boosters-desc" ${currentFilters.sort === 'boosters-desc' ? 'selected' : ''}>Most Boosters</option>
            <option value="hedges-desc" ${currentFilters.sort === 'hedges-desc' ? 'selected' : ''}>Most Hedges</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat"><span class="stat-label">Total:</span><span class="stat-value">${data.length}</span></div>
      <div class="stat"><span class="stat-label">Filtered:</span><span class="stat-value">${filtered.length}</span></div>
      <div class="stat"><span class="stat-label">Displayed:</span><span class="stat-value">${pageData.length}</span></div>
    </div>
    
    <div class="pagination">
      <div>Page ${currentPage} of ${totalPages}</div>
      <div>
        <button class="page-btn" onclick="goToPage(1)">First</button>
        <button class="page-btn" onclick="goToPage(currentPage-1)">Prev</button>
        <span id="pageNumbers"></span>
        <button class="page-btn" onclick="goToPage(currentPage+1)">Next</button>
        <button class="page-btn" onclick="goToPage(totalPages)">Last</button>
        <select id="pageSize" onchange="changePageSize()">
          <option value="10">10</option>
          <option value="25" selected>25</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
    
    <div id="cards">${cardsHtml}</div>
  `;
  
  document.getElementById('app').innerHTML = html;
  attachListeners();
  
  const pageNums = document.getElementById('pageNumbers');
  if (pageNums) {
    pageNums.innerHTML = '';
    const maxBtns = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxBtns - 1);
    for (let i = start; i <= end; i++) {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.onclick = () => goToPage(i);
      pageNums.appendChild(btn);
    }
  }
}

window.addEventListener('load', loadData);
