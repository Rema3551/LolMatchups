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
    const customCount = Object.keys(state.matchups).length;

    document.getElementById('stat-pool-count').textContent = poolCount;
    document.getElementById('stat-matchup-count').textContent = customCount;

    // 2. Compute difficulty breakdown among customized matchups
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

    const total = customCount || 1; // Avoid divide by zero
    document.querySelector('.diff-bar.easy').style.width = `${(easy / total) * 100}%`;
    document.querySelector('.diff-bar.medium').style.width = `${(medium / total) * 100}%`;
    document.querySelector('.diff-bar.hard').style.width = `${(hard / total) * 100}%`;
    document.querySelector('.diff-bar.skill').style.width = `${(skill / total) * 100}%`;

    // 3. Render recent customized matchups table
    const recentTbody = document.getElementById('recent-matchups-tbody');
    
    // Sort matchups by updatedAt desc
    const sortedMatchups = Object.values(state.matchups).sort((a, b) => {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    if (sortedMatchups.length === 0) {
        recentTbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted" style="padding: 28px 16px;">
                    <div style="font-size: 15px; margin-bottom: 6px;">💡 <strong>Tous les duels sont déjà analysés par défaut !</strong></div>
                    <p style="font-size: 13px; color: var(--color-text-muted);">
                        Rendez-vous dans l'onglet <strong>Matchups & Duels</strong> ou utilisez la recherche ci-dessus : cliquez sur <em>✏️ Modifier</em> pour y ajouter vos propres astuces.
                    </p>
                </td>
            </tr>
        `;
    } else {
        recentTbody.innerHTML = '';
        sortedMatchups.slice(0, 8).forEach(m => {
            const tr = document.createElement('tr');
            
            const difficultyLabelMap = {
                'easy': 'Facile',
                'medium': 'Moyen',
                'hard': 'Difficile',
                'skill': 'Skill'
            };

            const notePreview = m.tips || m.customTip || m.early || 'Paramètres personnalisés';

            tr.innerHTML = `
                <td>
                    <div class="champ-badge">
                        <img src="${getChampSquareUrl(m.myChamp)}" alt="${m.myChamp}">
                        <span>${championsData[m.myChamp]?.name || m.myChamp}</span>
                    </div>
                </td>
                <td class="text-center">
                    <span class="role-badge ${(m.role || 'TOP').toLowerCase()}">${m.role || 'TOP'}</span>
                </td>
                <td>
                    <div class="champ-badge">
                        <img src="${getChampSquareUrl(m.enemyChamp)}" alt="${m.enemyChamp}">
                        <span>${championsData[m.enemyChamp]?.name || m.enemyChamp}</span>
                    </div>
                </td>
                <td>
                    <span class="difficulty-tag ${m.difficulty}">${difficultyLabelMap[m.difficulty] || m.difficulty}</span>
                </td>
                <td class="text-accent" style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ⭐ ${notePreview}
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-accent btn-sm" onclick="launchFocusMode('${m.myChamp}', '${m.enemyChamp}', '${m.role || 'TOP'}')">Focus</button>
                        <button class="btn btn-secondary btn-sm" onclick="openEditMatchupModal('${m.myChamp}', '${m.enemyChamp}', '${m.role || 'TOP'}')">Modifier</button>
                        <button class="btn btn-icon-only btn-sm" title="Rétablir par défaut Riot" onclick="resetMatchupToDefault('${m.myChamp}', '${m.enemyChamp}', '${m.role || 'TOP'}')">↺</button>
                    </div>
                </td>
            `;
            recentTbody.appendChild(tr);
        });
    }

    // 4. Update Quick Matchup Live Preview
    updateQuickMatchupPreview();
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
                <p>Ajoutez d'abord les champions que vous jouez en ${activeRole} pour accéder directement à leurs duels et personnaliser vos matchups.</p>
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

        // Count customized matchups for this champion in activeRole
        const customCount = Object.values(state.matchups).filter(m => m.myChamp === champId && m.role === activeRole && m.isCustom).length;

        const card = document.createElement('div');
        card.className = 'pool-card';
        card.innerHTML = `
            <button class="pool-card-remove-btn" title="Retirer du pool" data-id="${champId}">&times;</button>
            <div class="pool-card-avatar" style="background-image: url('${getChampSquareUrl(champId)}')"></div>
            <div class="pool-card-name">${champ.name}</div>
            <div class="pool-card-title">${champ.title}</div>
            <div class="pool-card-stats">
                <span><strong>${customCount}</strong> notes perso</span>
                <span style="display:inline-block; margin-top:8px; font-size:11px; color:var(--gold-hextech); font-weight:600;">Voir les duels ➔</span>
            </div>
        `;

        // Card action: click goes to matchups & duels for this champ and role
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('pool-card-remove-btn')) return;
            if (typeof window.navigateToMatchupView === 'function') {
                window.navigateToMatchupView(champId, activeRole);
            }
        });

        // Remove btn action
        card.querySelector('.pool-card-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            removeChampionFromPool(champId, activeRole);
        });

        container.appendChild(card);
    });
}


// Custom Searchable Dropdown Setup
function setupCustomDropdowns() {
    setupSingleDropdown('quick-my-champ-select', 'quick-my-options', true);
    setupSingleDropdown('quick-enemy-champ-select', 'quick-enemy-options', false);
}

function setupSingleDropdown(containerId, optionsId, isMyChamp) {
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
        
        const role = document.getElementById('quick-role-select')?.value || 'TOP';
        const poolChamps = state.championPool[role] || [];
        const laneChamps = (window.LANE_CHAMPIONS_POOL && window.LANE_CHAMPIONS_POOL[role]) || [];
        
        // Build list: if isMyChamp, show pool champions at top, followed by other lane champions, then remaining champions
        let orderedChamps = [];
        if (isMyChamp) {
            poolChamps.forEach(c => { if (!orderedChamps.includes(c)) orderedChamps.push(c); });
            laneChamps.forEach(c => { if (!orderedChamps.includes(c)) orderedChamps.push(c); });
            championsList.forEach(c => { if (!orderedChamps.includes(c.id)) orderedChamps.push(c.id); });
        } else {
            laneChamps.forEach(c => { if (!orderedChamps.includes(c)) orderedChamps.push(c); });
            championsList.forEach(c => { if (!orderedChamps.includes(c.id)) orderedChamps.push(c.id); });
        }
        
        let found = false;
        orderedChamps.forEach(champId => {
            const champ = championsData[champId];
            if (!champ) return;

            if (champ.name.toLowerCase().includes(query)) {
                found = true;
                const inPool = poolChamps.includes(champId);
                const opt = document.createElement('div');
                opt.className = 'select-option';
                opt.dataset.id = champId;
                opt.innerHTML = `
                    <img class="champ-avatar" src="${getChampSquareUrl(champId)}" alt="${champ.name}" style="width:24px;height:24px;">
                    <span>${champ.name}</span>
                    ${(isMyChamp && inPool) ? '<span class="pool-tag-mini" style="font-size:10px; color:var(--gold-hextech); margin-left:auto;">⭐ Mon Pool</span>' : ''}
                `;

                opt.addEventListener('click', () => {
                    selectChampion(champId);
                });

                optionsContainer.appendChild(opt);
            }
        });

        if (!found) {
            optionsContainer.innerHTML = '<div class="text-muted text-center" style="padding: 12px 0; font-size:13px;">Aucun champion trouvé</div>';
        }
    }

    function selectChampion(champId) {
        const champ = championsData[champId];
        trigger.querySelector('.champ-avatar').className = 'champ-avatar';
        trigger.querySelector('.champ-avatar').style.backgroundImage = `url('${getChampSquareUrl(champId)}')`;
        trigger.querySelector('.champ-name').textContent = champ?.name || champId;
        trigger.dataset.value = champId;
        
        dropdown.classList.add('hidden');
        
        // Trigger live preview update
        updateQuickMatchupPreview();
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

// --- Live Quick Matchup Preview Controller ---
function updateQuickMatchupPreview() {
    const previewContainer = document.getElementById('quick-matchup-preview');
    if (!previewContainer) return;

    const myChampTrigger = document.getElementById('quick-my-champ-select')?.querySelector('.select-trigger');
    const enemyChampTrigger = document.getElementById('quick-enemy-champ-select')?.querySelector('.select-trigger');
    const role = document.getElementById('quick-role-select')?.value || 'TOP';

    const myChamp = myChampTrigger?.dataset.value;
    const enemyChamp = enemyChampTrigger?.dataset.value;

    if (!myChamp || !enemyChamp) {
        previewContainer.innerHTML = `
            <div class="preview-prompt-text text-muted" style="padding: 16px 0; font-size: 13px; text-align: center;">
                💡 Choisissez votre champion et votre adversaire ci-dessus pour afficher l'analyse tactique complète.
            </div>
        `;
        return;
    }

    const m = window.getMatchupData ? window.getMatchupData(myChamp, enemyChamp, role) : window.generateMatchupAnalysis(myChamp, enemyChamp, role);

    previewContainer.innerHTML = `
        <div class="dashboard-preview-card diff-${m.difficulty} ${m.isCustom ? 'is-customized' : ''}">
            <div class="preview-card-header">
                <div class="preview-duo">
                    <div class="preview-avatar-box">
                        <img src="${getChampSquareUrl(m.myChamp)}" alt="${m.myChamp}">
                        <span>${m.myChamp}</span>
                    </div>
                    <span class="preview-vs">VS</span>
                    <div class="preview-avatar-box">
                        <img src="${getChampSquareUrl(m.enemyChamp)}" alt="${m.enemyChamp}">
                        <span>${m.enemyChamp}</span>
                    </div>
                </div>

                <div class="preview-header-meta">
                    <div class="preview-badges">
                        ${m.isCustom ? '<span class="matrix-custom-pill">⭐ Vos notes perso</span>' : ''}
                        <span class="matrix-diff-badge ${m.difficulty}">${m.difficultyLabel}</span>
                        <span class="matrix-range-delta ${m.deltaRange >= 0 ? 'pos' : 'neg'}">
                            ${m.deltaRange >= 0 ? '+' : ''}${m.deltaRange} portée
                        </span>
                    </div>
                </div>
            </div>

            <div class="preview-card-body">
                <div class="preview-key-tip ${m.isCustom ? 'custom-tip-box' : ''}">
                    <strong>${m.isCustom ? '⭐ VOTRE ASTUCE PERSONNELLE :' : '💡 ASTUCE CLÉ :'}</strong>
                    <p>${m.mainTip}</p>
                </div>
                <div class="preview-spell-alert">
                    <span>⚠️ <strong>Sort critique à esquiver :</strong> ${m.criticalSpellToWatch}</span>
                </div>
            </div>

            <div class="preview-card-actions">
                <button class="btn btn-accent" id="preview-focus-action-btn">
                    🎯 Lancer le Mode Focus Loading
                </button>
                <button class="btn btn-primary" id="preview-edit-action-btn">
                    ✏️ Modifier / Personnaliser
                </button>
                <button class="btn btn-secondary" id="preview-matrix-action-btn">
                    ⚔️ Voir dans Matchups & Duels
                </button>
            </div>
        </div>
    `;

    document.getElementById('preview-focus-action-btn')?.addEventListener('click', () => {
        launchFocusMode(myChamp, enemyChamp, role);
    });

    document.getElementById('preview-edit-action-btn')?.addEventListener('click', () => {
        openEditMatchupModal(myChamp, enemyChamp, role);
    });

    document.getElementById('preview-matrix-action-btn')?.addEventListener('click', () => {
        if (typeof allMatchupsCurrentLane !== 'undefined') allMatchupsCurrentLane = role;
        if (typeof allMatchupsMyChamp !== 'undefined') allMatchupsMyChamp = myChamp;
        if (typeof allMatchupsEnemyChamp !== 'undefined') allMatchupsEnemyChamp = enemyChamp;
        document.querySelector('.nav-item[data-tab="all-matchups"]')?.click();
    });
}

// --- Focus Mode Controller ---
window.launchFocusMode = function(myChamp, enemyChamp, role) {
    const m = window.getMatchupData ? window.getMatchupData(myChamp, enemyChamp, role) : window.generateMatchupAnalysis(myChamp, enemyChamp, role);

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
    
    diffCard.innerHTML = `
        <span class="focus-diff-title">Difficulté Matchup</span>
        <span class="focus-diff-val ${m.difficulty}">${m.difficultyLabel}</span>
        <span class="focus-role-val">
            <span class="role-badge ${m.lane.toLowerCase()}" style="margin-right:6px; border:none; padding:0; background:none;">${m.lane}</span>
            ${m.isCustom ? '⭐ Modifié par vous' : 'Riot Default'}
        </span>
    `;

    // Sections texts
    document.getElementById('focus-content-early').textContent = m.waveManagement || 'Conservez une bonne gestion de vague.';
    document.getElementById('focus-content-setup').textContent = m.itemsAdvice || 'Adaptez votre build selon les dégâts adverses.';
    document.getElementById('focus-content-tips').innerHTML = `
        <div style="margin-bottom: 12px; font-size: 16px; color: var(--gold-light);">
            ${m.mainTip}
        </div>
        <div style="font-size: 14px; color: var(--diff-hard);">
            ⚠️ <strong>Sort à esquiver :</strong> ${m.criticalSpellToWatch}
        </div>
    `;
    document.getElementById('focus-content-mid').textContent = m.allInTiming || 'Attendez que les sorts clés soient en récupération.';

    // Setup focus edit button
    const focusEditBtn = document.getElementById('focus-edit-matchup-btn');
    if (focusEditBtn) {
        focusEditBtn.onclick = () => {
            openEditMatchupModal(m.myChamp, m.enemyChamp, m.lane);
        };
    }

    // Show Focus Mode tab
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(n => n.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));

    const focusNavItem = document.querySelector('.nav-item[data-tab="focus-mode"]');
    focusNavItem?.classList.add('active');
    document.getElementById('focus-mode')?.classList.add('active');
};

// --- Direct Matchup Edit Modal Controller ---
window.openEditMatchupModal = function(myChamp, enemyChamp, lane) {
    const modal = document.getElementById('edit-matchup-modal');
    if (!modal) return;

    const m = window.getMatchupData ? window.getMatchupData(myChamp, enemyChamp, lane) : window.generateMatchupAnalysis(myChamp, enemyChamp, lane);

    // Form inputs
    document.getElementById('edit-modal-my-champ').value = myChamp;
    document.getElementById('edit-modal-enemy-champ').value = enemyChamp;
    document.getElementById('edit-modal-lane').value = lane;

    document.getElementById('edit-modal-title').textContent = `Modifier le Duel : ${myChamp} VS ${enemyChamp}`;
    const badge = document.getElementById('edit-modal-role-badge');
    badge.textContent = lane;
    badge.className = `role-badge ${lane.toLowerCase()}`;

    // Duo banner
    document.getElementById('edit-modal-duo-banner').innerHTML = `
        <div class="modal-duo-col">
            <img src="${getChampSquareUrl(myChamp)}" alt="${myChamp}">
            <strong>${myChamp}</strong>
        </div>
        <div class="modal-duo-vs">VS</div>
        <div class="modal-duo-col">
            <img src="${getChampSquareUrl(enemyChamp)}" alt="${enemyChamp}">
            <strong>${enemyChamp}</strong>
        </div>
    `;

    // Radio difficulty
    const radio = document.querySelector(`input[name="modal-difficulty"][value="${m.difficulty}"]`);
    if (radio) radio.checked = true;

    // Fields
    document.getElementById('edit-modal-tips').value = (m.isCustom && m.rawCustom && (m.rawCustom.tips || m.rawCustom.customTip)) ? (m.rawCustom.tips || m.rawCustom.customTip) : m.mainTip;
    document.getElementById('edit-modal-spell').value = m.criticalSpellToWatch || '';
    document.getElementById('edit-modal-early').value = m.waveManagement || '';
    document.getElementById('edit-modal-mid').value = m.allInTiming || '';
    document.getElementById('edit-modal-items').value = m.itemsAdvice || '';

    // Reset button display
    const resetBtn = document.getElementById('edit-modal-reset-btn');
    if (resetBtn) {
        resetBtn.style.display = m.isCustom ? 'inline-flex' : 'none';
        resetBtn.onclick = () => {
            resetMatchupToDefault(myChamp, enemyChamp, lane);
            closeEditMatchupModal();
        };
    }

    modal.classList.remove('hidden');
};

function closeEditMatchupModal() {
    document.getElementById('edit-matchup-modal')?.classList.add('hidden');
}

window.resetMatchupToDefault = function(myChamp, enemyChamp, lane) {
    const key = `${lane}_${myChamp}_${enemyChamp}`;
    if (!state.matchups[key]) return;

    if (!confirm(`Rétablir les astuces par défaut de League of Legends pour [${lane}] ${myChamp} VS ${enemyChamp} ?`)) {
        return;
    }

    delete state.matchups[key];
    saveData();
    renderDashboard();
    if (typeof renderAllMatchupsView === 'function') {
        renderAllMatchupsView();
    }
    // If focus mode is active, refresh it
    if (document.getElementById('focus-mode')?.classList.contains('active')) {
        launchFocusMode(myChamp, enemyChamp, lane);
    }
    showNotification(`Matchup ${myChamp} VS ${enemyChamp} rétabli par défaut.`, 'info');
};

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

    // Edit Matchup Modal listeners
    document.getElementById('close-edit-modal-btn')?.addEventListener('click', closeEditMatchupModal);
    document.getElementById('edit-modal-cancel-btn')?.addEventListener('click', closeEditMatchupModal);
    
    // Direct modal form submission
    document.getElementById('inline-matchup-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const myChamp = document.getElementById('edit-modal-my-champ').value;
        const enemyChamp = document.getElementById('edit-modal-enemy-champ').value;
        const lane = document.getElementById('edit-modal-lane').value;
        const difficulty = document.querySelector('input[name="modal-difficulty"]:checked')?.value || 'medium';
        const tips = document.getElementById('edit-modal-tips').value.trim();
        const criticalSpell = document.getElementById('edit-modal-spell').value.trim();
        const early = document.getElementById('edit-modal-early').value.trim();
        const mid = document.getElementById('edit-modal-mid').value.trim();
        const items = document.getElementById('edit-modal-items').value.trim();

        const key = `${lane}_${myChamp}_${enemyChamp}`;
        state.matchups[key] = {
            id: key,
            role: lane,
            myChamp: myChamp,
            enemyChamp: enemyChamp,
            difficulty: difficulty,
            tips: tips,
            criticalSpell: criticalSpell,
            early: early,
            mid: mid,
            items: items,
            isCustom: true,
            updatedAt: new Date().toISOString()
        };

        saveData();
        closeEditMatchupModal();
        showNotification(`Matchup ${myChamp} VS ${enemyChamp} personnalisé !`, "success");

        // Refresh views
        renderDashboard();
        if (typeof renderAllMatchupsView === 'function') {
            renderAllMatchupsView();
        }
        if (document.getElementById('focus-mode')?.classList.contains('active')) {
            launchFocusMode(myChamp, enemyChamp, lane);
        }
    });

    // Dashboard Explore Matrix button
    document.getElementById('dashboard-explore-matrix-btn')?.addEventListener('click', () => {
        document.querySelector('.nav-item[data-tab="all-matchups"]')?.click();
    });

    // Quick Checker role select change
    document.getElementById('quick-role-select')?.addEventListener('change', () => {
        resetCustomSelect('quick-my-champ-select');
        resetCustomSelect('quick-enemy-champ-select');
        updateQuickMatchupPreview();
    });

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
