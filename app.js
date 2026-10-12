/**
 * League Matchups Companion - Application Logic
 */

// --- Constants & Global State ---
const FALLBACK_VERSION = '14.13.1';
let ddragonVersion = FALLBACK_VERSION;
let championsData = {}; // Stores all champions loaded from Riot API
let championsList = []; // Array of champion objects sorted by name

// App state
let state = {
    championPool: {
        TOP: [],
        JUNGLE: [],
        MID: [],
        ADC: [],
        SUPPORT: []
    },
    matchups: {}      // Keyed by "ROLE_myChamp_enemyChamp", e.g. "TOP_Camille_Jax"
};

let activeRole = 'TOP'; // Currently active role in Champion Pool UI

// Fallback champion list in case Riot's API is offline
const OFFLINE_FALLBACK_CHAMPIONS = {
    "Aatrox": { id: "Aatrox", name: "Aatrox", title: "l'Épée des Darkin" },
    "Ahri": { id: "Ahri", name: "Ahri", title: "Renard à neuf queues" },
    "Akali": { id: "Akali", name: "Akali", title: "Assassin sans maître" },
    "Camille": { id: "Camille", name: "Camille", title: "Ombre d'acier" },
    "Darius": { id: "Darius", name: "Darius", title: "Main de Noxus" },
    "Fiora": { id: "Fiora", name: "Fiora", title: "Sublime duelliste" },
    "Garen": { id: "Garen", name: "Garen", title: "Force de Demacia" },
    "Irelia": { id: "Irelia", name: "Irelia", title: "Danseuse des lames" },
    "Jax": { id: "Jax", name: "Jax", title: "Maître d'armes" },
    "Malphite": { id: "Malphite", name: "Malphite", title: "Éclat du monolithe" },
    "Ornn": { id: "Ornn", name: "Ornn", title: "Feu sous la montagne" },
    "Riven": { id: "Riven", name: "Riven", title: "Exilée brisée" },
    "Shen": { id: "Shen", name: "Shen", title: "Œil du crépuscule" },
    "Yasuo": { id: "Yasuo", name: "Yasuo", title: "Disgracié" },
    "Yone": { id: "Yone", name: "Yone", title: "Inoublié" }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalData();
    setupNavigation();
    setupEventListeners();
    setupRoleTabs();
    if (typeof initGuidesView === 'function') {
        initGuidesView();
    }
    if (typeof initAllMatchupsView === 'function') {
        initAllMatchupsView();
    }
    
    // Load champion data from Riot Games Data Dragon API
    await fetchChampionsList();
    
    // Initialize UI views
    renderAllViews();
});

// --- Data Loading & Storage ---
function loadLocalData() {
    try {
        const savedPool = localStorage.getItem('lmc_champion_pool');
        const savedMatchups = localStorage.getItem('lmc_matchups');
        
        if (savedPool) {
            const parsedPool = JSON.parse(savedPool);
            // Handle migration if it was a flat array
            if (Array.isArray(parsedPool)) {
                state.championPool = {
                    TOP: parsedPool,
                    JUNGLE: [],
                    MID: [],
                    ADC: [],
                    SUPPORT: []
                };
                saveData(); // instantly persist migrated structure
            } else {
                state.championPool = parsedPool;
            }
        }
        
        if (savedMatchups) {
            const parsedMatchups = JSON.parse(savedMatchups);
            state.matchups = {};
            let migratedCount = 0;
            
            for (const [key, m] of Object.entries(parsedMatchups)) {
                let cleanRole = 'TOP';
                if (m.role) {
                    const r = m.role.toLowerCase();
                    if (r.includes('top')) cleanRole = 'TOP';
                    else if (r.includes('jungle') || r.includes('jng')) cleanRole = 'JUNGLE';
                    else if (r.includes('mid')) cleanRole = 'MID';
                    else if (r.includes('adc') || r.includes('bot') || r.includes('botlane')) cleanRole = 'ADC';
                    else if (r.includes('sup') || r.includes('support')) cleanRole = 'SUPPORT';
                }
                
                const newKey = key.startsWith(`${cleanRole}_`) ? key : `${cleanRole}_${m.myChamp}_${m.enemyChamp}`;
                state.matchups[newKey] = {
                    ...m,
                    id: newKey,
                    role: cleanRole,
                    style: m.style || m.role || '' // transfer free-text to style
                };
                if (newKey !== key) migratedCount++;
            }
            
            if (migratedCount > 0) {
                saveData();
            }
        }
    } catch (e) {
        console.error("Erreur lors de la lecture du LocalStorage", e);
        showNotification("Impossible de charger vos données locales.", "danger");
    }
}

function saveData() {
    try {
        localStorage.setItem('lmc_champion_pool', JSON.stringify(state.championPool));
        localStorage.setItem('lmc_matchups', JSON.stringify(state.matchups));
    } catch (e) {
        console.error("Erreur lors de la sauvegarde dans le LocalStorage", e);
        showNotification("Erreur de sauvegarde locale. Votre stockage est peut-être plein.", "danger");
    }
}

