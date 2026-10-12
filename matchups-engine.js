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

// Initialisation de la vue
function initAllMatchupsView() {
    setupAllMatchupsEventListeners();
}

function renderAllMatchupsView() {
    // S'assurer que le champion sélectionné est viable pour la lane active
    const pool = window.LANE_CHAMPIONS_POOL[allMatchupsCurrentLane] || window.LANE_CHAMPIONS_POOL.TOP;
    if (!pool.includes(allMatchupsMyChamp)) {
        allMatchupsMyChamp = pool[0];
    }
    if (!pool.includes(allMatchupsEnemyChamp) || allMatchupsEnemyChamp === allMatchupsMyChamp) {
        allMatchupsEnemyChamp = pool.find(c => c !== allMatchupsMyChamp) || pool[1];
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
    const pool = window.LANE_CHAMPIONS_POOL[allMatchupsCurrentLane] || window.LANE_CHAMPIONS_POOL.TOP;

    pool.forEach(champId => {
        const opt = document.createElement('option');
        opt.value = champId;
        const isMelee = window.isMeleeChampion ? window.isMeleeChampion(champId) : true;
        opt.textContent = `${champId} (${isMelee ? '⚔️ Mêlée' : '🏹 Distance'})`;
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
        const data = window.generateMatchupAnalysis(myChamp, enemyChamp, lane);
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
        card.className = `matchup-matrix-card diff-${m.difficulty}`;

        const isSaved = !!state.matchups[`${lane}_${myChamp}_${m.enemyChamp}`];

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
                    <h4 class="matrix-enemy-name">${m.enemyChamp}</h4>
                    <div class="matrix-badges-row">
                        <span class="matrix-diff-badge ${m.difficulty}">${m.difficultyLabel}</span>
                        <span class="matrix-range-delta ${m.deltaRange >= 0 ? 'pos' : 'neg'}">
                            ${m.deltaRange >= 0 ? '+' : ''}${m.deltaRange} portée
                        </span>
                    </div>
                </div>
            </div>

            <div class="matrix-card-body">
                <!-- Astuce clé en or -->
                <div class="matrix-key-tip">
                    <span class="key-tip-label">💡 ASTUCE CLÉ :</span>
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
                <button class="btn btn-sm ${isSaved ? 'btn-secondary' : 'btn-primary'} btn-import-matrix" data-enemy="${m.enemyChamp}">
                    ${isSaved ? '✓ Enregistré' : '💾 Sauvegarder dans Mes Matchups'}
                </button>
                <button class="btn btn-sm btn-secondary btn-edit-matrix" data-enemy="${m.enemyChamp}" title="Ouvrir dans l'éditeur">
                    📝 Éditer
                </button>
            </div>
        `;

        // Bouton d'importation dans mes matchups
        card.querySelector('.btn-import-matrix')?.addEventListener('click', (e) => {
            e.stopPropagation();
            importMatrixMatchup(m);
            card.querySelector('.btn-import-matrix').className = 'btn btn-sm btn-secondary btn-import-matrix';
            card.querySelector('.btn-import-matrix').textContent = '✓ Enregistré';
        });

        // Bouton d'édition
        card.querySelector('.btn-edit-matrix')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openInEditorWithData(m);
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
    const pool = window.LANE_CHAMPIONS_POOL[lane] || window.LANE_CHAMPIONS_POOL.TOP;

    // Remplir les deux sélecteurs
    const select1 = document.getElementById('sim-universal-my-select');
    const select2 = document.getElementById('sim-universal-enemy-select');

    if (select1 && select2) {
        select1.innerHTML = '';
        select2.innerHTML = '';

        pool.forEach(c => {
            const opt1 = document.createElement('option');
            opt1.value = c;
            opt1.textContent = c;
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

    const m = window.generateMatchupAnalysis(myChamp, enemyChamp, lane);

    outputContainer.innerHTML = `
        <div class="universal-duel-banner diff-${m.difficulty}">
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
                <span class="matrix-diff-badge ${m.difficulty}">${m.difficultyLabel}</span>
                <span class="matrix-range-delta ${m.deltaRange >= 0 ? 'pos' : 'neg'}">
                    Différence : ${m.deltaRange >= 0 ? '+' : ''}${m.deltaRange} portée
                </span>
            </div>
        </div>

        <div class="universal-duel-grid">
            <div class="card duel-card-section highlight-gold-border">
                <h4>💡 L'Astuce Clé Ultime</h4>
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
            <button id="btn-save-universal-duel" class="btn btn-primary">
                💾 Sauvegarder dans mon carnet personnel de Matchups
            </button>
            <button id="btn-edit-universal-duel" class="btn btn-secondary">
                📝 Personnaliser dans l'Éditeur
            </button>
        </div>
    `;

    document.getElementById('btn-save-universal-duel')?.addEventListener('click', () => {
        importMatrixMatchup(m);
    });

    document.getElementById('btn-edit-universal-duel')?.addEventListener('click', () => {
        openInEditorWithData(m);
    });
}

// Fonction d'importation automatique d'une note générée dans state.matchups
function importMatrixMatchup(m) {
    const key = `${m.lane}_${m.myChamp}_${m.enemyChamp}`;
    state.matchups[key] = {
        id: key,
        role: m.lane,
        myChamp: m.myChamp,
        enemyChamp: m.enemyChamp,
        difficulty: m.difficulty,
        style: `${m.lane} - ${m.difficultyLabel}`,
        runes: "",
        items: m.itemsAdvice || "",
        early: `${m.mainTip} | Gestion de vague : ${m.waveManagement}`,
        mid: `Spike adverse : ${m.enemySpike}. All-in timing : ${m.allInTiming}`,
        tips: `Sort critique à esquiver : ${m.criticalSpellToWatch}. Faiblesse : ${m.enemyWeakness}`,
        updatedAt: new Date().toISOString()
    };

    saveData();
    renderDashboard();
    renderMatchupsList();

    if (typeof showNotification === 'function') {
        showNotification(`Matchup [${m.lane}] ${m.myChamp} VS ${m.enemyChamp} sauvegardé dans vos notes !`, "success");
    }
}

// Préremplit le formulaire de l'éditeur et bascule d'onglet
function openInEditorWithData(m) {
    document.getElementById('editor-role-select').value = m.lane;
    setCustomSelectValue('editor-my-champ-select', m.myChamp);
    setCustomSelectValue('editor-enemy-champ-select', m.enemyChamp);
    
    // Remplir difficulté
    const radio = document.querySelector(`input[name="difficulty"][value="${m.difficulty}"]`);
    if (radio) radio.checked = true;

    document.getElementById('matchup-style').value = `${m.lane} - ${m.difficultyLabel}`;
    document.getElementById('matchup-items').value = m.itemsAdvice || '';
    document.getElementById('matchup-early').value = `${m.mainTip}\n\nWave Management : ${m.waveManagement}`;
    document.getElementById('matchup-mid').value = `All-in : ${m.allInTiming}\nPic de puissance ennemi : ${m.enemySpike}`;
    document.getElementById('matchup-tips').value = `Sort critique à surveiller : ${m.criticalSpellToWatch}\nPoint faible : ${m.enemyWeakness}`;

    document.querySelector('.nav-item[data-tab="editor"]').click();
}

// Export global
window.initAllMatchupsView = initAllMatchupsView;
window.renderAllMatchupsView = renderAllMatchupsView;
window.importMatrixMatchup = importMatrixMatchup;
