/**
 * League Matchups Companion - Base de Données & Moteur Universel des Matchups par Lane
 */

// Liste exhaustive des champions viables par lane dans League of Legends
const LANE_CHAMPIONS_POOL = {
    TOP: [
        "Aatrox", "Akali", "Camille", "Cho'Gath", "Darius", "Dr. Mundo", "Fiora", "Gangplank", 
        "Garen", "Gnar", "Gragas", "Gwen", "Illaoi", "Irelia", "Jax", "Jayce", "K'Sante", 
        "Kayle", "Kennen", "Kled", "Malphite", "Mordekaiser", "Nasus", "Olaf", "Ornn", 
        "Pantheon", "Poppy", "Quinn", "Renekton", "Riven", "Rumble", "Sett", "Shen", 
        "Singed", "Sion", "Tahm Kench", "Teemo", "Trundle", "Tryndamere", "Urgot", 
        "Vayne", "Volibear", "Warwick", "Wukong", "Yasuo", "Yone", "Yorick"
    ],
    JUNGLE: [
        "Amumu", "Bel'Veth", "Briar", "Diana", "Ekko", "Elise", "Evelynn", "Fiddlesticks", 
        "Graves", "Hecarim", "Ivern", "Jarvan IV", "Karthus", "Kayn", "Kha'Zix", "Kindred", 
        "Lee Sin", "Lillia", "Master Yi", "Nidalee", "Nocturne", "Nunu", "Rammus", "Rek'Sai", 
        "Rengar", "Sejuani", "Shaco", "Shyvana", "Skarner", "Trundle", "Udyr", "Vi", 
        "Viego", "Volibear", "Warwick", "Wukong", "Xin Zhao", "Zac"
    ],
    MID: [
        "Ahri", "Akali", "Akshan", "Anivia", "Annie", "Aurelion Sol", "Aurora", "Azir", 
        "Cassiopeia", "Corki", "Diana", "Ekko", "Fizz", "Galio", "Hwei", "Jayce", 
        "Kassadin", "Katarina", "LeBlanc", "Lissandra", "Lux", "Malzahar", "Mel", "Naafiri", 
        "Neeko", "Orianna", "Qiyana", "Ryze", "Swain", "Sylas", "Syndra", "Taliyah", 
        "Talon", "Twisted Fate", "Veigar", "Vex", "Viktor", "Vladimir", "Xerath", 
        "Yasuo", "Yone", "Zed", "Zoe"
    ],
    ADC: [
        "Aphelios", "Ashe", "Caitlyn", "Draven", "Ezreal", "Jhin", "Jinx", "Kai'Sa", 
        "Kalista", "Kog'Maw", "Lucian", "Miss Fortune", "Nilah", "Samira", "Sivir", 
        "Smolder", "Tristana", "Twitch", "Varus", "Vayne", "Xayah", "Yasuo", "Zeri", "Ziggs"
    ],
    SUPPORT: [
        "Alistar", "Bard", "Blitzcrank", "Brand", "Braum", "Janna", "Karma", "Leona", 
        "Lulu", "Lux", "Maokai", "Milio", "Morgana", "Nami", "Nautilus", "Pantheon", 
        "Pyke", "Rakan", "Rell", "Renata Glasc", "Senna", "Seraphine", "Sona", "Soraka", 
        "Swain", "Tahm Kench", "Taric", "Thresh", "Vel'Koz", "Xerath", "Yuumi", "Zilean", "Zyra"
    ]
};

