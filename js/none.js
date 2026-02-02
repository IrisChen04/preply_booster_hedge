let data = [], filtered = [], currentPage = 1, pageSize = 25, totalPages = 1;

async function loadData() {
  data = await fetch('data/none.json').then(r => r.json());
  populateFilters();
  updateDisplay();
}

function populateFilters() {
  const addOptions = (id, values) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    [...new Set(values)].filter(v => v).sort().forEach(v => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = v;
      sel.appendChild(opt);
    });
  };
  
  addOptions('genderFilter', data.map(i => i.gender));
  addOptions('languageFilter', data.map(i => i.language));
  addOptions('countryFilter', data.map(i => i.country));
  addOptions('nativenessFilter', data.map(i => i.nativeness));
  
  const allWords = new Set();
  data.forEach(i => i.allWords?.forEach(w => allWords.add(w)));
  addOptions('wordFilter', [...allWords]);
}

['genderFilter', 'languageFilter', 'countryFilter', 'nativenessFilter', 'wordFilter', 'sortFilter'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => { currentPage = 1; updateDisplay(); });
});

function changePageSize() {
  pageSize = parseInt(document.getElementById('pageSize').value);
  currentPage = 1;
  updateDisplay();
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  updateDisplay();
  window.scrollTo(0, 0);
}

function updateDisplay() {
  const filters = {
    gender: document.getElementById('genderFilter')?.value || 'all',
    language: document.getElementById('languageFilter')?.value || 'all',
    country: document.getElementById('countryFilter')?.value || 'all',
    nativeness: document.getElementById('nativenessFilter')?.value || 'all',
    word: document.getElementById('wordFilter')?.value || 'all',
    sort: document.getElementById('sortFilter')?.value || 'name-asc'
  };
  
  filtered = data.filter(item => {
    return (filters.gender === 'all' || item.gender === filters.gender) &&
           (filters.language === 'all' || item.language === filters.language) &&
           (filters.country === 'all' || item.country === filters.country) &&
           (filters.nativeness === 'all' || item.nativeness === filters.nativeness) &&
           (filters.word === 'all' || item.allWords?.includes(filters.word));
  });
  
  filtered.sort((a, b) => {
    switch(filters.sort) {
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
  
  render(pageData);
}

function render(pageData) {
  const app = document.getElementById('app');
  
  const controlsHtml = `
    <div class="controls">
      <div class="filters">
        <div class="filter-group">
          <label>Gender</label>
          <select id="genderFilter"><option value="all">All</option></select>
        </div>
        <div class="filter-group">
          <label>Language</label>
          <select id="languageFilter"><option value="all">All</option></select>
        </div>
        <div class="filter-group">
          <label>Country</label>
          <select id="countryFilter"><option value="all">All</option></select>
        </div>
        <div class="filter-group">
          <label>Nativeness</label>
          <select id="nativenessFilter"><option value="all">All</option></select>
        </div>
        <div class="filter-group">
          <label>Matched Word</label>
          <select id="wordFilter"><option value="all">All</option></select>
        </div>
        <div class="filter-group">
          <label>Sort By</label>
          <select id="sortFilter">
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="boosters-desc">Most Boosters</option>
            <option value="hedges-desc">Most Hedges</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat"><span class="stat-label">Total:</span><span class="stat-value">{data.length}</span></div>
      <div class="stat"><span class="stat-label">Filtered:</span><span class="stat-value">{filtered.length}</span></div>
      <div class="stat"><span class="stat-label">Displayed:</span><span class="stat-value">{pageData.length}</span></div>
    </div>
    
    <div class="pagination">
      <div>Page {currentPage} of {totalPages}</div>
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
  `;
  
  const cardsHtml = pageData.length === 0 ? '<div class="no-results">No results</div>' : 
    pageData.map(item => `
      <div class="card none">
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
        <div class="text-content">${item.sentence}</div>
      </div>
    `).join('');
  
  app.innerHTML = controlsHtml + cardsHtml;
  
  populateFilters();
  
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