// Fetch list of champions from Riot API
async function fetchChampionsList() {
    try {
        // Try to fetch latest version first
        const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        if (versionResponse.ok) {
            const versions = await versionResponse.json();
            ddragonVersion = versions[0] || FALLBACK_VERSION;
        }
    } catch (e) {
        console.warn("Impossible de récupérer la dernière version de Data Dragon. Utilisation de la version locale.", e);
    }

    try {
        const url = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/champion.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Riot server returned error code " + response.status);
        
        const result = await response.json();
        championsData = result.data;
        
        // Convert to array and sort alphabetically
        championsList = Object.values(championsData).sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
        console.error("Impossible de récupérer les champions de Data Dragon. Mode hors-ligne activé.", e);
        // Load fallback offline data
        championsData = OFFLINE_FALLBACK_CHAMPIONS;
        championsList = Object.values(OFFLINE_FALLBACK_CHAMPIONS).sort((a, b) => a.name.localeCompare(b.name));
        showNotification("Mode hors-ligne : la liste des champions est restreinte.", "warning");
    }
}

// Helper to get champion square image URL
function getChampSquareUrl(champId) {
    if (OFFLINE_FALLBACK_CHAMPIONS[champId] && Object.keys(championsData).length === Object.keys(OFFLINE_FALLBACK_CHAMPIONS).length) {
        // Return a default SVG placeholder / icon if totally offline and loading fallback
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%231e2836"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23c89b3c" font-size="12" font-family="sans-serif">${champId.substring(0,2)}</text></svg>`;
    }
    return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champId}.png`;
}

// --- Navigation / Routing ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // Switch tabs
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Custom behaviors per tab load
            if (targetTab === 'dashboard') {
                renderDashboard();
            } else if (targetTab === 'champion-pool') {
                renderChampionPool();
            } else if (targetTab === 'matchups') {
                renderMatchupsList();
            } else if (targetTab === 'guides') {
                if (typeof renderGuidesView === 'function') {
                    renderGuidesView();
                }
            } else if (targetTab === 'all-matchups') {
                if (typeof renderAllMatchupsView === 'function') {
                    renderAllMatchupsView();
                }
            }

            // Sync URL hash
            if (window.location.hash !== `#${targetTab}`) {
                history.replaceState(null, '', `#${targetTab}`);
            }
        });
    });

    // Handle initial hash navigation if present
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
        const hashTarget = document.querySelector(`.nav-item[data-tab="${initialHash}"]`);
        if (hashTarget) {
            setTimeout(() => hashTarget.click(), 50);
        }
    }
}

// --- View Renderers ---

function renderAllViews() {
    renderDashboard();
    renderChampionPool();
    renderMatchupsList();
    setupCustomDropdowns();
    if (typeof renderGuidesView === 'function') {
        renderGuidesView();
    }
    if (typeof renderAllMatchupsView === 'function') {
        renderAllMatchupsView();
    }
}