// Base d'identités tactiques, sorts critiques à surveiller et points faibles par champion
const CHAMPION_TACTICAL_IDENTITIES = {
    "Aatrox": {
        criticalSpell: "A (Épée des Darkin - 3 impacts) & Z (Chaînes infernales)",
        weakness: "Très sensible aux esquives latérales de ses zones de A et aux blessures graves (anti-heal).",
        powerSpikes: "Niveaux 3 et 4 pour le poke, puis niveau 6 avec son R (Massacre).",
        counterItem: "Appel du bourreau / Armure de ronces, Bottes de célérité pour sortir du Z.",
        class: "Juggernaut"
    },
    "Ahri": {
        criticalSpell: "E (Charme) : 12-14s de recharge",
        weakness: "Fragile et sans échappatoire avant le niveau 6 si son E est en cooldown.",
        powerSpikes: "Niveau 6 (3 dashs du R) et 1er item AP complété.",
        counterItem: "Sandales de Mercure, Voile de la banshee.",
        class: "Mage"
    },
    "Akali": {
        criticalSpell: "Z (Linceul nébuleux) & E (Lancer acrobatique)",
        weakness: "Très gourmande en énergie au niveau 1, sensible aux dégâts de zone et aux révélations de vision.",
        powerSpikes: "Niveau 6 (R1 + R2) : burst léthal absolu.",
        counterItem: "Balise de contrôle / Brouilleur pour suivre sa silhouette dans la fumée, Sablier de Zhonya.",
        class: "Assassin"
    },
    "Camille": {
        criticalSpell: "A2 (Dégâts bruts colossaux) & E (Grappin/Saut)",
        weakness: "Waveclear faible sans Tiamat / Hydre. Vulnérable si elle rate son saut de mur.",
        powerSpikes: "Force de la Trinité complétée et niveau 6 (Ultimatum impossible à fuir).",
        counterItem: "Coques en acier (Tabis), Gage de Sterak.",
        class: "Diver"
    },
    "Darius": {
        criticalSpell: "E (Crampon) & Bord extérieur du A (Soin + saignement)",
        weakness: "Aucun dash natif : extrêmement sensible au kiting et aux ralentissements.",
        powerSpikes: "Niveau 1 avec le W ou Q, et à 5 marques de saignement.",
        counterItem: "Armure de ronces, Bottes de célérité, Bouclier de Doran + Second Souffle.",
        class: "Juggernaut"
    },
    "Fiora": {
        criticalSpell: "Z (Riposte - parade de 0.75s qui étourdit si elle bloque un CC)",
        weakness: "Dégâts purement monocible, dépendante de l'accès aux points vitaux.",
        powerSpikes: "Niveau 6 (Grande fente) et Hydre vorace.",
        counterItem: "Collez-vous contre un mur pour cacher le 4ème point vital de son R. Armure de ronces.",
        class: "Skirmisher"
    },
    "Garen": {
        criticalSpell: "A (Silence de 1.5s) & E (Tourbillon brise-armure)",
        weakness: "Totalement linéaire dans ses approches, kitable par les ralentissements.",
        powerSpikes: "Niveau 6 avec son R (Justice de Demacia - dégâts bruts d'exécution).",
        counterItem: "Bottes de célérité, objets à PV max.",
        class: "Juggernaut"
    },
    "Irelia": {
        criticalSpell: "Passif (4 stacks pour vitesse et dégâts magiques) & E (Duo parfait - stun)",
        weakness: "Vulnérable quand il n'y a pas de sbires low HP pour réinitialiser son A.",
        powerSpikes: "Niveau 2 avec 4 stacks et Lame du roi déchu (Ruined King).",
        counterItem: "Armure de ronces, Coques en acier. Ne tradez JAMAIS quand elle a 4 stacks dorés.",
        class: "Diver"
    },
    "Jax": {
        criticalSpell: "E (Contre-attaque - esquive 100% des attaques pendant 2s puis stun)",
        weakness: "Portée d'engagement limitée à son A (Saut). Cooldown de 14-16s sur son E en début de partie.",
        powerSpikes: "Niveau 6 (passif du R chaque 3ème coup) et Force de la Trinité.",
        counterItem: "Coques en acier, bait son E puis désengagez avant de contre-attaquer.",
        class: "Skirmisher"
    },
    "Jinx": {
        criticalSpell: "E (Pyromâcheurs - pièges au sol) & A (Lance-roquettes longue portée)",
        weakness: "Zéro dash de fuite : proie facile pour les assassins et plongeurs s'ils l'engagent.",
        powerSpikes: "3 items critiques et chaque déclenchement du passif (Enthousiasme !).",
        counterItem: "Flanquez-la par derrière. Présagio de Randuin contre les coups critiques.",
        class: "Marksman"
    },
    "Caitlyn": {
        criticalSpell: "Portée de base extrême (650) & Z (Pièges yordles)",
        weakness: "Faible DPS continu au corps-à-corps si son filet (E) est gaspillé.",
        powerSpikes: "Niveaux 1-3 sous la tour adverse et à 100% de critique.",
        counterItem: "Coques en acier, engage surprise depuis les buissons.",
        class: "Marksman"
    },
    "Draven": {
        criticalSpell: "A (Haches tournantes) & Z (Rush d'adrénaline)",
        weakness: "Doit se déplacer là où la hache retombe : positionnement ultra prévisible.",
        powerSpikes: "Early game écrasant aux niveaux 1 à 3.",
        counterItem: "Visez les zones de réception de ses haches avec vos skillshots. Coques en acier.",
        class: "Marksman"
    },
    "Lee Sin": {
        criticalSpell: "A1/A2 (Onde sonore) & R (Rage du dragon / Kick Insec)",
        weakness: "S'essouffle en fin de partie si les ennemis se regroupent autour de leur frontline.",
        powerSpikes: "Niveaux 3 et 6 : roi des escarmouches en début de partie.",
        counterItem: "Esquivez son A derrière un sbire ou monstre de jungle.",
        class: "Diver"
    },
    "Thresh": {
        criticalSpell: "A (Peine capitale - Grappin) & E (Fauche)",
        weakness: "Pas d'armure par niveau naturelle (dépend des âmes collectées).",
        powerSpikes: "Niveau 2 (combo E + A) et décalages surprises au niveau 6.",
        counterItem: "Placez-vous derrière la vague de sbires. Restez vigilants aux ganks par lanterne.",
        class: "Catcher"
    },
    "Blitzcrank": {
        criticalSpell: "A (Grappin propulsé - 20s de recharge au niveau 1)",
        weakness: "Une fois son grappin manqué, il devient un champion inutile pendant 18 à 20 secondes.",
        powerSpikes: "Niveau 2 et invades au niveau 1.",
        counterItem: "Dès qu'il rate son A, foncez-lui dessus immédiatement pendant 15 secondes entières.",
        class: "Catcher"
    },
    "Leona": {
        criticalSpell: "E (Lame du zénith) & A (Bouclier du jour - stun)",
        weakness: "Champion 'All-in sans retour' : quand elle engage, elle ne peut plus faire demi-tour.",
        powerSpikes: "Niveaux 2, 3 et 6 (R solaire de zone).",
        counterItem: "Champions de désengagement (Janna, Morgana, Thresh, Braum) pour bloquer son E.",
        class: "Vanguard"
    },
    "Malphite": {
        criticalSpell: "R (Force indomptable - choc imparable de zone)",
        weakness: "Très faible contre le push et le poke magique avant le niveau 6. Gourmand en mana.",
        powerSpikes: "Niveau 6 (bête de teamfight) et empilement d'armure contre les AD.",
        counterItem: "Flash prêt pour réagir à son R. Dégâts magiques ou pénétration d'armure.",
        class: "Vanguard"
    },
    "Mordekaiser": {
        criticalSpell: "R (Royaume des morts - duel 1v1 isolé) & E (Emprise infernale)",
        weakness: "Extrêmement lent, esquivez son A en bougeant de côté pour éviter le bonus monocible.",
        powerSpikes: "Niveau 6 et passif activé (tempête d'aura).",
        counterItem: "Ceinturon de mercure (QSS) pour annuler son R, Bottes de célérité.",
        class: "Juggernaut"
    },
    "Nasus": {
        criticalSpell: "A (Buveuse d'âmes - stacks infinis) & Z (Flétrissure - 95% de slow)",
        weakness: "Le pire early game du jeu aux niveaux 1 à 5. Zéro présence sans stacks.",
        powerSpikes: "150-200 stacks et Cœur gelé / Trinité.",
        counterItem: "Gelez (freeze) la vague au niveau 1-3 et privez-le d'accès aux creeps. Bottes de célérité.",
        class: "Juggernaut"
    },
    "Riven": {
        criticalSpell: "Combo A (Ailes brisées - 3 dashs) & Z (Décharge de ki)",
        weakness: "Très courte portée, dépendante de l'annulation d'animations (animation cancel).",
        powerSpikes: "Niveaux 3 et 6 avec le vent tranchant de son R.",
        counterItem: "Coques en acier, champions avec du silence (Garen) ou de l'anti-dash (Poppy).",
        class: "Skirmisher"
    },
    "Sett": {
        criticalSpell: "Z (Coup cathartique - énorme bouclier et dégâts bruts au centre)",
        weakness: "Zéro dash pour fuir, vulnérable au kiting après avoir utilisé son E.",
        powerSpikes: "Niveau 1 (très violent avec son passif de poings) et au max d'Agressivité.",
        counterItem: "Esquivez de côté pour ne jamais être dans la ligne centrale dorée de son Z.",
        class: "Juggernaut"
    },
    "Teemo": {
        criticalSpell: "A (Fléchette aveuglante - annule les auto-attaques) & R (Champignons)",
        weakness: "Statistiques de base ultra fragiles. Meurt sur le moindre contrôle suivi d'un all-in.",
        powerSpikes: "Niveaux 1-2 au poke et niveau 6 pour le piégeage de la jungle.",
        counterItem: "Bouclier de Doran + Second Souffle, Brouilleur oraculaire au niveau 6 pour les champignons.",
        class: "Mage / Marksman"
    },
    "Yasuo": {
        criticalSpell: "Z (Mur de vent - bloque 100% des projectiles) & Tornade de A",
        weakness: "Très vulnérable sans vague de sbires pour glisser avec son E.",
        powerSpikes: "Niveau 2 et 100% de chances de coup critique.",
        counterItem: "Faites tomber son bouclier passif avec une simple auto-attaque avant d'engager.",
        class: "Skirmisher"
    },
    "Yone": {
        criticalSpell: "E (Libération spirituelle - corps astral) & A3 (Dash tornade)",
        weakness: "Retourne obligatoirement à l'emplacement initial de son corps à la fin du E.",
        powerSpikes: "Niveaux 3 et 6 (R - Destin scellé).",
        counterItem: "Posez vos sorts de zone sur le corps immobile de son E pour le punir à son retour.",
        class: "Skirmisher"
    },
    "Zed": {
        criticalSpell: "Z (Ombre vivante) & Combo A (Shurikens doubles) & R (Marque de la mort)",
        weakness: "20 secondes de cooldown sur son ombre (Z) au niveau 1. Dépendant de son énergie.",
        powerSpikes: "Niveaux 3, 4 et 6 : assassinat sur cible sous 60% PV.",
        counterItem: "Sablier de Zhonya ou Chronomètre, Épuisement, armure de départ.",
        class: "Assassin"
    }
};

