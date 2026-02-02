let corpusData = [];
let profileData = {};
let filteredData = [];
let currentPage = 1;
let pageSize = 25;
let totalPages = 1;
let currentView = 'sentence';

async function loadData() {
  try {
    const response = await fetch('data/corpus.json');
    corpusData = await response.json();
    
    const profileResponse = await fetch('data/profiles.json');
    profileData = await profileResponse.json();
    
    populateFilters();
    updateDisplay();
  } catch (error) {
    document.getElementById('contentArea').innerHTML = '<div class="no-results">Error loading data.</div>';
    console.error('Error:', error);
  }
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  document.querySelectorAll('.view-sentence').forEach(el => {
    el.style.display = view === 'sentence' ? 'flex' : 'none';
  });
  document.querySelectorAll('.view-profile').forEach(el => {
    el.style.display = view === 'profile' ? 'block' : 'none';
  });
  
  currentPage = 1;
  updateDisplay();
}

function populateFilters() {
  const genders = [...new Set(corpusData.map(item => item.gender))].filter(g => g).sort();
  const genderFilter = document.getElementById('genderFilter');
  genders.forEach(gender => {
    const option = document.createElement('option');
    option.value = gender;
    option.textContent = gender;
    genderFilter.appendChild(option);
  });
  
  const languages = [...new Set(corpusData.map(item => item.language))].filter(l => l).sort();
  const languageFilter = document.getElementById('languageFilter');
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = lang;
    languageFilter.appendChild(option);
  });
  
  const countries = [...new Set(corpusData.map(item => item.country))].filter(c => c).sort();
  const countryFilter = document.getElementById('countryFilter');
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countryFilter.appendChild(option);
  });
  
  const nativeness = [...new Set(corpusData.map(item => item.nativeness))].filter(n => n).sort();
  const nativenessFilter = document.getElementById('nativenessFilter');
  nativeness.forEach(nat => {
    const option = document.createElement('option');
    option.value = nat;
    option.textContent = nat;
    nativenessFilter.appendChild(option);
  });
}

document.getElementById('genderFilter').addEventListener('change', () => { currentPage = 1; updateDisplay(); });
document.getElementById('languageFilter').addEventListener('change', () => { currentPage = 1; updateDisplay(); });
document.getElementById('countryFilter').addEventListener('change', () => { currentPage = 1; updateDisplay(); });
document.getElementById('nativenessFilter').addEventListener('change', () => { currentPage = 1; updateDisplay(); });
document.getElementById('priceMin').addEventListener('input', () => { currentPage = 1; updateDisplay(); });
document.getElementById('priceMax').addEventListener('input', () => { currentPage = 1; updateDisplay(); });
document.getElementById('sortBySelect').addEventListener('change', updateDisplay);
document.getElementById('searchInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') applySearch(); });

