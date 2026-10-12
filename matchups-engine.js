/**
 * League Matchups Companion - Contrôleur UI Universel des Matchups par Lane
 */

let allMatchupsCurrentLane = 'TOP';
let allMatchupsMyChamp = 'Aatrox';
let allMatchupsEnemyChamp = 'Jax';
let allMatchupsFilterDifficulty = 'all';
let allMatchupsFilterSearch = '';
let allMatchupsFilterRange = 'all'; // 'all', 'melee', 'ranged'
let allMatchupsViewMode = 'matrix'; // 'matrix' ou 'duel'

function getEffectiveLanePool(lane) {
    const defaultPool = (window.LANE_CHAMPIONS_POOL && window.LANE_CHAMPIONS_POOL[lane]) || (window.LANE_CHAMPIONS_POOL && window.LANE_CHAMPIONS_POOL.TOP) || [];
    const userPool = (window.state && window.state.championPool && window.state.championPool[lane]) || [];
    const userPoolSet = new Set(userPool);
    const others = defaultPool.filter(c => !userPoolSet.has(c)).sort();
    return [...userPool, ...others];
}

// Initialisation de la vue
function initAllMatchupsView() {
    setupAllMatchupsEventListeners();
}

function renderAllMatchupsView() {
    // S'assurer que le champion sélectionné est viable pour la lane active
    const pool = getEffectiveLanePool(allMatchupsCurrentLane);
    if (!pool.includes(allMatchupsMyChamp)) {
        allMatchupsMyChamp = pool[0] || 'Aatrox';
    }
    if (!pool.includes(allMatchupsEnemyChamp) || allMatchupsEnemyChamp === allMatchupsMyChamp) {
        allMatchupsEnemyChamp = pool.find(c => c !== allMatchupsMyChamp) || pool[1] || 'Jax';
    }

    renderLaneTabsBar();
    renderMyChampLaneSelector();
    
    if (allMatchupsViewMode === 'matrix') {
        renderMatchupsMatrix();
    } else {
        renderUniversalDuelSimulator();
    }
}

function setupAllMatchupsEventListeners() {
    // Onglets de lane
    document.querySelectorAll('.all-lane-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.all-lane-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            allMatchupsCurrentLane = btn.getAttribute('data-lane');
            renderAllMatchupsView();
        });
    });

    // Bascule de mode : Matrice de lane VS Simulateur 1v1 direct
    document.getElementById('mode-matrix-btn')?.addEventListener('click', () => {
        allMatchupsViewMode = 'matrix';
        document.getElementById('mode-matrix-btn').classList.add('active');
        document.getElementById('mode-duel-btn').classList.remove('active');
        renderAllMatchupsView();
    });

    document.getElementById('mode-duel-btn')?.addEventListener('click', () => {
        allMatchupsViewMode = 'duel';
        document.getElementById('mode-duel-btn').classList.add('active');
        document.getElementById('mode-matrix-btn').classList.remove('active');
        renderAllMatchupsView();
    });

    // Barre de recherche
    document.getElementById('matrix-search-input')?.addEventListener('input', (e) => {
        allMatchupsFilterSearch = e.target.value.toLowerCase().trim();
        renderMatchupsMatrix();
    });

    // Filtres de difficulté
    document.querySelectorAll('.matrix-diff-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.matrix-diff-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            allMatchupsFilterDifficulty = chip.getAttribute('data-diff');
            renderMatchupsMatrix();
        });
    });

    // Filtres de portée (Melee / Ranged)
    document.querySelectorAll('.matrix-range-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.matrix-range-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            allMatchupsFilterRange = chip.getAttribute('data-range');
            renderMatchupsMatrix();
        });
    });
}

function renderLaneTabsBar() {
    document.querySelectorAll('.all-lane-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lane') === allMatchupsCurrentLane);
    });
}

