/**
 * League Matchups Companion - Guides UI & Strategy Controller
 */

let selectedGuideChampId = null;
let selectedGuideRole = 'TOP';
let selectedGuideEnemyId = null;
let guideFilterRole = 'all';
let guideFilterRange = 'all'; // 'all', 'melee', 'ranged'
let guideFilterOnlyPool = false;
let guideSearchQuery = '';

// Helper pour déterminer si un champion est Mêlée ou Distance
function isMeleeChampion(champId) {
    if (window.CHAMPIONS_STRATEGY_DATA && window.CHAMPIONS_STRATEGY_DATA[champId]) {
        return window.CHAMPIONS_STRATEGY_DATA[champId].rangeType === 'MELEE';
    }
    const champ = championsData[champId];
    if (champ && champ.stats && champ.stats.attackrange) {
        return champ.stats.attackrange <= 275;
    }
    return true; // Défaut
}

// Helper pour récupérer la portée brute
function getChampionAttackRange(champId) {
    if (window.CHAMPIONS_STRATEGY_DATA && window.CHAMPIONS_STRATEGY_DATA[champId]) {
        return window.CHAMPIONS_STRATEGY_DATA[champId].attackRange;
    }
    const champ = championsData[champId];
    if (champ && champ.stats && champ.stats.attackrange) {
        return champ.stats.attackrange;
    }
    return isMeleeChampion(champId) ? 175 : 550;
}

// Initialisation de la vue Guides
function initGuidesView() {
    setupGuideEventListeners();
}

function renderGuidesView() {
    // Si aucun champion n'est sélectionné, choisir le premier champion du pool ou le premier champion général
    if (!selectedGuideChampId) {
        const poolChamps = Object.values(state.championPool).flat();
        if (poolChamps.length > 0) {
            selectedGuideChampId = poolChamps[0];
        } else if (championsList.length > 0) {
            selectedGuideChampId = championsList[0].id;
        } else {
            selectedGuideChampId = "Aatrox";
        }
    }

    renderGuidesChampionGrid();
    renderSelectedChampionGuide();
}

function setupGuideEventListeners() {
    // Recherche de champion dans le guide
    const searchInput = document.getElementById('guide-champ-search');
    searchInput?.addEventListener('input', (e) => {
        guideSearchQuery = e.target.value.toLowerCase().trim();
        renderGuidesChampionGrid();
    });

    // Filtres de rôle dans la grille
    document.querySelectorAll('.guide-role-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.guide-role-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            guideFilterRole = btn.getAttribute('data-role');
            renderGuidesChampionGrid();
        });
    });

    // Filtres Mêlée / Distance
    document.querySelectorAll('.guide-range-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.guide-range-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            guideFilterRange = btn.getAttribute('data-range');
            renderGuidesChampionGrid();
        });
    });

    // Filtre "Mon Pool"
    const poolToggleBtn = document.getElementById('guide-pool-filter-btn');
    poolToggleBtn?.addEventListener('click', () => {
        guideFilterOnlyPool = !guideFilterOnlyPool;
        poolToggleBtn.classList.toggle('active', guideFilterOnlyPool);
        renderGuidesChampionGrid();
    });
}