// Matrice spécifique des hard-counters et dynamiques de lane
const NOTABLE_COUNTER_MATRIX = {
    // Toplane
    "Malphite_Jax": { diff: "easy", tip: "Votre E réduit la vitesse d'attaque de Jax de 50%. Il ne peut absolument rien faire contre votre armure." },
    "Jax_Malphite": { diff: "hard", tip: "Matchup très difficile. Ne cherchez pas le 1v1 prolongé. Farmez et demandez l'aide de votre jungler." },
    "Fiora_Aatrox": { diff: "easy", tip: "Votre Riposte (Z) pare son 3ème A ou ses chaînes. Vous pouvez contrer l'intégralité de son burst." },
    "Aatrox_Fiora": { diff: "hard", tip: "Ne lancez JAMAIS votre 3ème A directement sur elle sans feinte : elle va le parer et vous stun." },
    "Darius_Garen": { diff: "easy", tip: "Vous le surclassez en duel prolongé. S'il tente de tourner avec son E, empilez vos 5 marques et tuez-le." },
    "Garen_Darius": { diff: "hard", tip: "Ne tradez JAMAIS au corps-à-corps prolongé. Utilisez votre A pour silence puis fuyez avec le boost de vitesse." },
    "Teemo_Darius": { diff: "easy", tip: "Kitez Darius sans relâche. Votre fléchette aveuglante (A) empêche son Z et ses auto-attaques d'empiler du saignement." },
    "Darius_Teemo": { diff: "hard", tip: "Prenez Fantôme (Ghost) + Saut éclair, Bouclier de Doran + Second Souffle. Attendez le niveau 3 pour all-in." },
    "Irelia_Yorick": { diff: "easy", tip: "Votre A one-shot les goules de Yorick et vous rend instantanément vos 4 stacks de passif gratuitement." },
    "Poppy_Riven": { diff: "easy", tip: "Votre Z (Présence immuable) bloque net tous les dashs de Riven et l'étourdit au contact." },
    "Poppy_Yasuo": { diff: "easy", tip: "Votre Z bloque les glissades de son E. Il devient totalement immobile." },

    // Midlane
    "Vex_LeBlanc": { diff: "easy", tip: "Chaque dash de LeBlanc déclenche votre passif d'Effroi. Vous interrompez ses combos et la détruisez en burst." },
    "LeBlanc_Vex": { diff: "hard", tip: "Votre mobilité se retourne contre vous. Évitez les dashs offensifs et farmez à distance avec votre A et E." },
    "Zed_Syndra": { diff: "skill", tip: "Bataille de réflexes : Zed cherche le R, mais Syndra peut le repousser avec E s'il réapparaît derrière elle." },
    "Kassadin_LeBlanc": { diff: "easy", tip: "Votre passif réduit les dégâts magiques de 10% et votre A confère un bouclier magique à chaque trade." },
    "Yasuo_Lux": { diff: "easy", tip: "Votre Mur de vent bloque sa cage (A), son poke (E) et ses attaques. Vous pouvez glisser sur elle à volonté." },
    "Lux_Yasuo": { diff: "hard", tip: "Ne lancez jamais votre cage s'il a son mur de vent prêt. Gardez votre distance absolue." },

    // Botlane ADC
    "Caitlyn_Vayne": { diff: "easy", tip: "Vous avez 650 de portée contre 550. Harcelez Vayne à chaque sbire et coincez-la sous sa tour avec vos pièges." },
    "Vayne_Caitlyn": { diff: "hard", tip: "Subissez l'early game avec Bouclier de Doran. Ne mourez pas. Au niveau 6 avec l'ultime, vous la surclassez en 1v1." },
    "Draven_Jinx": { diff: "easy", tip: "Votre burst en début de partie détruit Jinx. Engagez les combats dès le niveau 2 avec votre support." },
    "Sivir_Caitlyn": { diff: "easy", tip: "Votre bouclier magique (E) absorbe les pièges et les tirs de Caitlyn pour vous redonner du mana gratuit." },

    // Support
    "Morgana_Blitzcrank": { diff: "easy", tip: "Votre Bouclier noir (E) annule complètement le grappin de Blitzcrank. C'est le hard counter absolu." },
    "Blitzcrank_Morgana": { diff: "hard", tip: "Ne tentez pas de grab si son bouclier est disponible. Tentez de courir vers elle avec votre Z pour bait son shield." },
    "Janna_Leona": { diff: "easy", tip: "Votre tornade (A) interrompt la trajectoire du E de Leona dans les airs à chaque tentative." },
    "Braum_Nautilus": { diff: "easy", tip: "Votre bouclier (E) et vos étourdissements au contact neutralisent l'agression de Nautilus sur votre carry." }
};