function applySearch() { currentPage = 1; updateDisplay(); }
function changePageSize() { pageSize = parseInt(document.getElementById('pageSizeSelect').value); currentPage = 1; updateDisplay(); }
function goToPage(page) { if (page < 1 || page > totalPages) return; currentPage = page; updateDisplay(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

function updateDisplay() {
  if (currentView === 'sentence') {
    updateSentenceView();
  } else {
    updateProfileView();
  }
}

function updateSentenceView() {
  const genderFilter = document.getElementById('genderFilter').value;
  const languageFilter = document.getElementById('languageFilter').value;
  const countryFilter = document.getElementById('countryFilter').value;
  const nativenessFilter = document.getElementById('nativenessFilter').value;
  const priceMin = parseFloat(document.getElementById('priceMin').value) || 0;
  const priceMax = parseFloat(document.getElementById('priceMax').value) || Infinity;
  const searchText = document.getElementById('searchInput').value.toLowerCase().trim();
  const sortBy = document.getElementById('sortBySelect').value;
  
  filteredData = corpusData.filter(item => {
    const genderMatch = genderFilter === 'all' || item.gender === genderFilter;
    const languageMatch = languageFilter === 'all' || item.language === languageFilter;
    const countryMatch = countryFilter === 'all' || item.country === countryFilter;
    const nativenessMatch = nativenessFilter === 'all' || item.nativeness === nativenessFilter;
    const priceMatch = item.price >= priceMin && item.price <= priceMax;
    
    let searchMatch = true;
    if (searchText) {
      searchMatch = (item.name && item.name.toLowerCase().includes(searchText)) ||
                    (item.sentenceRaw && item.sentenceRaw.toLowerCase().includes(searchText)) ||
                    (item.matches && item.matches.some(m => m.toLowerCase().includes(searchText)));
    }
    
    return genderMatch && languageMatch && countryMatch && nativenessMatch && priceMatch && searchMatch;
  });
  
  filteredData.sort((a, b) => {
    switch(sortBy) {
      case 'name-asc': return (a.name || '').localeCompare(b.name || '');
      case 'name-desc': return (b.name || '').localeCompare(a.name || '');
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'boosters-desc': return b.boosterCount - a.boosterCount;
      case 'hedges-desc': return b.hedgeCount - a.hedgeCount;
      default: return 0;
    }
  });
  
  updateStats();
  renderSentenceView();
}

function updateProfileView() {
  const genderFilter = document.getElementById('genderFilter').value;
  const languageFilter = document.getElementById('languageFilter').value;
  const countryFilter = document.getElementById('countryFilter').value;
  const nativenessFilter = document.getElementById('nativenessFilter').value;
  const priceMin = parseFloat(document.getElementById('priceMin').value) || 0;
  const priceMax = parseFloat(document.getElementById('priceMax').value) || Infinity;
  const searchText = document.getElementById('searchInput').value.toLowerCase().trim();
  const sortBy = document.getElementById('sortBySelect').value;
  
  filteredData = Object.values(profileData).filter(profile => {
    const genderMatch = genderFilter === 'all' || profile.gender === genderFilter;
    const languageMatch = languageFilter === 'all' || profile.language === languageFilter;
    const countryMatch = countryFilter === 'all' || profile.country === countryFilter;
    const nativenessMatch = nativenessFilter === 'all' || profile.nativeness === nativenessFilter;
    const priceMatch = profile.price >= priceMin && profile.price <= priceMax;
    
    let searchMatch = true;
    if (searchText) {
      searchMatch = (profile.name && profile.name.toLowerCase().includes(searchText));
    }
    
    return genderMatch && languageMatch && countryMatch && nativenessMatch && priceMatch && searchMatch;
  });
  
  filteredData.sort((a, b) => {
    switch(sortBy) {
      case 'name-asc': return (a.name || '').localeCompare(b.name || '');
      case 'name-desc': return (b.name || '').localeCompare(a.name || '');
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'boosters-desc': return b.total_booster_count - a.total_booster_count;
      case 'hedges-desc': return b.total_hedge_count - a.total_hedge_count;
      default: return 0;
    }
  });
  
  updateStats();
  renderProfileView();
}

function updateStats() {
  document.getElementById('totalCount').textContent = currentView === 'sentence' ? corpusData.length : Object.keys(profileData).length;
  document.getElementById('filteredCount').textContent = filteredData.length;
  
  if (filteredData.length > 0) {
    const avgPrice = filteredData.reduce((sum, item) => sum + item.price, 0) / filteredData.length;
    document.getElementById('avgPrice').textContent = '$' + avgPrice.toFixed(2);
  } else {
    document.getElementById('avgPrice').textContent = '$0';
  }
}

function renderSentenceView() {
  totalPages = Math.ceil(filteredData.length / pageSize);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredData.length);
  const pageData = filteredData.slice(startIdx, endIdx);
  
  document.getElementById('displayedCount').textContent = pageData.length;
  document.getElementById('currentPageDisplay').textContent = currentPage;
  document.getElementById('currentPageDisplay2').textContent = currentPage;
  document.getElementById('totalPagesDisplay').textContent = totalPages;
  document.getElementById('totalPagesDisplay2').textContent = totalPages;
  
  document.getElementById('firstPageBtn').disabled = currentPage === 1;
  document.getElementById('prevPageBtn').disabled = currentPage === 1;
  document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
  document.getElementById('lastPageBtn').disabled = currentPage === totalPages;
  
  generatePageNumbers();
  
  const contentArea = document.getElementById('contentArea');
  if (filteredData.length === 0) {
    contentArea.innerHTML = '<div class="no-results">No entries match the selected filters.</div>';
    return;
  }
  
  let html = '';
  pageData.forEach(item => {
    html += createCorpusCard(item);
  });
  contentArea.innerHTML = html;
}

function renderProfileView() {
  const contentArea = document.getElementById('contentArea');
  
  if (filteredData.length === 0) {
    contentArea.innerHTML = '<div class="no-results">No profiles match the selected filters.</div>';
    document.getElementById('displayedCount').textContent = 0;
    return;
  }
  
  document.getElementById('displayedCount').textContent = filteredData.length;
  
  let html = '';
  filteredData.forEach(profile => {
    html += createProfileCard(profile);
  });
  contentArea.innerHTML = html;
}

function generatePageNumbers() {
  const pageNumbers = document.getElementById('pageNumbers');
  pageNumbers.innerHTML = '';
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-button' + (i === currentPage ? ' active' : '');
    btn.textContent = i;
    btn.onclick = () => goToPage(i);
    pageNumbers.appendChild(btn);
  }
}