// Rendu du sélecteur "Mon Champion" pour la lane en cours
function renderMyChampLaneSelector() {
    const select = document.getElementById('matrix-my-champ-select');
    if (!select) return;

    select.innerHTML = '';
    const pool = getEffectiveLanePool(allMatchupsCurrentLane);
    const userPool = (window.state && window.state.championPool && window.state.championPool[allMatchupsCurrentLane]) || [];

    pool.forEach(champId => {
        const opt = document.createElement('option');
        opt.value = champId;
        const isMelee = window.isMeleeChampion ? window.isMeleeChampion(champId) : true;
        const inPool = userPool.includes(champId);
        opt.textContent = `${inPool ? '⭐ ' : ''}${champId} (${isMelee ? '⚔️ Mêlée' : '🏹 Distance'})`;
        if (champId === allMatchupsMyChamp) opt.selected = true;
        select.appendChild(opt);
    });

    select.onchange = (e) => {
        allMatchupsMyChamp = e.target.value;
        renderAllMatchupsView();
    };

    // Mettre à jour l'avatar de mon champion
    const avatar = document.getElementById('matrix-my-champ-avatar');
    if (avatar) {
        avatar.style.backgroundImage = `url('${getChampSquareUrl(allMatchupsMyChamp)}')`;
    }
}