// Tab: Dashboard
function renderDashboard() {
    // 1. Update stats count
    const poolCount = Object.values(state.championPool).reduce((acc, arr) => acc + arr.length, 0);
    const matchupsCount = Object.keys(state.matchups).length;

    document.getElementById('stat-pool-count').textContent = poolCount;
    document.getElementById('stat-matchup-count').textContent = matchupsCount;

    // 2. Compute difficulty breakdown
    let easy = 0, medium = 0, hard = 0, skill = 0;
    Object.values(state.matchups).forEach(m => {
        if (m.difficulty === 'easy') easy++;
        else if (m.difficulty === 'medium') medium++;
        else if (m.difficulty === 'hard') hard++;
        else if (m.difficulty === 'skill') skill++;
    });

    document.getElementById('count-easy').textContent = easy;
    document.getElementById('count-medium').textContent = medium;
    document.getElementById('count-hard').textContent = hard;
    document.getElementById('count-skill').textContent = skill;

    const total = matchupsCount || 1; // Avoid divide by zero
    document.querySelector('.diff-bar.easy').style.width = `${(easy / total) * 100}%`;
    document.querySelector('.diff-bar.medium').style.width = `${(medium / total) * 100}%`;
    document.querySelector('.diff-bar.hard').style.width = `${(hard / total) * 100}%`;
    document.querySelector('.diff-bar.skill').style.width = `${(skill / total) * 100}%`;

    // 3. Render recent matchups table
    const recentTbody = document.getElementById('recent-matchups-tbody');
    
    // Sort matchups by updatedAt desc
    const sortedMatchups = Object.values(state.matchups).sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    if (sortedMatchups.length === 0) {
        recentTbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Aucun matchup défini pour le moment. Allez dans "Mon Pool" pour commencer.</td>
            </tr>
        `;
    } else {
        recentTbody.innerHTML = '';
        sortedMatchups.slice(0, 5).forEach(m => {
            const tr = document.createElement('tr');
            
            const difficultyLabelMap = {
                'easy': 'Facile',
                'medium': 'Moyen',
                'hard': 'Difficile',
                'skill': 'Skill'
            };

            const formattedDate = new Date(m.updatedAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            tr.innerHTML = `
                <td>
                    <div class="champ-badge">
                        <img src="${getChampSquareUrl(m.myChamp)}" alt="${m.myChamp}">
                        <span>${championsData[m.myChamp]?.name || m.myChamp}</span>
                    </div>
                </td>
                <td class="text-center">
                    <span class="role-badge ${m.role.toLowerCase()}">${m.role}</span>
                </td>
                <td>
                    <div class="champ-badge">
                        <img src="${getChampSquareUrl(m.enemyChamp)}" alt="${m.enemyChamp}">
                        <span>${championsData[m.enemyChamp]?.name || m.enemyChamp}</span>
                    </div>
                </td>
                <td>
                    <span class="difficulty-tag ${m.difficulty}">${difficultyLabelMap[m.difficulty]}</span>
                </td>
                <td class="text-muted">${formattedDate}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-secondary btn-sm" onclick="launchFocusMode('${m.myChamp}', '${m.enemyChamp}', '${m.role}')">Focus</button>
                        <button class="btn btn-secondary btn-sm" onclick="editMatchup('${m.myChamp}', '${m.enemyChamp}', '${m.role}')">Éditer</button>
                    </div>
                </td>
            `;
            recentTbody.appendChild(tr);
        });
    }

    // 4. Update Quick Matchup Trigger states
    updateQuickCheckBtnStates();
}

// Tab: Champion Pool
function renderChampionPool() {
    const container = document.getElementById('pool-grid-container');
    const rolePool = state.championPool[activeRole] || [];
    
    if (rolePool.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⭐</div>
                <h3>Votre Champion Pool (${activeRole}) est vide</h3>
                <p>Ajoutez d'abord les champions que vous jouez en ${activeRole} pour pouvoir documenter vos matchups.</p>
                <button class="btn btn-primary btn-add-first-champ" id="pool-empty-add-btn">Ajouter mon premier champion</button>
            </div>
        `;
        document.getElementById('pool-empty-add-btn')?.addEventListener('click', openAddChampionModal);
        return;
    }

    container.innerHTML = '';
    
    rolePool.forEach(champId => {
        const champ = championsData[champId];
        if (!champ) return;

        // Count matchups for this champion in activeRole
        const matchupCount = Object.values(state.matchups).filter(m => m.myChamp === champId && m.role === activeRole).length;

        const card = document.createElement('div');
        card.className = 'pool-card';
        card.innerHTML = `
            <button class="pool-card-remove-btn" title="Retirer du pool" data-id="${champId}">&times;</button>
            <div class="pool-card-avatar" style="background-image: url('${getChampSquareUrl(champId)}')"></div>
            <div class="pool-card-name">${champ.name}</div>
            <div class="pool-card-title">${champ.title}</div>
            <div class="pool-card-stats">
                <span><strong>${matchupCount}</strong> matchups</span>
            </div>
        `;

        // Card action: click goes to matchups filtered by this champ, or prompts to add matchup
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('pool-card-remove-btn')) return;
            
            // Go to Matchups and filter by this champ and role
            const filterSelect = document.getElementById('filter-my-champ');
            filterSelect.value = champId;
            
            const filterRole = document.getElementById('filter-role');
            filterRole.value = activeRole;
            
            renderMatchupsList();

            // Switch to matchups tab
            document.querySelector('.nav-item[data-tab="matchups"]').click();
        });

        // Remove btn action
        card.querySelector('.pool-card-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            removeChampionFromPool(champId, activeRole);
        });

        container.appendChild(card);
    });
}

