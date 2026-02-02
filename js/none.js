let data = [], filtered = [], currentPage = 1, pageSize = 25, totalPages = 1;
let currentFilters = {
  gender: 'all',
  language: 'all',
  country: 'all',
  nativeness: 'all',
  word: 'all',
  sort: 'name-asc'
};

async function loadData() {
  data = await fetch('data/none.json').then(r => r.json());
  render();
}

function attachListeners() {
  ['genderFilter', 'languageFilter', 'countryFilter', 'nativenessFilter', 'wordFilter', 'sortFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', handleFilterChange);
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
  
  const html = `
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
    
    <div id="cards">
      ${pageData.length === 0 ? '<div class="no-results">No results</div>' : 
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
        `).join('')
      }
    </div>
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