// Rendu de la grille exhaustive de TOUS les matchups pour le champion dans cette lane
function renderMatchupsMatrix() {
    const container = document.getElementById('matrix-matchups-grid');
    const matrixViewContainer = document.getElementById('matrix-view-container');
    const duelViewContainer = document.getElementById('duel-view-container');

    if (matrixViewContainer) matrixViewContainer.style.display = 'block';
    if (duelViewContainer) duelViewContainer.style.display = 'none';

    if (!container) return;
    container.innerHTML = '';

    const myChamp = allMatchupsMyChamp;
    const lane = allMatchupsCurrentLane;
    const pool = window.LANE_CHAMPIONS_POOL[lane] || window.LANE_CHAMPIONS_POOL.TOP;

    // Générer tous les matchups possibles face à tous les autres champions de cette lane
    const allOpponents = pool.filter(c => c !== myChamp);

    let easyCount = 0, mediumCount = 0, hardCount = 0, skillCount = 0;

    const generatedMatchups = allOpponents.map(enemyChamp => {
        const data = window.getMatchupData ? window.getMatchupData(myChamp, enemyChamp, lane) : window.generateMatchupAnalysis(myChamp, enemyChamp, lane);
        if (data.difficulty === 'easy') easyCount++;
        else if (data.difficulty === 'medium') mediumCount++;
        else if (data.difficulty === 'hard') hardCount++;
        else if (data.difficulty === 'skill') skillCount++;
        return data;
    });

    // Mettre à jour les compteurs de difficulté dans les puces
    document.getElementById('count-chip-all').textContent = generatedMatchups.length;
    document.getElementById('count-chip-easy').textContent = easyCount;
    document.getElementById('count-chip-medium').textContent = mediumCount;
    document.getElementById('count-chip-hard').textContent = hardCount;
    document.getElementById('count-chip-skill').textContent = skillCount;

    // Filtrer selon la recherche et les critères
    const filtered = generatedMatchups.filter(m => {
        // Recherche
        const nameMatches = m.enemyChamp.toLowerCase().includes(allMatchupsFilterSearch);
        if (!nameMatches) return false;

        // Difficulté
        if (allMatchupsFilterDifficulty !== 'all' && m.difficulty !== allMatchupsFilterDifficulty) {
            return false;
        }

        // Portée
        if (allMatchupsFilterRange === 'melee' && !m.enemyIsMelee) return false;
        if (allMatchupsFilterRange === 'ranged' && m.enemyIsMelee) return false;

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state col-full">
                <div class="empty-icon">🔍</div>
                <h3>Aucun matchup ne correspond à vos filtres</h3>
                <p>Modifiez votre recherche ou réinitialisez les filtres de difficulté.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(m => {
        const card = document.createElement('div');
        card.className = `matchup-matrix-card diff-${m.difficulty} ${m.isCustom ? 'is-customized' : ''}`;

        card.innerHTML = `
            <div class="matrix-card-header">
                <div class="matrix-champs-duo">
                    <div class="matrix-avatar-box my">
                        <img src="${getChampSquareUrl(m.myChamp)}" alt="${m.myChamp}">
                        <span class="matrix-pill-range ${m.myIsMelee ? 'melee' : 'ranged'}">${m.myIsMelee ? '⚔️' : '🏹'}</span>
                    </div>
                    <span class="matrix-vs-badge">VS</span>
                    <div class="matrix-avatar-box enemy">
                        <img src="${getChampSquareUrl(m.enemyChamp)}" alt="${m.enemyChamp}">
                        <span class="matrix-pill-range ${m.enemyIsMelee ? 'melee' : 'ranged'}">${m.enemyIsMelee ? '⚔️' : '🏹'}</span>
                    </div>
                </div>

                <div class="matrix-header-info">
                    <div class="matrix-title-row">
                        <h4 class="matrix-enemy-name">${m.enemyChamp}</h4>
                        ${m.isCustom ? '<span class="matrix-custom-pill" title="Vous avez personnalisé ce matchup avec vos propres notes">⭐ Modifié</span>' : ''}
                    </div>
                    <div class="matrix-badges-row">
                        <span class="matrix-diff-badge ${m.difficulty}">${m.difficultyLabel}</span>
                        <span class="matrix-range-delta ${m.deltaRange >= 0 ? 'pos' : 'neg'}">
                            ${m.deltaRange >= 0 ? '+' : ''}${m.deltaRange} portée
                        </span>
                    </div>
                </div>
            </div>

            <div class="matrix-card-body">
                <!-- Astuce clé (personnalisée ou de base) -->
                <div class="matrix-key-tip ${m.isCustom ? 'custom-tip-box' : ''}">
                    <span class="key-tip-label">${m.isCustom ? '⭐ VOTRE ASTUCE PERSONNELLE :' : '💡 ASTUCE CLÉ :'}</span>
                    <p class="key-tip-text">${m.mainTip}</p>
                </div>

                <!-- Sort critique à surveiller -->
                <div class="matrix-spell-alert">
                    <span class="spell-alert-label">⚠️ Sort critique à esquiver :</span>
                    <span class="spell-alert-text"><strong>${m.criticalSpellToWatch}</strong></span>
                </div>

                <!-- Gestion de vague -->
                <div class="matrix-wave-info">
                    <span class="wave-info-label">🌊 Gestion de vague :</span>
                    <p class="wave-info-text">${m.waveManagement}</p>
                </div>

                <!-- Timing de All-In -->
                <div class="matrix-timing-info">
                    <span class="timing-info-label">🎯 Timing de All-in :</span>
                    <p class="timing-info-text">${m.allInTiming}</p>
                </div>

                <!-- Équipement conseillé -->
                <div class="matrix-items-info">
                    <span class="items-info-label">🛡️ Équipement de counter :</span>
                    <span class="items-info-text">${m.itemsAdvice}</span>
                </div>
            </div>

            <div class="matrix-card-actions">
                <button class="btn btn-sm btn-accent btn-focus-matrix" title="Lancer l'écran de chargement plein écran">
                    🎯 Focus Mode
                </button>
                <button class="btn btn-sm btn-secondary btn-edit-matrix" title="Modifier ou ajouter vos propres astuces">
                    ✏️ Modifier
                </button>
                ${m.isCustom ? `
                    <button class="btn btn-sm btn-icon-only btn-reset-matrix" title="Rétablir les astuces par défaut de Riot">
                        ↺
                    </button>
                ` : ''}
            </div>
        `;

        // Bouton Focus Mode
        card.querySelector('.btn-focus-matrix')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.launchFocusMode === 'function') {
                window.launchFocusMode(m.myChamp, m.enemyChamp, lane);
            }
        });

        // Bouton d'édition directe
        card.querySelector('.btn-edit-matrix')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.openEditMatchupModal === 'function') {
                window.openEditMatchupModal(m.myChamp, m.enemyChamp, lane);
            }
        });

        // Bouton rétablir
        card.querySelector('.btn-reset-matrix')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.resetMatchupToDefault === 'function') {
                window.resetMatchupToDefault(m.myChamp, m.enemyChamp, lane);
            }
        });

        container.appendChild(card);
    });
}