// Rendu de la liste/grille de sélection de champions
function renderGuidesChampionGrid() {
    const container = document.getElementById('guide-champions-grid');
    if (!container) return;

    container.innerHTML = '';

    const list = championsList.length > 0 ? championsList : Object.values(OFFLINE_FALLBACK_CHAMPIONS);

    const filtered = list.filter(champ => {
        const champId = champ.id;
        const nameMatches = champ.name.toLowerCase().includes(guideSearchQuery) || (champ.title && champ.title.toLowerCase().includes(guideSearchQuery));
        if (!nameMatches) return false;

        // Filtre de portée
        const isMelee = isMeleeChampion(champId);
        if (guideFilterRange === 'melee' && !isMelee) return false;
        if (guideFilterRange === 'ranged' && isMelee) return false;

        // Filtre de rôle
        if (guideFilterRole !== 'all') {
            const data = window.CHAMPIONS_STRATEGY_DATA[champId];
            if (data) {
                if (data.primaryRole !== guideFilterRole && !data.roles.includes(guideFilterRole)) return false;
            } else if (champ.tags) {
                // Déduction basique selon tags
                if (guideFilterRole === 'TOP' && !champ.tags.includes('Fighter') && !champ.tags.includes('Tank')) return false;
                if (guideFilterRole === 'JUNGLE' && !champ.tags.includes('Fighter') && !champ.tags.includes('Assassin') && !champ.tags.includes('Tank')) return false;
                if (guideFilterRole === 'MID' && !champ.tags.includes('Mage') && !champ.tags.includes('Assassin')) return false;
                if (guideFilterRole === 'ADC' && !champ.tags.includes('Marksman')) return false;
                if (guideFilterRole === 'SUPPORT' && !champ.tags.includes('Support') && !champ.tags.includes('Tank') && !champ.tags.includes('Mage')) return false;
            }
        }

        // Filtre "Mon Champion Pool"
        if (guideFilterOnlyPool) {
            const isInPool = Object.values(state.championPool).some(arr => arr.includes(champId));
            if (!isInPool) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-guide-champs text-muted">Aucun champion trouvé avec ces filtres</div>`;
        return;
    }

    filtered.forEach(champ => {
        const isMelee = isMeleeChampion(champ.id);
        const card = document.createElement('div');
        card.className = `guide-champ-item ${champ.id === selectedGuideChampId ? 'active' : ''}`;
        card.title = `${champ.name} (${isMelee ? 'Mêlée' : 'Distance'})`;
        card.innerHTML = `
            <div class="guide-champ-avatar" style="background-image: url('${getChampSquareUrl(champ.id)}')">
                <span class="range-mini-pill ${isMelee ? 'melee' : 'ranged'}">${isMelee ? '⚔️' : '🏹'}</span>
            </div>
            <div class="guide-champ-label">${champ.name}</div>
        `;

        card.addEventListener('click', () => {
            selectedGuideChampId = champ.id;
            // Si le champion a un rôle principal par défaut, le sélectionner
            const data = window.CHAMPIONS_STRATEGY_DATA[champ.id];
            if (data && data.primaryRole) {
                selectedGuideRole = data.primaryRole;
            }
            renderGuidesChampionGrid();
            renderSelectedChampionGuide();
        });

        container.appendChild(card);
    });
}

// Générateur intelligent de guide pour n'importe quel champion et rôle
function getChampionStrategy(champId, role) {
    const curated = window.CHAMPIONS_STRATEGY_DATA && window.CHAMPIONS_STRATEGY_DATA[champId];
    const champ = championsData[champId] || { name: champId, title: "Champion de la faille", tags: ["Fighter"] };
    const isMelee = isMeleeChampion(champId);
    const range = getChampionAttackRange(champId);
    const roleGuide = window.GENERAL_ROLE_GUIDELINES[role] || window.GENERAL_ROLE_GUIDELINES.TOP;

    if (curated) {
        const roleData = curated.gameplay[role] || {
            early: `En tant que ${curated.primaryRole} adapté en ${role}, jouez la prudence aux niveaux 1-3. Utilisez vos contrôles et vos sorts pour contester la priorité sans vous sur-étendre.`,
            mid: `Rejoignez les escarmouches d'objectifs avec votre équipe. Votre archétype (${curated.archetype}) apporte une présence notable en escarmouche.`,
            late: `Positionnez-vous selon votre rôle principal tout en respectant les impératifs de la composition en ${role}.`
        };

        const viability = curated.primaryRole === role ? "👑 Rôle Principal (Meta)" :
                          (curated.roles && curated.roles.includes(role)) ? "⚔️ Rôle Secondaire Viable" : "🧪 Choix Off-Meta / Exotique";

        return {
            name: champ.name || champId,
            title: champ.title || "",
            archetype: curated.archetype,
            rangeType: curated.rangeType,
            attackRange: curated.attackRange,
            damageType: curated.damageType,
            resource: curated.resource,
            viability: viability,
            maxOrder: curated.maxOrder,
            spells: curated.spells[role] || (role === 'JUNGLE' ? ["Châtiment", "Flash"] : ["Flash", "Téléportation"]),
            keyRunes: curated.keyRunes,
            coreItems: curated.coreItems,
            gameplay: roleData,
            vsMeleeTactics: curated.vsMeleeTactics,
            vsRangedTactics: curated.vsRangedTactics
        };
    }

    // Synthèse dynamique pour les champions non pré-rédigés
    const primaryTag = (champ.tags && champ.tags[0]) || 'Fighter';
    let archetypeKey = 'Skirmisher';
    let damageType = 'AD';
    let maxOrder = 'R > A > E > Z';

    if (primaryTag === 'Mage') { archetypeKey = 'Burst Mage'; damageType = 'AP'; maxOrder = 'R > A > Z > E'; }
    else if (primaryTag === 'Assassin') { archetypeKey = 'Assassin'; damageType = 'AD'; maxOrder = 'R > A > E > Z'; }
    else if (primaryTag === 'Tank') { archetypeKey = 'Vanguard Tank'; damageType = 'Mixte'; maxOrder = 'R > A > Z > E'; }
    else if (primaryTag === 'Marksman') { archetypeKey = 'Marksman'; damageType = 'AD'; maxOrder = 'R > A > Z > E'; }
    else if (primaryTag === 'Support') { archetypeKey = isMelee ? 'Catcher' : 'Enchanter'; damageType = 'AP'; maxOrder = 'R > E > A > Z'; }

    const archInfo = window.ARCHETYPES_INFO[archetypeKey] || window.ARCHETYPES_INFO['Skirmisher'];

    let vsMelee = isMelee 
        ? "Combat au corps-à-corps : respectez la montée de niveau 2 (7ème sbire). Prenez des trades courts en utilisant vos sorts avant de vous replier hors de l'aggro des sbires. Ne forcez pas les longs duels face à des champions à Conquérant ou vol de vie."
        : `Vous avez l'avantage de la portée (${range} unités). Harcelez le champion mêlée à chaque fois qu'il s'avance pour donner le dernier coup (last hit) à un sbire. Gardez toujours votre sort défensif ou de mobilité pour contrer son gap-close.`;

    let vsRanged = isMelee
        ? `Vous devez impérativement préserver vos PV aux niveaux 1 et 2. Prenez le Bouclier de Doran et Second Souffle. Utilisez les buissons pour briser la ligne de mire. Dès que l'adversaire rate un sort ou s'avance trop, lancez votre all-in au corps-à-corps.`
        : `Duel de tireurs/mages : duel de portée effective (${range} unités). Surveillez la trajectoire des skillshots et esquivez perpendiculairement. Ne gaspillez pas vos compétences pour pousser la vague si l'ennemi conserve ses cooldowns de punition.`;

    return {
        name: champ.name || champId,
        title: champ.title || "Champion de League of Legends",
        archetype: archInfo.name,
        rangeType: isMelee ? 'MELEE' : 'RANGED',
        attackRange: range,
        damageType: damageType,
        resource: champ.partype || "Mana",
        viability: (role === 'TOP' && isMelee) || (role === 'MID' && !isMelee) || (role === 'ADC' && primaryTag === 'Marksman') || (role === 'SUPPORT' && primaryTag === 'Support') ? "👑 Rôle Recommandé" : "⚔️ Rôle Situationnel",
        maxOrder: maxOrder,
        spells: role === 'JUNGLE' ? ["Châtiment", "Saut éclair"] : ["Saut éclair", "Téléportation"],
        keyRunes: {
            primary: isMelee ? "Précision : Conquérant, Triomphe, Alacrité, Baroud d'honneur" : "Sorcellerie / Domination : Comète arcanique ou Électrocution",
            secondary: "Volonté : Second souffle / Plaque d'os, Inébranlable"
        },
        coreItems: isMelee 
            ? ["Force de la trinité ou Ciel éventré", "Gage de Sterak", "Coques en acier / Sandales de Mercure", "Plaque du mort"]
            : ["Objet Mythique / Compagnon de Luden ou Tueur de Krakens", "Flamme-ombre ou Lame d'infini", "Sablier de Zhonya ou Canon ultrarapide"],
        gameplay: {
            early: `${roleGuide.earlyGame} Exploitez les spécificités de votre kit (${primaryTag}) pour maintenir la pression sans concéder de ganks.`,
            mid: `${roleGuide.midGame} Positionnez-vous pour sécuriser le contrôle des zones de combat et préparez les réapparitions de dragons.`,
            late: `${roleGuide.lateGame} Restez coordonné avec votre équipe et gardez votre sort ultime pour les moments de regroupement décisifs.`
        },
        vsMeleeTactics: vsMelee,
        vsRangedTactics: vsRanged
    };
}

// Rendu complet de la fiche stratégique du champion sélectionné
function renderSelectedChampionGuide() {
    const container = document.getElementById('guide-detail-container');
    if (!container) return;

    const champId = selectedGuideChampId;
    const role = selectedGuideRole;
    const strat = getChampionStrategy(champId, role);
    const champ = championsData[champId] || { name: champId, title: "" };
    const isMelee = strat.rangeType === 'MELEE';

    // Splash Art background URL
    const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champId}_0.jpg`;

    // Vérifier si le champion est dans le pool de l'utilisateur
    const isInPool = (state.championPool[role] || []).includes(champId);

    container.innerHTML = `
        <!-- Champion Hero Banner -->
        <div class="guide-hero-banner" style="background-image: linear-gradient(to right, rgba(11, 17, 26, 0.95) 20%, rgba(11, 17, 26, 0.75) 60%, rgba(11, 17, 26, 0.4) 100%), url('${splashUrl}');">
            <div class="guide-hero-content">
                <div class="guide-hero-portrait-col">
                    <img class="guide-hero-avatar" src="${getChampSquareUrl(champId)}" alt="${champ.name}">
                    <button id="guide-toggle-pool-btn" class="btn btn-sm ${isInPool ? 'btn-secondary' : 'btn-primary'}" style="margin-top: 10px; width: 100%;">
                        ${isInPool ? '✓ Dans mon Pool' : '+ Ajouter au Pool'}
                    </button>
                </div>
                <div class="guide-hero-info">
                    <div class="guide-hero-tags">
                        <span class="range-badge-large ${isMelee ? 'melee' : 'ranged'}">
                            ${isMelee ? '⚔️ CHAMPION MÊLÉE' : '🏹 CHAMPION DISTANCE'} (${strat.attackRange} Portée)
                        </span>
                        <span class="guide-archetype-badge">${strat.archetype}</span>
                        <span class="guide-damage-badge">${strat.damageType}</span>
                        <span class="guide-viability-badge">${strat.viability}</span>
                    </div>
                    <h2 class="guide-hero-title">${champ.name}</h2>
                    <p class="guide-hero-subtitle">${champ.title || strat.title}</p>
                </div>
            </div>
        </div>

        <!-- Role Selector Switcher -->
        <div class="guide-roles-selector-bar">
            <span class="roles-label">Choisir le rôle analysé :</span>
            <div class="guide-role-buttons">
                ${['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map(r => `
                    <button class="guide-role-btn ${r === role ? 'active' : ''}" data-role="${r}">
                        <span class="role-icon-symbol">${r === 'TOP' ? '🛡️' : r === 'JUNGLE' ? '🌲' : r === 'MID' ? '⚡' : r === 'ADC' ? '🏹' : '❤️'}</span>
                        ${r}
                    </button>
                `).join('')}
            </div>
        </div>

        <!-- Strategy Grid Cards -->
        <div class="guide-grid">
            <!-- Card 1: Identité & Game Plan -->
            <div class="card guide-card">
                <div class="guide-card-header">
                    <div class="guide-card-icon">🎯</div>
                    <div>
                        <h3>Plan de Jeu en ${role} (Game Plan)</h3>
                        <p class="card-subtext">Progression tactique et conditions de victoire</p>
                    </div>
                </div>
                <div class="guide-card-body">
                    <div class="phase-block">
                        <div class="phase-title"><span class="phase-badge early">Early Game</span> Début de partie (Niveaux 1 à 6)</div>
                        <p class="phase-text">${strat.gameplay.early}</p>
                    </div>
                    <div class="phase-block">
                        <div class="phase-title"><span class="phase-badge mid">Mid Game</span> Milieu de partie & Objectifs (Niveaux 6 à 13)</div>
                        <p class="phase-text">${strat.gameplay.mid}</p>
                    </div>
                    <div class="phase-block">
                        <div class="phase-title"><span class="phase-badge late">Late Game</span> Fin de partie & Combats d'équipe (5v5)</div>
                        <p class="phase-text">${strat.gameplay.late}</p>
                    </div>
                </div>
            </div>

            <!-- Card 2: Sorts, Ordre de Max & Combos -->
            <div class="card guide-card">
                <div class="guide-card-header">
                    <div class="guide-card-icon">⚡</div>
                    <div>
                        <h3>Sorts, Compétences & Combos</h3>
                        <p class="card-subtext">Optimisation mécanique et enchaînements</p>
                    </div>
                </div>
                <div class="guide-card-body">
                    <div class="setup-row">
                        <div class="setup-item">
                            <span class="setup-label">Sorts d'Invocateur :</span>
                            <span class="setup-value"><strong>${strat.spells.join(' + ')}</strong></span>
                        </div>
                        <div class="setup-item">
                            <span class="setup-label">Ordre de Max conseillé :</span>
                            <span class="setup-value highlight-gold"><strong>${strat.maxOrder}</strong></span>
                        </div>
                        <div class="setup-item">
                            <span class="setup-label">Ressource :</span>
                            <span class="setup-value">${strat.resource}</span>
                        </div>
                    </div>

                    <div class="combos-box">
                        <div class="combo-item">
                            <span class="combo-tag">Trade Court :</span>
                            <span>Entrée en matière rapide pour activer vos runes ou votre passif, puis repli immédiat hors de riposte.</span>
                        </div>
                        <div class="combo-item">
                            <span class="combo-tag">All-In Léthal :</span>
                            <span>Maximisez l'empilement de vos compétences et conservez vos contrôles pour interrompre les fuites ou les flashs adverses.</span>
                        </div>
                        <div class="combo-item">
                            <span class="combo-tag">Conseil Mécanique :</span>
                            <span>Surveillez les animations d'auto-attaques adverses pour placer vos compétences au moment exact où la cible est immobile.</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 3: Runes & Équipement Optimal -->
            <div class="card guide-card col-2">
                <div class="guide-card-header">
                    <div class="guide-card-icon">🛡️</div>
                    <div>
                        <h3>Configuration des Runes & Équipement Recommandé</h3>
                        <p class="card-subtext">Optimisation des statistiques et montée en puissance</p>
                    </div>
                </div>
                <div class="guide-card-body grid-2-sub">
                    <div class="build-sub-block">
                        <h4 class="sub-block-title">🌿 Runes Principales & Secondaires</h4>
                        <div class="rune-spec-box">
                            <p><strong>Arbre Principal :</strong> ${strat.keyRunes.primary}</p>
                            <p><strong>Arbre Secondaire :</strong> ${strat.keyRunes.secondary}</p>
                        </div>
                    </div>
                    <div class="build-sub-block">
                        <h4 class="sub-block-title">⚔️ Objets Clés & Bottes</h4>
                        <div class="items-spec-box">
                            <ul class="items-list">
                                ${strat.coreItems.map(item => `<li><span class="dot-item"></span>${item}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CRITICAL SECTION: Melee vs Ranged Breakdown -->
            <div class="card guide-card col-2 matchup-range-container">
                <div class="guide-card-header">
                    <div class="guide-card-icon">⚖️</div>
                    <div>
                        <h3>Stratégie de Matchup : Contre les Champions MÊLÉE vs DISTANCE</h3>
                        <p class="card-subtext">Principes fondamentaux de gestion de la portée, du spacing et des vagues</p>
                    </div>
                </div>
                
                <div class="range-tactics-grid">
                    <!-- Tactiques VS Melee -->
                    <div class="range-tactic-card melee-focus">
                        <div class="tactic-header">
                            <span class="tactic-icon">⚔️</span>
                            <div>
                                <h4>Face à un Champion MÊLÉE (Corps-à-Corps)</h4>
                                <span class="tactic-subtitle">${isMelee ? 'Duel de contact (Melee vs Melee)' : 'Avantage de portée (Ranged vs Melee)'}</span>
                            </div>
                        </div>
                        <div class="tactic-content">
                            <p class="tactic-advice">${strat.vsMeleeTactics}</p>
                            <div class="tactic-checklist">
                                <div class="check-item"><span class="check-bullet">✓</span> <strong>Gestion de l'aggro :</strong> Ne tradez pas au milieu de la vague ennemie.</div>
                                <div class="check-item"><span class="check-bullet">✓</span> <strong>Bait des contrôles :</strong> Attendez qu'ils gâchent leur sort clé avant de vous engager.</div>
                                <div class="check-item"><span class="check-bullet">✓</span> <strong>Freeze de vague :</strong> Bloquez les sbires devant votre tour pour les forcer à overextend.</div>
                            </div>
                        </div>
                    </div>

                    <!-- Tactiques VS Ranged -->
                    <div class="range-tactic-card ranged-focus">
                        <div class="tactic-header">
                            <span class="tactic-icon">🏹</span>
                            <div>
                                <h4>Face à un Champion DISTANCE (Tireurs / Mages)</h4>
                                <span class="tactic-subtitle">${isMelee ? 'Désavantage de portée (Melee vs Ranged)' : 'Duel de poke & de portée (Ranged vs Ranged)'}</span>
                            </div>
                        </div>
                        <div class="tactic-content">
                            <p class="tactic-advice">${strat.vsRangedTactics}</p>
                            <div class="tactic-checklist">
                                <div class="check-item"><span class="check-bullet">✓</span> <strong>Économie de PV :</strong> Cédez 2-3 sbires au lv 1 pour rester à 100% de vie.</div>
                                <div class="check-item"><span class="check-bullet">✓</span> <strong>Setup de départ :</strong> Bouclier de Doran + Second Souffle indispensables.</div>
                                <div class="check-item"><span class="check-bullet">✓</span> <strong>Timing de punition :</strong> All-in immédiat s'ils ratent leur sort de disengage.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 5: Simulateur Interactif Direct VS un adversaire au choix -->
            <div class="card guide-card col-2 direct-simulator-card">
                <div class="guide-card-header">
                    <div class="guide-card-icon">🥊</div>
                    <div>
                        <h3>Simulateur de Duel Direct (Mon Champion VS Adversaire Spécifique)</h3>
                        <p class="card-subtext">Sélectionnez un adversaire pour obtenir une analyse comparative instantanée</p>
                    </div>
                </div>

                <div class="direct-simulator-body">
                    <div class="sim-picker-row">
                        <div class="sim-champ-display my-champ">
                            <img class="sim-avatar" src="${getChampSquareUrl(champId)}" alt="${champ.name}">
                            <div class="sim-meta">
                                <span class="sim-name">${champ.name}</span>
                                <span class="sim-range ${isMelee ? 'melee' : 'ranged'}">${isMelee ? '⚔️ Mêlée' : '🏹 Distance'} (${strat.attackRange} portée)</span>
                            </div>
                        </div>

                        <div class="sim-vs-divider">VS</div>

                        <div class="sim-enemy-selector-box">
                            <label>Sélectionner l'adversaire :</label>
                            <select id="sim-enemy-select" class="form-control custom-select-small" style="width: 100%; max-width: 320px;">
                                <!-- Rempli dynamiquement -->
                            </select>
                        </div>
                    </div>

                    <!-- Duel Analysis Output Container -->
                    <div id="sim-duel-results-container" class="sim-results-box">
                        <!-- Rempli par updateDuelSimulation() -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Attacher les écouteurs d'événements pour le rôle
    document.querySelectorAll('.guide-role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedGuideRole = btn.getAttribute('data-role');
            renderSelectedChampionGuide();
        });
    });

    // Écouteur pour le bouton d'ajout au pool
    document.getElementById('guide-toggle-pool-btn')?.addEventListener('click', () => {
        if (isInPool) {
            removeChampionFromPool(champId, role);
        } else {
            addChampionToPool(champId, role);
        }
        renderSelectedChampionGuide();
    });

    // Initialiser le sélecteur d'adversaire pour le simulateur de duel
    setupSimulatorEnemySelect();
}