// Moteur universel de génération et d'analyse de matchup par lane
function generateMatchupAnalysis(myChampId, enemyChampId, lane) {
    const myData = CHAMPION_TACTICAL_IDENTITIES[myChampId] || {
        criticalSpell: "Compétence maîtresse",
        weakness: "Dépendance au positionnement et aux temps de recharge.",
        powerSpikes: "Niveaux 3 et 6.",
        counterItem: "Équipement situationnel",
        class: "Combattant"
    };

    const enemyData = CHAMPION_TACTICAL_IDENTITIES[enemyChampId] || {
        criticalSpell: "Sort principal de contrôle ou de burst",
        weakness: "Fenêtre de vulnérabilité lorsque ses sorts majeurs sont en cooldown.",
        powerSpikes: "Niveau 6.",
        counterItem: "Bottes adaptées et équipement défensif",
        class: "Polyvalent"
    };

    const myRange = window.getChampionAttackRange ? window.getChampionAttackRange(myChampId) : 175;
    const enemyRange = window.getChampionAttackRange ? window.getChampionAttackRange(enemyChampId) : 175;
    const myIsMelee = myRange <= 275;
    const enemyIsMelee = enemyRange <= 275;
    const deltaRange = myRange - enemyRange;

    // Vérifier les contres connus répertoriés
    const pairKey = `${myChampId}_${enemyChampId}`;
    let difficulty = "medium";
    let difficultyLabel = "Moyen";
    let specificTip = null;

    if (NOTABLE_COUNTER_MATRIX[pairKey]) {
        difficulty = NOTABLE_COUNTER_MATRIX[pairKey].diff;
        specificTip = NOTABLE_COUNTER_MATRIX[pairKey].tip;
    } else {
        // Déduction logique selon la classe et la portée
        if (myIsMelee && !enemyIsMelee) {
            difficulty = deltaRange < -300 ? "hard" : "medium";
        } else if (!myIsMelee && enemyIsMelee) {
            difficulty = deltaRange > 300 ? "easy" : "medium";
        } else {
            difficulty = "skill";
        }
    }

    const diffMap = {
        'easy': 'Facile (Favorable)',
        'medium': 'Moyen (Équilibré)',
        'hard': 'Difficile (Défavorable)',
        'skill': 'Skill Matchup (Compétence pure)'
    };
    difficultyLabel = diffMap[difficulty] || "Moyen";

    // Synthèse de l'astuce clé
    let mainTip = specificTip;
    if (!mainTip) {
        if (myIsMelee && !enemyIsMelee) {
            mainTip = `Prenez Bouclier de Doran + Second Souffle. Ne perdez pas vos PV pour des sbires aux niveaux 1-2. Dès que ${enemyChampId} rate son sort clé (${enemyData.criticalSpell}), foncez en all-in au corps-à-corps.`;
        } else if (!myIsMelee && enemyIsMelee) {
            mainTip = `Abusez de votre avantage de portée (+${deltaRange} pts) pour harceler ${enemyChampId} dès qu'il tente de last-hit. Ne gaspillez jamais votre sort de disengage ou de contrôle pour poke.`;
        } else if (myIsMelee && enemyIsMelee) {
            mainTip = `Duel de contact pur : la course au niveau 2 (7ème sbire en solo lane) est cruciale. Bait son sort principal (${enemyData.criticalSpell}) avant d'engager votre combo complet.`;
        } else {
            mainTip = `Bataille de portée et de skillshots : esquivez perpendiculairement à la trajectoire de ses tirs et tradez agressivement quand ${enemyChampId} a ses sorts en temps de recharge.`;
        }
    }

    // Gestion de vague recommandée (Wave Management)
    let waveManagement = "";
    if (difficulty === "hard" || (myIsMelee && !enemyIsMelee)) {
        waveManagement = "Laissez la vague venir se crasher sous votre tour. Ne poussez pas la ligne sans l'aide de votre jungler. Gelez la vague (freeze) juste devant votre rayon de tour pour vous protéger.";
    } else if (difficulty === "easy" || (!myIsMelee && enemyIsMelee)) {
        waveManagement = "Slow push les deux premières vagues pour accumuler un gros pack de sbires, puis crashez la 3ème vague sous sa tour pour le priver de vision et forcer un recall ou un dive.";
    } else {
        waveManagement = "Maintenez la vague au centre ou légèrement de votre côté de la rivière pour vous prémunir des ganks tout en conservant une priorité d'intervention sur les objectifs neutres.";
    }

    // Timing de all-in
    const allInTiming = `Attendez que ${enemyChampId} utilise son ${enemyData.criticalSpell}. Profitez de sa fenêtre de récupération (10-18 secondes) pour lancer votre all-in décisif.`;

    // Équipement conseillé
    const itemsAdvice = enemyData.counterItem || "Coques en acier (Tabis) contre les dégâts physiques continus, Sandales de Mercure contre les contrôles.";

    return {
        myChamp: myChampId,
        enemyChamp: enemyChampId,
        lane: lane,
        difficulty: difficulty,
        difficultyLabel: difficultyLabel,
        mainTip: mainTip,
        criticalSpellToWatch: enemyData.criticalSpell,
        enemyWeakness: enemyData.weakness,
        enemySpike: enemyData.powerSpikes,
        waveManagement: waveManagement,
        allInTiming: allInTiming,
        itemsAdvice: itemsAdvice,
        myRange: myRange,
        enemyRange: enemyRange,
        deltaRange: deltaRange,
        myIsMelee: myIsMelee,
        enemyIsMelee: enemyIsMelee
    };
}

// Export global
window.LANE_CHAMPIONS_POOL = LANE_CHAMPIONS_POOL;
window.CHAMPION_TACTICAL_IDENTITIES = CHAMPION_TACTICAL_IDENTITIES;
window.NOTABLE_COUNTER_MATRIX = NOTABLE_COUNTER_MATRIX;
window.generateMatchupAnalysis = generateMatchupAnalysis;