// Rendu du mode Simulateur 1v1 universel
function renderUniversalDuelSimulator() {
    const matrixViewContainer = document.getElementById('matrix-view-container');
    const duelViewContainer = document.getElementById('duel-view-container');

    if (matrixViewContainer) matrixViewContainer.style.display = 'none';
    if (duelViewContainer) duelViewContainer.style.display = 'block';

    const lane = allMatchupsCurrentLane;
    const pool = getEffectiveLanePool(lane);
    const userPool = (window.state && window.state.championPool && window.state.championPool[lane]) || [];

    // Remplir les deux sélecteurs
    const select1 = document.getElementById('sim-universal-my-select');
    const select2 = document.getElementById('sim-universal-enemy-select');

    if (select1 && select2) {
        select1.innerHTML = '';
        select2.innerHTML = '';

        pool.forEach(c => {
            const isUserMyChamp = userPool.includes(c);
            const opt1 = document.createElement('option');
            opt1.value = c;
            opt1.textContent = `${isUserMyChamp ? '⭐ ' : ''}${c}`;
            if (c === allMatchupsMyChamp) opt1.selected = true;
            select1.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = c;
            opt2.textContent = c;
            if (c === allMatchupsEnemyChamp) opt2.selected = true;
            select2.appendChild(opt2);
        });

        select1.onchange = (e) => {
            allMatchupsMyChamp = e.target.value;
            updateUniversalDuelView();
        };

        select2.onchange = (e) => {
            allMatchupsEnemyChamp = e.target.value;
            updateUniversalDuelView();
        };
    }

    updateUniversalDuelView();
}

function updateUniversalDuelView() {
    const outputContainer = document.getElementById('sim-universal-output');
    if (!outputContainer) return;

    const myChamp = allMatchupsMyChamp;
    const enemyChamp = allMatchupsEnemyChamp;
    const lane = allMatchupsCurrentLane;

    const m = window.getMatchupData ? window.getMatchupData(myChamp, enemyChamp, lane) : window.generateMatchupAnalysis(myChamp, enemyChamp, lane);

    outputContainer.innerHTML = `
        <div class="universal-duel-banner diff-${m.difficulty} ${m.isCustom ? 'is-customized' : ''}">
            <div class="duel-banner-duo">
                <div class="duel-champ-box">
                    <img src="${getChampSquareUrl(m.myChamp)}" alt="${m.myChamp}">
                    <span><strong>${m.myChamp}</strong> (${m.myRange} portée)</span>
                </div>
                <div class="duel-vs-circle">VS</div>
                <div class="duel-champ-box">
                    <img src="${getChampSquareUrl(m.enemyChamp)}" alt="${m.enemyChamp}">
                    <span><strong>${m.enemyChamp}</strong> (${m.enemyRange} portée)</span>
                </div>
            </div>

            <div class="duel-banner-badges">
                ${m.isCustom ? '<span class="matrix-custom-pill">⭐ Fiche Personnalisée</span>' : ''}
                <span class="matrix-diff-badge ${m.difficulty}">${m.difficultyLabel}</span>
                <span class="matrix-range-delta ${m.deltaRange >= 0 ? 'pos' : 'neg'}">
                    Différence : ${m.deltaRange >= 0 ? '+' : ''}${m.deltaRange} portée
                </span>
            </div>
        </div>

        <div class="universal-duel-grid">
            <div class="card duel-card-section highlight-gold-border ${m.isCustom ? 'custom-tip-box' : ''}">
                <h4>${m.isCustom ? '⭐ Votre Astuce Clé Personnalisée' : '💡 L\'Astuce Clé Ultime'}</h4>
                <p class="duel-section-text font-accent">${m.mainTip}</p>
            </div>

            <div class="card duel-card-section">
                <h4>⚠️ Sort Critique & Erreurs à Éviter</h4>
                <p class="duel-section-text">Surveillez impérativement son <strong>${m.criticalSpellToWatch}</strong>. Point faible : ${m.enemyWeakness}. Pic de puissance ennemi : ${m.enemySpike}.</p>
            </div>

            <div class="card duel-card-section">
                <h4>🌊 Plan de Laning & Gestion de Vague</h4>
                <p class="duel-section-text">${m.waveManagement}</p>
            </div>

            <div class="card duel-card-section">
                <h4>🎯 Fenêtre de All-in & Punition</h4>
                <p class="duel-section-text">${m.allInTiming}</p>
            </div>

            <div class="card duel-card-section col-full">
                <h4>🛡️ Runes, Équipement & Adaptation</h4>
                <p class="duel-section-text">${m.itemsAdvice}</p>
            </div>
        </div>

        <div class="universal-duel-actions">
            <button id="btn-focus-universal-duel" class="btn btn-accent">
                🎯 Lancer le Mode Focus Loading
            </button>
            <button id="btn-edit-universal-duel" class="btn btn-primary">
                ✏️ Modifier / Personnaliser ce Matchup
            </button>
            ${m.isCustom ? `
                <button id="btn-reset-universal-duel" class="btn btn-secondary">
                    ↺ Rétablir par défaut
                </button>
            ` : ''}
        </div>
    `;

    document.getElementById('btn-focus-universal-duel')?.addEventListener('click', () => {
        if (typeof window.launchFocusMode === 'function') {
            window.launchFocusMode(m.myChamp, m.enemyChamp, lane);
        }
    });

    document.getElementById('btn-edit-universal-duel')?.addEventListener('click', () => {
        if (typeof window.openEditMatchupModal === 'function') {
            window.openEditMatchupModal(m.myChamp, m.enemyChamp, lane);
        }
    });

    document.getElementById('btn-reset-universal-duel')?.addEventListener('click', () => {
        if (typeof window.resetMatchupToDefault === 'function') {
            window.resetMatchupToDefault(m.myChamp, m.enemyChamp, lane);
        }
    });
}