// Tab: Matchups List
function renderMatchupsList() {
    const container = document.getElementById('matchups-list-container');
    const searchVal = document.getElementById('matchups-search-input').value.toLowerCase().trim();
    const filterRole = document.getElementById('filter-role').value;
    const filterDifficulty = document.getElementById('filter-difficulty').value;
    const filterMyChamp = document.getElementById('filter-my-champ').value;

    // Filter matchups
    const filtered = Object.values(state.matchups).filter(m => {
        // Search query
        const myName = (championsData[m.myChamp]?.name || m.myChamp).toLowerCase();
        const enemyName = (championsData[m.enemyChamp]?.name || m.enemyChamp).toLowerCase();
        const styleText = (m.style || '').toLowerCase();
        const matchesSearch = myName.includes(searchVal) || enemyName.includes(searchVal) || m.role.toLowerCase().includes(searchVal) || styleText.includes(searchVal) || m.tips.toLowerCase().includes(searchVal);

        // Role filter
        const matchesRole = filterRole === 'all' || m.role === filterRole;

        // Difficulty filter
        const matchesDifficulty = filterDifficulty === 'all' || m.difficulty === filterDifficulty;

        // My Champ filter
        const matchesMyChamp = filterMyChamp === 'all' || m.myChamp === filterMyChamp;

        return matchesSearch && matchesRole && matchesDifficulty && matchesMyChamp;
    });

    // Populate my champion filter dropdown in matchups tab
    const myChampSelect = document.getElementById('filter-my-champ');
    const currentSelection = myChampSelect.value;
    myChampSelect.innerHTML = '<option value="all">Tous mes champions</option>';
    
    let poolChamps = [];
    if (filterRole === 'all') {
        const uniqueChamps = new Set();
        Object.values(state.championPool).forEach(arr => arr.forEach(c => uniqueChamps.add(c)));
        poolChamps = Array.from(uniqueChamps).sort();
    } else {
        poolChamps = state.championPool[filterRole] || [];
    }

    poolChamps.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = championsData[c]?.name || c;
        myChampSelect.appendChild(opt);
    });
    
    // Restore selection if it still exists in the filtered champion pool
    if (poolChamps.includes(currentSelection) || currentSelection === 'all') {
        myChampSelect.value = currentSelection;
    } else {
        myChampSelect.value = 'all';
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <h3>Aucun matchup trouvé</h3>
                <p>Aucune note ne correspond à vos filtres actuels ou vous n'avez pas encore documenté de matchup.</p>
                <button class="btn btn-primary" onclick="document.getElementById('nav-editor-btn').click()">Rédiger ma première note</button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    filtered.forEach(m => {
        const difficultyLabelMap = {
            'easy': 'Facile',
            'medium': 'Moyen',
            'hard': 'Difficile',
            'skill': 'Skill'
        };

        const card = document.createElement('div');
        card.className = 'card matchup-list-card';
        
        card.innerHTML = `
            <div class="matchup-card-header">
                <div class="matchup-versus-display">
                    <img src="${getChampSquareUrl(m.myChamp)}" alt="${m.myChamp}" title="${m.myChamp}">
                    <span class="focus-vs-divider" style="font-size:16px;">VS</span>
                    <img src="${getChampSquareUrl(m.enemyChamp)}" alt="${m.enemyChamp}" title="${m.enemyChamp}">
                    <div class="matchup-versus-text">
                        <span style="display:flex; gap:6px; align-items:center;">
                            <span class="role-badge ${m.role.toLowerCase()}" style="padding:1px 5px; font-size:9px; line-height:1.2;">${m.role}</span>
                            <span>${m.style || 'Général'}</span>
                        </span>
                        <strong>${championsData[m.myChamp]?.name || m.myChamp} vs ${championsData[m.enemyChamp]?.name || m.enemyChamp}</strong>
                    </div>
                </div>
                <span class="difficulty-tag ${m.difficulty}">${difficultyLabelMap[m.difficulty]}</span>
            </div>
            <div class="matchup-card-body">
                ${m.early ? `<div><strong>Early Game :</strong> <div class="matchup-snippet">${m.early.substring(0, 120)}${m.early.length > 120 ? '...' : ''}</div></div>` : ''}
                ${m.tips ? `<div><strong>Conseil Clé :</strong> <div class="matchup-snippet" style="border-left-color: var(--blue-hextech);">${m.tips.substring(0, 120)}${m.tips.length > 120 ? '...' : ''}</div></div>` : ''}
            </div>
            <div class="matchup-card-footer">
                <span class="matchup-date">Modifié le ${new Date(m.updatedAt).toLocaleDateString('fr-FR')}</span>
                <div class="actions-cell">
                    <button class="btn btn-accent btn-sm" onclick="launchFocusMode('${m.myChamp}', '${m.enemyChamp}', '${m.role}')">Focus</button>
                    <button class="btn btn-secondary btn-sm" onclick="editMatchup('${m.myChamp}', '${m.enemyChamp}', '${m.role}')">Éditer</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMatchup('${m.myChamp}', '${m.enemyChamp}', '${m.role}')">Effacer</button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// Custom Searchable Dropdown Setup
function setupCustomDropdowns() {
    setupSingleDropdown('quick-my-champ-select', 'quick-my-options', true);
    setupSingleDropdown('quick-enemy-champ-select', 'quick-enemy-options', false);
    setupSingleDropdown('editor-my-champ-select', 'editor-my-options', true);
    setupSingleDropdown('editor-enemy-champ-select', 'editor-enemy-options', false);
}

function setupSingleDropdown(containerId, optionsId, restrictToPool) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const trigger = container.querySelector('.select-trigger');
    const dropdown = container.querySelector('.select-dropdown-list');
    const searchInput = container.querySelector('.select-search');
    const optionsContainer = document.getElementById(optionsId);

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close all other dropdowns
        document.querySelectorAll('.select-dropdown-list').forEach(list => {
            if (list !== dropdown) list.classList.add('hidden');
        });

        dropdown.classList.toggle('hidden');
        if (!dropdown.classList.contains('hidden')) {
            searchInput.value = '';
            filterOptions('');
            searchInput.focus();
        }
    });

    // Close when clicking outside
    document.addEventListener('click', () => {
        dropdown.classList.add('hidden');
    });

    // Search filter
    searchInput.addEventListener('input', (e) => {
        filterOptions(e.target.value.toLowerCase());
    });

    searchInput.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing dropdown
    });

    function filterOptions(query) {
        optionsContainer.innerHTML = '';
        
        let listToFilter = [];
        if (restrictToPool) {
            let role = 'TOP';
            if (containerId === 'quick-my-champ-select') {
                role = document.getElementById('quick-role-select').value;
            } else if (containerId === 'editor-my-champ-select') {
                role = document.getElementById('editor-role-select').value;
            }
            listToFilter = state.championPool[role] || [];
        } else {
            listToFilter = championsList.map(c => c.id);
        }
        
        let found = false;
        listToFilter.forEach(champId => {
            const champ = championsData[champId];
            if (!champ) return;

            if (champ.name.toLowerCase().includes(query)) {
                found = true;
                const opt = document.createElement('div');
                opt.className = 'select-option';
                opt.dataset.id = champId;
                opt.innerHTML = `
                    <img class="champ-avatar" src="${getChampSquareUrl(champId)}" alt="${champ.name}" style="width:24px;height:24px;">
                    <span>${champ.name}</span>
                `;

                opt.addEventListener('click', () => {
                    selectChampion(champId);
                });

                optionsContainer.appendChild(opt);
            }
        });

        if (!found) {
            optionsContainer.innerHTML = '<div class="text-muted text-center" style="padding: 12px 0; font-size:13px;">Aucun champion</div>';
        }
    }

    function selectChampion(champId) {
        const champ = championsData[champId];
        trigger.querySelector('.champ-avatar').className = 'champ-avatar';
        trigger.querySelector('.champ-avatar').style.backgroundImage = `url('${getChampSquareUrl(champId)}')`;
        trigger.querySelector('.champ-name').textContent = champ.name;
        trigger.dataset.value = champId;
        
        dropdown.classList.add('hidden');
        
        // Custom event on trigger to listen for selections
        const event = new CustomEvent('change', { detail: { value: champId } });
        container.dispatchEvent(event);
    }
}

// Reset custom select to default chooser state
function resetCustomSelect(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const trigger = container.querySelector('.select-trigger');
    trigger.querySelector('.champ-avatar').className = 'champ-avatar placeholder';
    trigger.querySelector('.champ-avatar').style.backgroundImage = 'none';
    trigger.querySelector('.champ-name').textContent = 'Choisir...';
    trigger.dataset.value = '';
}

function setCustomSelectValue(containerId, champId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const trigger = container.querySelector('.select-trigger');
    const champ = championsData[champId];
    if (champ) {
        trigger.querySelector('.champ-avatar').className = 'champ-avatar';
        trigger.querySelector('.champ-avatar').style.backgroundImage = `url('${getChampSquareUrl(champId)}')`;
        trigger.querySelector('.champ-name').textContent = champ.name;
        trigger.dataset.value = champId;
    }
}

// --- Action Handlers ---

// State operations
function addChampionToPool(champId, role = activeRole) {
    if (!state.championPool[role]) {
        state.championPool[role] = [];
    }
    if (state.championPool[role].includes(champId)) return;
    
    state.championPool[role].push(champId);
    state.championPool[role].sort();
    saveData();
    renderChampionPool();
    renderDashboard();
    
    // Refresh dropdown containers to show updated pool
    setupCustomDropdowns();
    
    showNotification(`${championsData[champId]?.name} a été ajouté à votre pool (${role}).`, "success");
}

function removeChampionFromPool(champId, role = activeRole) {
    if (!confirm(`Voulez-vous retirer ${championsData[champId]?.name} de votre pool (${role}) ? Vos matchups associés seront conservés.`)) return;

    state.championPool[role] = (state.championPool[role] || []).filter(id => id !== champId);
    saveData();
    renderChampionPool();
    renderDashboard();
    
    // Refresh dropdowns
    setupCustomDropdowns();
    
    showNotification(`${championsData[champId]?.name} retiré du pool (${role}).`, "warning");
}

// Open / Close modal for selecting pool champion
function openAddChampionModal() {
    const modal = document.getElementById('add-champion-modal');
    modal.classList.remove('hidden');
    
    const searchInput = document.getElementById('modal-search-input');
    searchInput.value = '';
    searchInput.focus();
    
    renderModalChampions('');
}

function closeModal() {
    document.getElementById('add-champion-modal').classList.add('hidden');
}

function renderModalChampions(query) {
    const container = document.getElementById('modal-champions-list');
    container.innerHTML = '';

    const filtered = championsList.filter(c => c.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading-spinner-container"><p>Aucun champion trouvé.</p></div>';
        return;
    }

    filtered.forEach(c => {
        const inPool = (state.championPool[activeRole] || []).includes(c.id);
        const btn = document.createElement('button');
        btn.className = `modal-champ-btn ${inPool ? 'in-pool' : ''}`;
        btn.innerHTML = `
            <img src="${getChampSquareUrl(c.id)}" alt="${c.name}">
            <span>${c.name}</span>
        `;

        if (!inPool) {
            btn.addEventListener('click', () => {
                addChampionToPool(c.id, activeRole);
                closeModal();
            });
        }

        container.appendChild(btn);
    });
}

// Matchups Save
function saveMatchupForm(e) {
    e.preventDefault();

    const myChamp = document.getElementById('editor-my-champ-select').querySelector('.select-trigger').dataset.value;
    const enemyChamp = document.getElementById('editor-enemy-champ-select').querySelector('.select-trigger').dataset.value;
    
    if (!myChamp || !enemyChamp) {
        alert("Veuillez sélectionner vos deux champions.");
        return;
    }

    const role = document.getElementById('editor-role-select').value;
    const key = `${role}_${myChamp}_${enemyChamp}`;
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    
    // If the key changed during modification, delete the old key to prevent duplicates
    const oldKey = document.getElementById('matchup-id').value;
    if (oldKey && oldKey !== key) {
        delete state.matchups[oldKey];
    }

    state.matchups[key] = {
        id: key,
        myChamp: myChamp,
        enemyChamp: enemyChamp,
        difficulty: selectedDifficulty,
        role: role,
        style: document.getElementById('matchup-style').value.trim(),
        runes: document.getElementById('matchup-runes').value.trim(),
        items: document.getElementById('matchup-items').value.trim(),
        early: document.getElementById('matchup-early').value.trim(),
        mid: document.getElementById('matchup-mid').value.trim(),
        tips: document.getElementById('matchup-tips').value.trim(),
        updatedAt: new Date().toISOString()
    };

    saveData();
    showNotification(`Matchup [${role}] ${championsData[myChamp].name} VS ${championsData[enemyChamp].name} enregistré.`, "success");

    // Reset Form
    resetMatchupForm();

    // Redirect to list
    document.querySelector('.nav-item[data-tab="matchups"]').click();
}

function resetMatchupForm() {
    document.getElementById('matchup-id').value = '';
    document.getElementById('editor-role-select').value = 'TOP';
    
    // Trigger change to refresh custom select options for top lane
    const event = new Event('change');
    document.getElementById('editor-role-select').dispatchEvent(event);
    
    resetCustomSelect('editor-my-champ-select');
    resetCustomSelect('editor-enemy-champ-select');
    
    document.querySelector('input[name="difficulty"][value="easy"]').checked = true;
    document.getElementById('matchup-style').value = '';
    document.getElementById('matchup-runes').value = '';
    document.getElementById('matchup-items').value = '';
    document.getElementById('matchup-early').value = '';
    document.getElementById('matchup-mid').value = '';
    document.getElementById('matchup-tips').value = '';

    // Restore headers to standard creating state
    document.getElementById('editor-title').textContent = "Créer un Matchup";
    document.getElementById('editor-subtitle').textContent = "Documentez vos stratégies, builds et astuces contre un adversaire";
}

// Edit Matchup loader
window.editMatchup = function(myChamp, enemyChamp, role) {
    const key = `${role}_${myChamp}_${enemyChamp}`;
    const m = state.matchups[key];
    if (!m) return;

    // Switch to editor tab
    document.querySelector('.nav-item[data-tab="editor"]').click();

    // Fill form
    document.getElementById('matchup-id').value = key;
    document.getElementById('editor-role-select').value = m.role;
    
    // Trigger change to update Mon Champion options list
    const event = new Event('change');
    document.getElementById('editor-role-select').dispatchEvent(event);

    setCustomSelectValue('editor-my-champ-select', m.myChamp);
    setCustomSelectValue('editor-enemy-champ-select', m.enemyChamp);
    
    document.querySelector(`input[name="difficulty"][value="${m.difficulty}"]`).checked = true;
    document.getElementById('matchup-style').value = m.style || '';
    document.getElementById('matchup-runes').value = m.runes || '';
    document.getElementById('matchup-items').value = m.items || '';
    document.getElementById('matchup-early').value = m.early || '';
    document.getElementById('matchup-mid').value = m.mid || '';
    document.getElementById('matchup-tips').value = m.tips || '';

    // Customize title for modification mode
    document.getElementById('editor-title').textContent = `Modifier le Matchup : [${role}] ${championsData[myChamp]?.name || myChamp} VS ${championsData[enemyChamp]?.name || enemyChamp}`;
    document.getElementById('editor-subtitle').textContent = "Mettez à jour vos notes de combat.";
};

// Delete Matchup operation
window.deleteMatchup = function(myChamp, enemyChamp, role) {
    const key = `${role}_${myChamp}_${enemyChamp}`;
    const myName = championsData[myChamp]?.name || myChamp;
    const enemyName = championsData[enemyChamp]?.name || enemyChamp;

    if (!confirm(`Effacer définitivement vos notes pour [${role}] ${myName} VS ${enemyName} ?`)) return;

    delete state.matchups[key];
    saveData();
    renderDashboard();
    renderMatchupsList();

    showNotification(`Matchup [${role}] ${myName} VS ${enemyName} effacé.`, "warning");
};

// --- Focus Mode Controller ---
window.launchFocusMode = function(myChamp, enemyChamp, role) {
    const key = `${role}_${myChamp}_${enemyChamp}`;
    const m = state.matchups[key];
    if (!m) {
        alert("Ce matchup n'est pas encore documenté. Veuillez le créer d'abord !");
        return;
    }

    // Populate focus view content
    const headers = document.getElementById('focus-champ-headers');
    headers.innerHTML = `
        <div class="focus-champ my-champ">
            <div class="focus-champ-info">
                <h4>${championsData[m.myChamp]?.name || m.myChamp}</h4>
                <p>Votre Champion</p>
            </div>
            <div class="focus-champ-avatar" style="background-image: url('${getChampSquareUrl(m.myChamp)}')"></div>
        </div>
        <div class="focus-vs-divider">VS</div>
        <div class="focus-champ enemy-champ">
            <div class="focus-champ-avatar" style="background-image: url('${getChampSquareUrl(m.enemyChamp)}')"></div>
            <div class="focus-champ-info">
                <h4>${championsData[m.enemyChamp]?.name || m.enemyChamp}</h4>
                <p>Champion Ennemi</p>
            </div>
        </div>
    `;

    // Difficulty card
    const diffCard = document.getElementById('focus-card-difficulty');
    diffCard.className = `focus-card difficulty-focus-card ${m.difficulty}`;
    
    const difficultyLabelMap = {
        'easy': 'Facile',
        'medium': 'Moyen',
        'hard': 'Difficile',
        'skill': 'Skill Matchup'
    };

    diffCard.innerHTML = `
        <span class="focus-diff-title">Difficulté Matchup</span>
        <span class="focus-diff-val ${m.difficulty}">${difficultyLabelMap[m.difficulty]}</span>
        <span class="focus-role-val">
            <span class="role-badge ${m.role.toLowerCase()}" style="margin-right:6px; border:none; padding:0; background:none;">${m.role}</span>
            - ${m.style || 'Général'}
        </span>
    `;

    // Sections texts
    document.getElementById('focus-content-early').textContent = m.early || 'Aucune note pour l\'early game.';
    document.getElementById('focus-content-setup').textContent = `[RUNES]\n${m.runes || 'Non spécifié'}\n\n[ITEMS]\n${m.items || 'Non spécifié'}`;
    document.getElementById('focus-content-tips').textContent = m.tips || 'Aucun conseil clé renseigné.';
    document.getElementById('focus-content-mid').textContent = m.mid || 'Aucune note pour le mid/late game.';

    // Show Focus Mode tab
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(n => n.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));

    const focusNavItem = document.querySelector('.nav-item[data-tab="focus-mode"]');
    focusNavItem.classList.add('active');
    document.getElementById('focus-mode').classList.add('active');
};

// Quick Matchup Trigger validations
function updateQuickCheckBtnStates() {
    const myChamp = document.getElementById('quick-my-champ-select').querySelector('.select-trigger').dataset.value;
    const enemyChamp = document.getElementById('quick-enemy-champ-select').querySelector('.select-trigger').dataset.value;

    const searchBtn = document.getElementById('quick-search-btn');
    const focusBtn = document.getElementById('quick-focus-btn');

    if (myChamp && enemyChamp) {
        searchBtn.disabled = false;
        focusBtn.disabled = false;
    } else {
        searchBtn.disabled = true;
        focusBtn.disabled = true;
    }
}

// --- Import & Export Controllers ---
function exportData() {
    try {
        const dataStr = JSON.stringify(state, null, 4);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.download = `lol_matchups_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification("Données exportées avec succès !", "success");
    } catch (e) {
        console.error("Export failed", e);
        showNotification("L'exportation a échoué.", "danger");
    }
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const imported = JSON.parse(evt.target.result);
            
            // Validation basic schema & migration if needed
            if (imported.championPool && imported.matchups && typeof imported.matchups === 'object') {
                let cleanPool = {};
                if (Array.isArray(imported.championPool)) {
                    cleanPool = {
                        TOP: imported.championPool,
                        JUNGLE: [],
                        MID: [],
                        ADC: [],
                        SUPPORT: []
                    };
                } else {
                    cleanPool = imported.championPool;
                }
                
                let cleanMatchups = {};
                for (const [key, m] of Object.entries(imported.matchups)) {
                    let cleanRole = m.role || 'TOP';
                    const r = cleanRole.toLowerCase();
                    if (r.includes('top')) cleanRole = 'TOP';
                    else if (r.includes('jungle') || r.includes('jng')) cleanRole = 'JUNGLE';
                    else if (r.includes('mid')) cleanRole = 'MID';
                    else if (r.includes('adc') || r.includes('bot') || r.includes('botlane')) cleanRole = 'ADC';
                    else if (r.includes('sup') || r.includes('support')) cleanRole = 'SUPPORT';
                    
                    const newKey = key.startsWith(`${cleanRole}_`) ? key : `${cleanRole}_${m.myChamp}_${m.enemyChamp}`;
                    cleanMatchups[newKey] = {
                        ...m,
                        id: newKey,
                        role: cleanRole,
                        style: m.style || m.role || ''
                    };
                }
                
                state = {
                    championPool: cleanPool,
                    matchups: cleanMatchups
                };
                
                saveData();
                renderAllViews();
                showNotification("Données importées avec succès !", "success");
                
                // Switch to dashboard
                document.querySelector('.nav-item[data-tab="dashboard"]').click();
            } else {
                throw new Error("Invalid structure");
            }
        } catch (err) {
            console.error("Import error", err);
            showNotification("Le fichier JSON n'est pas valide ou est corrompu.", "danger");
        }
    };
    reader.readAsText(file);
}