// Initialise et met à jour le simulateur de duel direct
function setupSimulatorEnemySelect() {
    const select = document.getElementById('sim-enemy-select');
    if (!select) return;

    select.innerHTML = '';
    const list = championsList.length > 0 ? championsList : Object.values(OFFLINE_FALLBACK_CHAMPIONS);

    // Si aucun adversaire sélectionné, choisir un adversaire typique
    if (!selectedGuideEnemyId || selectedGuideEnemyId === selectedGuideChampId) {
        const otherChamp = list.find(c => c.id !== selectedGuideChampId);
        selectedGuideEnemyId = otherChamp ? otherChamp.id : "Darius";
    }

    list.forEach(c => {
        if (c.id === selectedGuideChampId) return;
        const opt = document.createElement('option');
        opt.value = c.id;
        const isEnemyMelee = isMeleeChampion(c.id);
        opt.textContent = `${c.name} (${isEnemyMelee ? '⚔️ Mêlée' : '🏹 Distance'})`;
        if (c.id === selectedGuideEnemyId) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
        selectedGuideEnemyId = e.target.value;
        updateDuelSimulation();
    });

    updateDuelSimulation();
}

function updateDuelSimulation() {
    const resultsContainer = document.getElementById('sim-duel-results-container');
    if (!resultsContainer) return;

    const myId = selectedGuideChampId;
    const enemyId = selectedGuideEnemyId;
    if (!myId || !enemyId) return;

    const myRange = getChampionAttackRange(myId);
    const enemyRange = getChampionAttackRange(enemyId);
    const myIsMelee = isMeleeChampion(myId);
    const enemyIsMelee = isMeleeChampion(enemyId);
    const enemyChamp = championsData[enemyId] || { name: enemyId };
    const myChamp = championsData[myId] || { name: myId };
    const delta = myRange - enemyRange;

    let matchupType = "";
    let matchupBadgeClass = "";
    let tacticalAdvice = "";
    let waveManagement = "";
    let keyAbilityWatch = "";

    if (myIsMelee && enemyIsMelee) {
        matchupType = "Duel Mêlée contre Mêlée (Contact Pur)";
        matchupBadgeClass = "melee-vs-melee";
        tacticalAdvice = `Les deux champions doivent s'approcher pour frapper. La gestion des vagues et la course au niveau 2 (7ème sbire) sont capitales. Si ${enemyChamp.name} possède des dégâts continus supérieurs (ex: Conquérant / vitesse d'attaque), effectuez des trades courts (burst rapide puis recul).`;
        waveManagement = "Maintenez la vague légèrement plus proche de votre tour pour préparer une opportunité de gank et l'empêcher de vous poursuivre sur une longue distance.";
        keyAbilityWatch = `Bait et esquivez leur sort d'engagement ou de contrôle principal avant de lancer votre all-in.`;
    } else if (myIsMelee && !enemyIsMelee) {
        matchupType = `Matchup Melee vs Ranged (Désavantage de portée : ${Math.abs(delta)} pts)`;
        matchupBadgeClass = "melee-vs-ranged";
        tacticalAdvice = `${enemyChamp.name} va tenter de vous harceler à chaque sbire. Vous DEVEZ impérativement acheter le Bouclier de Doran et équiper Second Souffle. Concédez 2 ou 3 sbires au niveau 1 pour garder 100% de vos PV. Dès le niveau 3 ou 6, profitez de leur manque de résistance : s'ils ratent leur sort défensif, votre all-in est mortel.`;
        waveManagement = "Laissez la vague se crasher sous votre tour. Les champions à distance sur-étendent naturellement et deviennent des proies faciles pour votre jungler.";
        keyAbilityWatch = `Attendez qu'ils gâchent leur compétence de fuite ou de contrôle avant d'utiliser votre dash ou votre Saut éclair (Flash).`;
    } else if (!myIsMelee && enemyIsMelee) {
        matchupType = `Matchup Ranged vs Melee (Avantage de portée : +${delta} pts)`;
        matchupBadgeClass = "ranged-vs-melee";
        tacticalAdvice = `Vous avez un avantage de portée de ${delta} unités sur ${enemyChamp.name}. Abusez de votre avantage dès le niveau 1 avec du tethering (auto-attaque + recul immédiat). Ne laissez jamais ${enemyChamp.name} toucher la vague de sbires gratuitement. Attention : ne restez jamais immobile et conservez impérativement votre sort de désengagement.`;
        waveManagement = "Gelez (freeze) la vague devant votre tour. Cela prive le corps-à-corps d'or et d'expérience et supprime l'espace nécessaire pour qu'il vous pourchasse.";
        keyAbilityWatch = `Surveillez leur sort de gap-close (dash/saut). Ne l'approchez jamais à portée de leur Flash + CC.`;
    } else {
        matchupType = `Duel Distance contre Distance (Bataille de Skillshots & Portée)`;
        matchupBadgeClass = "ranged-vs-ranged";
        const rangeAdvantage = delta > 0 ? `Vous avez l'avantage de portée (+${delta} pts).` : (delta < 0 ? `${enemyChamp.name} a une portée supérieure de ${Math.abs(delta)} pts.` : "Portée d'attaque identique.");
        tacticalAdvice = `${rangeAdvantage} Le duel repose sur l'esquive des skillshots (déplacements perpendiculaires), le timing des auto-attaques au last hit et la gestion de votre mana. Tradez quand les sorts de l'ennemi sont en temps de recharge.`;
        waveManagement = "Contestez le push pour éviter de vous retrouver enfermé sous tour à esquiver des tirs de barrage continus.";
        keyAbilityWatch = `Repérez le temps de récupération de leur compétence maîtresse de poke ou de burst pour initier votre contre-attaque.`;
    }

    resultsContainer.innerHTML = `
        <div class="duel-header-banner ${matchupBadgeClass}">
            <div class="duel-type-title">
                <strong>${matchupType}</strong>
            </div>
            <div class="duel-range-meter">
                <span>Votre portée : <strong>${myRange}</strong></span>
                <span class="range-diff-pill ${delta >= 0 ? 'positive' : 'negative'}">Différence : ${delta >= 0 ? '+' : ''}${delta}</span>
                <span>Portée ennemie : <strong>${enemyRange}</strong></span>
            </div>
        </div>

        <div class="duel-details-grid">
            <div class="duel-detail-item">
                <span class="detail-label">💡 Plan de Jeu Direct :</span>
                <p class="detail-text">${tacticalAdvice}</p>
            </div>
            <div class="duel-detail-item">
                <span class="detail-label">🌊 Gestion de Vague Recommandée :</span>
                <p class="detail-text">${waveManagement}</p>
            </div>
            <div class="duel-detail-item">
                <span class="detail-label">⚠️ Sort & Fenêtre de Vigilance :</span>
                <p class="detail-text">${keyAbilityWatch}</p>
            </div>
        </div>

        <div class="duel-action-row">
            <button id="sim-create-matchup-note-btn" class="btn btn-primary btn-sm">
                📝 Créer une fiche de matchup contre ${enemyChamp.name} dans l'Éditeur
            </button>
        </div>
    `;

    document.getElementById('sim-create-matchup-note-btn')?.addEventListener('click', () => {
        // Rediriger vers l'onglet éditeur avec les valeurs préremplies
        document.getElementById('editor-role-select').value = selectedGuideRole;
        setCustomSelectValue('editor-my-champ-select', myId);
        setCustomSelectValue('editor-enemy-champ-select', enemyId);
        
        // Préremplir les champs si vides
        const earlyField = document.getElementById('matchup-early');
        if (earlyField && !earlyField.value) {
            earlyField.value = `${matchupType}. ${tacticalAdvice}`;
        }
        const tipsField = document.getElementById('matchup-tips');
        if (tipsField && !tipsField.value) {
            tipsField.value = `${waveManagement} ${keyAbilityWatch}`;
        }

        // Basculer vers l'éditeur
        document.querySelector('.nav-item[data-tab="editor"]').click();
    });
}

// Initialisation globale
window.initGuidesView = initGuidesView;
window.renderGuidesView = renderGuidesView;
window.isMeleeChampion = isMeleeChampion;
window.getChampionAttackRange = getChampionAttackRange;