function createProfileCard(profile) {
  const genderBadgeClass = profile.gender === 'Male' ? 'badge-gender-male' : 'badge-gender-female';
  const nativenessBadgeClass = profile.nativeness === 'Native' ? 'badge-native' : 'badge-non-native';
  
  let boosterFreqHtml = '';
  if (Object.keys(profile.booster_frequency).length > 0) {
    boosterFreqHtml = `
      <div class="frequency-section">
        <div class="frequency-title">Top Boosters</div>
        <div class="frequency-grid">
          ${Object.entries(profile.booster_frequency).map(([word, count]) => `
            <div class="frequency-item">
              <span class="frequency-word">${word}</span>
              <span class="frequency-count">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  let hedgeFreqHtml = '';
  if (Object.keys(profile.hedge_frequency).length > 0) {
    hedgeFreqHtml = `
      <div class="frequency-section">
        <div class="frequency-title">Top Hedges</div>
        <div class="frequency-grid">
          ${Object.entries(profile.hedge_frequency).map(([word, count]) => `
            <div class="frequency-item">
              <span class="frequency-word">${word}</span>
              <span class="frequency-count">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  return `
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-name">${profile.name}</div>
        <div class="profile-badges">
          <span class="badge ${genderBadgeClass}">${profile.gender}</span>
          <span class="badge ${nativenessBadgeClass}">${profile.nativeness}</span>
          <span class="badge badge-price">$${profile.price.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="metadata">
        <div class="meta-item"><span class="meta-label">Language:</span><span class="meta-value">${profile.language}</span></div>
        <div class="meta-item"><span class="meta-label">Country:</span><span class="meta-value">${profile.country}</span></div>
        <div class="meta-item"><span class="meta-label">URL:</span><span class="meta-value"><a href="${profile.url}" target="_blank" style="color: #3498db;">View Profile</a></span></div>
      </div>
      
      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-value">${profile.total_sentences}</div>
          <div class="profile-stat-label">Total Sentences</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${profile.total_booster_count}</div>
          <div class="profile-stat-label">Total Boosters</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${profile.total_hedge_count}</div>
          <div class="profile-stat-label">Total Hedges</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${profile.unique_boosters}</div>
          <div class="profile-stat-label">Unique Boosters</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${profile.unique_hedges}</div>
          <div class="profile-stat-label">Unique Hedges</div>
        </div>
      </div>
      
      ${boosterFreqHtml}
      ${hedgeFreqHtml}
      
      <div class="sentences-section">
        <div class="sentences-title">All Sentences (${profile.sentences.length})</div>
        ${profile.sentences.map(sent => `
          <div class="sentence-item">
            <div class="sentence-index">Sentence ${sent.index + 1}</div>
            <div class="sentence-text">${escapeHtml(sent.text)}</div>
            ${sent.booster_count > 0 || sent.hedge_count > 0 ? `
              <div class="sentence-features">
                ${sent.booster_count > 0 ? `
                  <div class="feature-tag">
                    Boosters: ${sent.booster_count}
                    <div class="feature-words">
                      ${sent.boosters.map(w => `<span class="feature-word">${w}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}
                ${sent.hedge_count > 0 ? `
                  <div class="feature-tag">
                    Hedges: ${sent.hedge_count}
                    <div class="feature-words">
                      ${sent.hedges.map(w => `<span class="feature-word">${w}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function createCorpusCard(item) {
  const hasB = item.boosterCount > 0;
  const hasH = item.hedgeCount > 0;
  const cardClass = hasB ? 'has-boosters' : (hasH ? 'has-hedges' : '');
  
  const genderBadgeClass = item.gender === 'Male' ? 'badge-gender-male' : 'badge-gender-female';
  const nativenessBadgeClass = item.nativeness === 'Native' ? 'badge-native' : 'badge-non-native';
  
  let boosterHedgeSection = '';
  if (item.boosterCount > 0 || item.hedgeCount > 0) {
    boosterHedgeSection = '<div class="booster-hedge-section">';
    
    if (item.boosterCount > 0) {
      boosterHedgeSection += `
        <div class="bh-title">Boosters (${item.boosterCount})</div>
        <div class="bh-words">
          ${item.boostersList.map(word => `<span class="bh-word">${word}</span>`).join('')}
        </div>
      `;
    }
    
    if (item.hedgeCount > 0) {
      boosterHedgeSection += `
        <div class="bh-title" style="margin-top: 12px;">Hedges (${item.hedgeCount})</div>
        <div class="bh-words">
          ${item.hedgesList.map(word => `<span class="bh-word">${word}</span>`).join('')}
        </div>
      `;
    }
    
    boosterHedgeSection += '</div>';
  }
  
  return `
    <div class="corpus-card ${cardClass}">
      <div class="card-header">
        <div class="speaker-name" onclick="viewProfile('${item.url}')">${item.name || 'Unknown Speaker'}</div>
        <div class="speaker-badges">
          <span class="badge ${genderBadgeClass}">${item.gender || 'N/A'}</span>
          <span class="badge ${nativenessBadgeClass}">${item.nativeness || 'N/A'}</span>
          <span class="badge badge-price">$${item.price.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="metadata">
        <div class="meta-item"><span class="meta-label">Language:</span><span class="meta-value">${item.language || 'N/A'}</span></div>
        <div class="meta-item"><span class="meta-label">Country:</span><span class="meta-value">${item.country || 'N/A'}</span></div>
        <div class="meta-item"><span class="meta-label">Sentence:</span><span class="meta-value">${item.sentenceIndex + 1} / ${item.totalSentences}</span></div>
      </div>
      
      <div class="sentence-content">${item.sentence || 'No sentence available'}</div>
      
      <div class="linguistic-details">
        <div class="detail-item"><span class="detail-label">Length:</span><span class="detail-value">${item.length} chars</span></div>
        <div class="detail-item"><span class="detail-label">Matches:</span><span class="detail-value">${item.matches.length}</span></div>
        <div class="detail-item"><span class="detail-label">Total Count:</span><span class="detail-value">${item.totalCount}</span></div>
        ${item.matches.length > 0 ? `<div class="detail-item"><span class="detail-label">Matched Words:</span><span class="detail-value">${item.matches.join(', ')}</span></div>` : ''}
      </div>
      
      ${boosterHedgeSection}
    </div>
  `;
}

function viewProfile(url) {
  currentView = 'profile';
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.toggle-btn')[1].classList.add('active');
  
  document.querySelectorAll('.view-sentence').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.view-profile').forEach(el => el.style.display = 'block');
  
  const profile = profileData[url];
  if (profile) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = createProfileCard(profile);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.addEventListener('load', loadData);