function resetAllData() {
    if (!confirm("ATTENTION : Voulez-vous vraiment effacer l'intégralité de vos notes de matchups et votre pool de champions ? Cette action est irréversible !")) {
        return;
    }

    state.championPool = {
        TOP: [],
        JUNGLE: [],
        MID: [],
        ADC: [],
        SUPPORT: []
    };
    state.matchups = {};
    saveData();
    
    // Refresh UI
    renderAllViews();
    setupCustomDropdowns();
    
    showNotification("Toutes les données ont été réinitialisées.", "warning");
    document.querySelector('.nav-item[data-tab="dashboard"]').click();
}

// --- Toast Notifications System ---
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.fontFamily = 'var(--font-heading)';
    toast.style.fontWeight = '700';
    toast.style.fontSize = '14px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    toast.style.animation = 'fadeIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';

    if (type === 'success') {
        toast.style.backgroundColor = '#1e2f23';
        toast.style.border = '1px solid var(--diff-easy)';
        toast.style.color = 'var(--diff-easy)';
        toast.innerHTML = '🛡️ ' + message;
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#2f281e';
        toast.style.border = '1px solid var(--diff-medium)';
        toast.style.color = 'var(--diff-medium)';
        toast.innerHTML = '⚠️ ' + message;
    } else {
        toast.style.backgroundColor = '#2f1e20';
        toast.style.border = '1px solid var(--diff-hard)';
        toast.style.color = 'var(--diff-hard)';
        toast.innerHTML = '🚨 ' + message;
    }

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// --- Role Tabs UI Setup ---
function setupRoleTabs() {
    const tabs = document.querySelectorAll('.role-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeRole = tab.getAttribute('data-role');
            renderChampionPool();
        });
    });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Add Champion Modal triggers
    document.getElementById('add-pool-champ-btn')?.addEventListener('click', openAddChampionModal);
    document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
    
    // Modal search
    document.getElementById('modal-search-input')?.addEventListener('input', (e) => {
        renderModalChampions(e.target.value.toLowerCase().trim());
    });

    // Matchup Form Submit
    document.getElementById('matchup-form')?.addEventListener('submit', saveMatchupForm);
    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
        resetMatchupForm();
        document.querySelector('.nav-item[data-tab="matchups"]').click();
    });

    // Quick Checker listeners for enabling buttons on change
    document.getElementById('quick-my-champ-select')?.addEventListener('change', updateQuickCheckBtnStates);
    document.getElementById('quick-enemy-champ-select')?.addEventListener('change', updateQuickCheckBtnStates);
    
    // Quick Checker role select change
    document.getElementById('quick-role-select')?.addEventListener('change', () => {
        resetCustomSelect('quick-my-champ-select');
        updateQuickCheckBtnStates();
    });

    // Editor role select change
    document.getElementById('editor-role-select')?.addEventListener('change', () => {
        resetCustomSelect('editor-my-champ-select');
    });

    // Quick Checker Trigger Actions
    document.getElementById('quick-search-btn')?.addEventListener('click', () => {
        const myChamp = document.getElementById('quick-my-champ-select').querySelector('.select-trigger').dataset.value;
        const enemyChamp = document.getElementById('quick-enemy-champ-select').querySelector('.select-trigger').dataset.value;
        const role = document.getElementById('quick-role-select').value;
        
        if (myChamp && enemyChamp) {
            // Apply filters to matchups tab
            const searchInput = document.getElementById('matchups-search-input');
            searchInput.value = ''; // clear text search
            
            document.getElementById('filter-role').value = role;
            document.getElementById('filter-my-champ').value = myChamp;
            document.getElementById('filter-difficulty').value = 'all';

            // Filter on matchups list is computed dynamically, let's trigger it
            renderMatchupsList();

            // Redirect
            document.querySelector('.nav-item[data-tab="matchups"]').click();
        }
    });

    document.getElementById('quick-focus-btn')?.addEventListener('click', () => {
        const myChamp = document.getElementById('quick-my-champ-select').querySelector('.select-trigger').dataset.value;
        const enemyChamp = document.getElementById('quick-enemy-champ-select').querySelector('.select-trigger').dataset.value;
        const role = document.getElementById('quick-role-select').value;
        
        if (myChamp && enemyChamp) {
            launchFocusMode(myChamp, enemyChamp, role);
        }
    });

    // Focus screen exit
    document.getElementById('exit-focus-btn')?.addEventListener('click', () => {
        // Go back to dashboard
        document.querySelector('.nav-item[data-tab="dashboard"]').click();
    });

    // Matchups tab filters
    document.getElementById('matchups-search-input')?.addEventListener('input', renderMatchupsList);
    document.getElementById('filter-difficulty')?.addEventListener('change', renderMatchupsList);
    document.getElementById('filter-my-champ')?.addEventListener('change', renderMatchupsList);
    document.getElementById('filter-role')?.addEventListener('change', renderMatchupsList);

    // Settings actions
    document.getElementById('export-data-btn')?.addEventListener('click', exportData);
    document.getElementById('reset-data-btn')?.addEventListener('click', resetAllData);
    
    const importInput = document.getElementById('import-file-input');
    const importTrigger = document.getElementById('import-trigger-btn');
    
    importTrigger?.addEventListener('click', () => importInput.click());
    importInput?.addEventListener('change', (e) => {
        const fileName = e.target.files[0]?.name || "Aucun fichier sélectionné";
        document.getElementById('import-status-text').textContent = fileName;
        importData(e);
    });
}
