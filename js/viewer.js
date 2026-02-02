let corpus = [], profiles = {}, filtered = [], currentPage = 1, pageSize = 25, totalPages = 1;
let currentView = 'sentence', activeCategories = ['boosters', 'hedges', 'both', 'none'];

async function loadData() {
  corpus = await fetch('data/corpus.json').then(r => r.json());
  profiles = await fetch('data/profiles.json').then(r => r.json());
  populateFilters();
  updateDisplay();
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view-toggle .btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('categoryFilter').classList.add('show');
  currentPage = 1;
  updateDisplay();
}

function toggleCategory(cat) {
  const idx = activeCategories.indexOf(cat);
  if (idx > -1) {
    activeCategories.splice(idx, 1);
    event.target.classList.remove('active');
  } else {
    activeCategories.push(cat);
    event.target.classList.add('active');
  }
  currentPage = 1;
  updateDisplay();
}

function populateFilters() {
  const addOptions = (id, values) => {
    const sel = document.getElementById(id);
    [...new Set(values)].filter(v => v).sort().forEach(v => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = v;
      sel.appendChild(opt);
    });
  };
  
  addOptions('genderFilter', corpus.map(i => i.gender));
  addOptions('languageFilter', corpus.map(i => i.language));
  addOptions('countryFilter', corpus.map(i => i.country));
  addOptions('nativenessFilter', corpus.map(i => i.nativeness));
  
  const allWords = new Set();
  corpus.forEach(i => i.allWords?.forEach(w => allWords.add(w)));
  addOptions('wordFilter', [...allWords]);
}

['genderFilter', 'languageFilter', 'countryFilter', 'nativenessFilter', 'wordFilter', 'sortFilter'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { currentPage = 1; updateDisplay(); });
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
  const data = currentView === 'sentence' ? corpus : Object.values(profiles);
  const filters = {
    gender: document.getElementById('genderFilter').value,
    language: document.getElementById('languageFilter').value,
    country: document.getElementById('countryFilter').value,
    nativeness: document.getElementById('nativenessFilter').value,
    word: document.getElementById('wordFilter').value,
    sort: document.getElementById('sortFilter').value
  };
  
  filtered = data.filter(item => {
    return (filters.gender === 'all' || item.gender === filters.gender) &&
           (filters.language === 'all' || item.language === filters.language) &&
           (filters.country === 'all' || item.country === filters.country) &&
           (filters.nativeness === 'all' || item.nativeness === filters.nativeness) &&
           (filters.word === 'all' || item.allWords?.includes(filters.word) || item.all_words?.includes(filters.word)) &&
           activeCategories.includes(item.category);
  });
  
  filtered.sort((a, b) => {
    switch(filters.sort) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'boosters-desc': return (b.boosterCount || b.total_booster_count || 0) - (a.boosterCount || a.total_booster_count || 0);
      case 'hedges-desc': return (b.hedgeCount || b.total_hedge_count || 0) - (a.hedgeCount || a.total_hedge_count || 0);
      default: return 0;
    }
  });
  
  document.getElementById('total').textContent = data.length;
  document.getElementById('filtered').textContent = filtered.length;
  
  totalPages = Math.ceil(filtered.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = 1;
  
  const start = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);
  
  document.getElementById('displayed').textContent = pageData.length;
  document.getElementById('currentPage').textContent = currentPage;
  document.getElementById('currentPage2').textContent = currentPage;
  document.getElementById('totalPages').textContent = totalPages;
  document.getElementById('totalPages2').textContent = totalPages;
  
  const pageNums = document.getElementById('pageNumbers');
  pageNums.innerHTML = '';
  const maxBtns = 5;
  let start_p = Math.max(1, currentPage - 2);
  let end_p = Math.min(totalPages, start_p + maxBtns - 1);
  for (let i = start_p; i <= end_p; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
    btn.textContent = i;
    btn.onclick = () => goToPage(i);
    pageNums.appendChild(btn);
  }
  
  const content = document.getElementById('content');
  if (pageData.length === 0) {
    content.innerHTML = '<div class="no-results">No results</div>';
    return;
  }
  
  content.innerHTML = pageData.map(currentView === 'sentence' ? createSentenceCard : createProfileCard).join('');
}

function createSentenceCard(item) {
  return `
    <div class="card ${item.category}">
      <div class="card-header">
        <div class="card-name" onclick="viewProfile('${item.url}')">${item.name}</div>
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
  `;
}

function createProfileCard(profile) {
  let freqHtml = '';
  if (Object.keys(profile.booster_frequency).length > 0) {
    freqHtml += `<div class="freq-section"><div class="freq-title">Top Boosters</div><div class="freq-grid">`;
    freqHtml += Object.entries(profile.booster_frequency).map(([w, c]) => 
      `<div class="freq-item"><span>${w}</span><span>${c}</span></div>`).join('');
    freqHtml += `</div></div>`;
  }
  if (Object.keys(profile.hedge_frequency).length > 0) {
    freqHtml += `<div class="freq-section"><div class="freq-title">Top Hedges</div><div class="freq-grid">`;
    freqHtml += Object.entries(profile.hedge_frequency).map(([w, c]) => 
      `<div class="freq-item"><span>${w}</span><span>${c}</span></div>`).join('');
    freqHtml += `</div></div>`;
  }
  
  return `
    <div class="card ${profile.category}">
      <div class="card-header">
        <div class="card-name">${profile.name}</div>
        <div class="badges">
          <span class="badge badge-${profile.gender.toLowerCase()}">${profile.gender}</span>
          <span class="badge badge-native">${profile.nativeness}</span>
          <span class="badge badge-price">$${profile.price}</span>
        </div>
      </div>
      <div class="card-meta">
        <span>${profile.language}</span>
        <span>${profile.country}</span>
        <span>B: ${profile.total_booster_count} | H: ${profile.total_hedge_count}</span>
        <span><a href="${profile.url}" target="_blank">View Profile</a></span>
      </div>
      <div class="text-content">${profile.full_text}</div>
      ${freqHtml}
    </div>
  `;
}

function viewProfile(url) {
  currentView = 'profile';
  document.querySelectorAll('.view-toggle .btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view-toggle .btn')[1].classList.add('active');
  document.getElementById('categoryFilter').classList.add('show');
  filtered = [profiles[url]];
  currentPage = 1;
  updateDisplay();
}

window.addEventListener('load', loadData);