// Fonction unifiée d'accès aux données d'un matchup : combine le moteur Riot et les ajouts personnalisés de l'utilisateur
function getMatchupData(myChampId, enemyChampId, lane) {
    const base = window.generateMatchupAnalysis ? window.generateMatchupAnalysis(myChampId, enemyChampId, lane) : {
        myChamp: myChampId,
        enemyChamp: enemyChampId,
        lane: lane,
        difficulty: 'medium',
        difficultyLabel: 'Moyen',
        mainTip: '',
        criticalSpellToWatch: '',
        enemyWeakness: '',
        enemySpike: '',
        waveManagement: '',
        allInTiming: '',
        itemsAdvice: '',
        myRange: 175,
        enemyRange: 175,
        deltaRange: 0,
        myIsMelee: true,
        enemyIsMelee: true
    };

    const key = `${lane}_${myChampId}_${enemyChampId}`;
    const custom = (window.state && window.state.matchups) ? window.state.matchups[key] : null;

    const diffMap = {
        'easy': 'Facile (Favorable)',
        'medium': 'Moyen (Équilibré)',
        'hard': 'Difficile (Défavorable)',
        'skill': 'Skill Matchup (Compétence pure)'
    };

    if (!custom) {
        return {
            ...base,
            isCustom: false
        };
    }

    const effectiveDiff = custom.difficulty || base.difficulty;

    return {
        ...base,
        difficulty: effectiveDiff,
        difficultyLabel: diffMap[effectiveDiff] || base.difficultyLabel,
        mainTip: custom.tips || custom.customTip || base.mainTip,
        criticalSpellToWatch: custom.criticalSpell || custom.criticalSpellToWatch || base.criticalSpellToWatch,
        waveManagement: custom.early || base.waveManagement,
        allInTiming: custom.mid || base.allInTiming,
        itemsAdvice: (custom.runes || custom.items) ? `${custom.runes ? '[Runes] ' + custom.runes + ' ' : ''}${custom.items ? '[Items] ' + custom.items : ''}`.trim() : base.itemsAdvice,
        rawCustom: custom,
        isCustom: true,
        updatedAt: custom.updatedAt
    };
}

// Export global
window.initAllMatchupsView = initAllMatchupsView;
window.renderAllMatchupsView = renderAllMatchupsView;
window.getMatchupData = getMatchupData;
window.navigateToMatchupView = function(champId, lane) {
    if (lane) allMatchupsCurrentLane = lane;
    if (champId) allMatchupsMyChamp = champId;
    allMatchupsViewMode = 'matrix';
    const navBtn = document.querySelector('.nav-item[data-tab="all-matchups"]');
    if (navBtn) {
        navBtn.click();
    } else {
        renderAllMatchupsView();
    }
};


