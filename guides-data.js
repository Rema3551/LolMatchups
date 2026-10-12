/**
 * League Matchups Companion - Guides Data & Strategy Engine
 * Base de connaissances stratégique des champions, rôles et matchups Mêlée vs Distance
 */

// Archétypes et leurs principes fondamentaux
const ARCHETYPES_INFO = {
    'Juggernaut': {
        name: 'Colosse (Juggernaut)',
        desc: 'Haute résistance et dégâts élevés en mêlée continue, mais faible mobilité.',
        winCondition: 'Forcer les combats au corps-à-corps dans les goulets d\'étranglement et absorber les dégâts.',
        vsMelee: 'Prendre l\'avantage sur les trades prolongés grâce à vos dégâts soutenus. Punissez quand l\'adversaire s\'approche des sbires.',
        vsRanged: 'Extrêmement sensible au kiting. Ne poursuivez jamais sans vos sorts de ralentissement ou le Saut éclair (Flash). Attendez qu\'ils overextend.'
    },
    'Diver': {
        name: 'Plongeur / Initiateur (Diver)',
        desc: 'Excellente capacité à réduire la distance (gap-closer) et à isoler les cibles prioritaires.',
        winCondition: 'Flanker et verrouiller les carries adverses fragiles (ADC / Mages).',
        vsMelee: 'Utilisez vos compétences pour contrôler le rythme du duel. Trade court puis all-in dès qu\'ils sont sous 60% PV.',
        vsRanged: 'Votre matchup favorable après le niveau 3 ou 6 : attendez qu\'ils utilisent leur sort de disengage puis all-in avec votre dash.'
    },
    'Skirmisher': {
        name: 'Duelliste / Escarmoucheur (Skirmisher)',
        desc: 'Dégâts soutenus extrêmes et outils défensifs réactifs (parade, bouclier, invulnérabilité temporaire).',
        winCondition: 'Gagner le 1v1, imposer une pression constante en splitpush et faire des ravages en escarmouche (2v2, 3v3).',
        vsMelee: 'Matchup de pure compétence (Skill matchup). Synchronisez votre sort défensif avec leur compétence clé.',
        vsRanged: 'Préservez vos points de vie au niveau 1-2. Dès le niveau 3, utilisez votre mobilité pour les coller et les forcer à fuir.'
    },
    'Assassin': {
        name: 'Assassin',
        desc: 'Mobilité exceptionnelle et burst rapide pour éliminer instantanément une cible isolée.',
        winCondition: 'Éliminer les cibles fragiles, créer le surnombre et snowball par des décalages (roams).',
        vsMelee: 'Évitez les trades continus d\'auto-attaques. Entrez, appliquez votre combo rapide (Électrocution) et désengagez.',
        vsRanged: 'Subissez le poke aux niveaux 1-2 en restant prudent. Au niveau 3 et surtout au niveau 6, votre combo peut les one-shot s\'ils n\'ont plus de flash.'
    },
    'Burst Mage': {
        name: 'Mage à Burst',
        desc: 'Dégâts magiques massifs à moyenne/longue portée avec des contrôles de foule clés.',
        winCondition: 'Toucher un contrôle (stun, snare) et déchaîner l\'intégralité du combo pour tuer instantanément.',
        vsMelee: 'Gardez toujours votre contrôle en réserve pour contrer leur tentative d\'engagement. Ne l\'utilisez jamais pour farm.',
        vsRanged: 'Bataille de skillshots : tenez compte de la portée de vos sorts, esquivez de côté et tradez quand leurs sorts sont en cooldown.'
    },
    'Battlemage': {
        name: 'Mage de Combat (Battlemage)',
        desc: 'Dégâts magiques continus à courte/moyenne portée et sustain ou boucliers de zone.',
        winCondition: 'Dominer les combats d\'équipe prolongés et sécuriser le contrôle de la zone autour des objectifs.',
        vsMelee: 'Vous excellez contre les mêlées qui doivent courir vers vous : appliquez vos sorts continus et ralentissements pour les détruire à mi-distance.',
        vsRanged: 'Attention aux mages à longue portée (artillerie). Évitez le poke gratuit et forcez le combat autour des objectifs neutres.'
    },
    'Artillery Mage': {
        name: 'Mage d\'Artillerie',
        desc: 'Portée de sorts maximale pour affaiblir l\'ennemi à très longue distance avant tout combat.',
        winCondition: 'Affaiblir les ennemis à longue distance (poke) et contester les sièges de tour en sécurité.',
        vsMelee: 'Maintenez une distance maximale. Utilisez vos sorts de ralentissement pour interdire l\'accès à votre zone.',
        vsRanged: 'Vous surpassez presque tous les champions en portée brute. Prenez l\'avantage en touchant vos compétences hors de leur vision.'
    },
    'Marksman': {
        name: 'Tireur / ADC (Marksman)',
        desc: 'Dégâts physiques continus à distance scalant fortement avec les objets de coup critique ou vitesse d\'attaque.',
        winCondition: 'Survivre, se positionner derrière les tanks et infliger un DPS continu sans interruption.',
        vsMelee: 'Kite constant : auto-attaque puis déplacement vers l\'arrière. Ne jamais rester immobile (Orbwalking). Respectez leurs portées de flash.',
        vsRanged: 'Bataille de portée d\'auto-attaque : punissez chaque last hit adverse si vous avez l\'avantage de portée. Attention aux supports à engage.'
    },
    'Vanguard Tank': {
        name: 'Tank d\'Initiation (Vanguard)',
        desc: 'Contrôles de zone massifs et robustesse pour lancer les combats d\'équipe.',
        winCondition: 'Trouver l\'angle d\'engagement parfait sur plusieurs cibles et verrouiller les ennemis prioritaires.',
        vsMelee: 'Prenez des trades courts avec votre poigne ou vos contrôles. Laissez les vagues venir vers vous pour préparer un gank.',
        vsRanged: 'Subissez patiemment en début de partie avec vos objets d\'armure/PV. Au niveau 6 ou avec votre jungler, l\'engagement est fatal pour le ranged.'
    },
    'Warden Tank': {
        name: 'Tank Protecteur (Warden)',
        desc: 'Défenseur d\'élite conçu pour protéger ses alliés fragiles et bloquer les assauts ennemis.',
        winCondition: 'Coller à vos carries, bloquer les assassins ennemis et contrer les initiations adverses.',
        vsMelee: 'Vous neutralisez naturellement les mêlées agressifs. Utilisez vos compétences pour interrompre leurs combos.',
        vsRanged: 'Absorbez les tirs avec vos outils défensifs et ne poursuivez pas inutilement. Votre rôle est de punir s\'ils s\'approchent trop.'
    },
    'Enchanter': {
        name: 'Enchanteur (Support)',
        desc: 'Soins, boucliers et améliorations de statistiques pour surcharger la puissance des carries.',
        winCondition: 'Garder l\'ADC en vie à tout prix et multiplier sa force d\'impact en teamfight.',
        vsMelee: 'Harcelez avec vos attaques à distance au niveau 1. Restez hors de portée de leur engage et gardez votre désengagement réactif.',
        vsRanged: 'Équilibrez l\'usage de votre mana entre le poke et la protection. Utilisez vos boucliers pour annuler les trades adverses.'
    },
    'Catcher': {
        name: 'Attrapeur / Catcher (Support)',
        desc: 'Spécialiste de la punition avec un sort d\'attrapage ou d\'immobilisation à longue portée.',
        winCondition: 'Trouver un pick-off décisif dans le brouillard de guerre pour créer un 5v4 instantané.',
        vsMelee: 'Si l\'adversaire est mêlée, votre pression de zone l\'empêche de toucher la vague sereinement.',
        vsRanged: 'Contrôlez les buissons (bush priority). Un grappin réussi sur un champion à distance fragile garantit un kill ou un flash.'
    }
};

// Données d'analyse stratégique par champion (couvre l'ensemble de la meta)
const CHAMPIONS_STRATEGY_DATA = {
    "Aatrox": {
        primaryRole: "TOP",
        roles: ["TOP", "MID", "JUNGLE"],
        rangeType: "MELEE",
        attackRange: 175,
        damageType: "AD",
        archetype: "Juggernaut",
        resource: "Sans coût",
        maxOrder: "R > Q > E > W",
        spells: { TOP: ["Flash", "Téléportation"], MID: ["Flash", "Embrasement"], JUNGLE: ["Châtiment", "Flash"] },
        keyRunes: { primary: "Précision : Conquérant, Triomphe, Alacrité, Baroud d'honneur", secondary: "Volonté : Second souffle, Inébranlable" },
        coreItems: ["Ciel éventré (Sundered Sky)", "Éclipse", "Gage de Sterak", "Coquille de rancune", "Sandales de Mercure / Coques en acier"],
        gameplay: {
            TOP: {
                early: "Utilisez la portée supérieure de votre A (Q1 et Q2) pour zoner l'adversaire sans prendre l'aggro. Au niveau 3, cherchez le combo E avant + Q1 + Z pour forcer un all-in.",
                mid: "Vous êtes une bête d'escarmouche au Dragon et au Héraut. Activez votre R (Massacre) dès le début du combat pour réinitialiser sa durée sur les éliminations.",
                late: "Positionnez-vous en première ligne agressive. Utilisez votre E pour réaligner le centre de votre Q3 sur les carries adverses groupés."
            },
            MID: {
                early: "Face aux mages, respectez leur poke lv 1-2. Dès le lv 3, votre all-in avec E + Q peut tuer n'importe quel champion fragile.",
                mid: "Poussez rapidement les vagues avec vos sorts de zone et décalez vers la botlane ou avec votre jungler.",
                late: "Servez de flanc d'engagement pour surprendre les carries ennemis hors position."
            },
            JUNGLE: {
                early: "Clear complet en optimisant le passif et le A en zone sur les petits monstres. Gankez via les lignes avec le ralentissement du Z.",
                mid: "Excellente présence sur les Larves du Néant et le Dragon grâce au sustain de votre passif.",
                late: "Engagez les escarmouches avec votre Smite et votre R pour tempo les combats d'objectifs."
            }
        },
        vsMeleeTactics: "Vous avez plus de portée que 90% des mêlées (175 + zone du Q). Gardez le spacing avec Q1 et Q2 sans vous faire coller. Si un mêlée agressif comme Jax ou Irelia saute sur vous, utilisez immédiatement le E vers l'arrière tout en lançant Q2 pour punir son saut.",
        vsRangedTactics: "Prenez Bouclier de Doran + Second Souffle. Ne perdez pas de points de vie au niveau 1 pour de simples sbires. Au niveau 3, attendez qu'ils utilisent leur auto-attaque sur un sbire (ils sont immobiles 0.2s), lancez votre E vers l'avant avec Q1, puis enchaînez Z et Q2 pour un kill garanti."
    },
    "Ahri": {
        primaryRole: "MID",
        roles: ["MID", "SUPPORT"],
        rangeType: "RANGED",
        attackRange: 550,
        damageType: "AP",
        archetype: "Burst Mage",
        resource: "Mana",
        maxOrder: "R > Q > W > E",
        spells: { MID: ["Flash", "Téléportation / Embrasement"], SUPPORT: ["Flash", "Embrasement"] },
        keyRunes: { primary: "Domination : Électrocution, Goût du sang, Balise fantôme, Chasseur acharné", secondary: "Sorcellerie : Ruban de mana, Transcendance" },
        coreItems: ["Compagnon de Luden", "Flamme-ombre", "Sablier de Zhonya", "Coiffe de Rabadon", "Chaussures de sorcier"],
        gameplay: {
            MID: {
                early: "Utilisez le retour du A (dégâts bruts) pour toucher à la fois la vague et l'adversaire. Gardez impérativement votre E (Charme) pour punir un gank ou une agression.",
                mid: "Dès le niveau 6, votre R (Assaut spirituel) vous offre 3 dashs : poussez la vague et décalez sur les side lanes pour trouver des kills faciles.",
                late: "Pêchez des pick-offs avec E + Flash sur la backline ennemie, puis repliez-vous avec vos charges de R."
            },
            SUPPORT: {
                early: "Harcelez à l'auto-attaque et au Z. Surveillez le positionnement de l'ADC adverse pour placer un E entre deux sbires.",
                mid: "Assurez la vision dans la jungle ennemie en toute sécurité grâce à l'échappatoire de votre ultime.",
                late: "Peel pour votre ADC ou trouvez des ouvertures d'assassinat sur les cibles fragiles."
            }
        },
        vsMeleeTactics: "Abusez de votre portée de 550 au niveau 1 pour leur infliger 3-4 auto-attaques gratuites. Ne lancez JAMAIS votre E préventivement : attendez qu'ils utilisent leur dash vers vous (ex: dash de Yasuo, ombre de Zed) pour leur envoyer le Charme à bout portant et les punir sous votre tour.",
        vsRangedTactics: "Dans un duel de mages, bougez constamment de manière imprévisible pour esquiver leurs skillshots. Utilisez le bonus de vitesse de déplacement de votre Z pour vous repositionner et surprendre avec un angle de A inattendu. Au niveau 6, dash avec R pour esquiver leur sort clé et placer votre combo."
    },
    "Akali": {
        primaryRole: "MID",
        roles: ["MID", "TOP"],
        rangeType: "MELEE",
        attackRange: 125,
        damageType: "AP",
        archetype: "Assassin",
        resource: "Énergie",
        maxOrder: "R > Q > E > W",
        spells: { MID: ["Flash", "Embrasement / Téléportation"], TOP: ["Téléportation", "Embrasement"] },
        keyRunes: { primary: "Précision : Conquérant / Flotte-pied, Présence d'esprit, Ténacité, Coup de grâce", secondary: "Volonté : Second souffle, Surcroissance" },
        coreItems: ["Ceinture-roquette Hextech", "Flamme-ombre", "Sablier de Zhonya", "Bâton du vide", "Chaussures de sorcier"],
        gameplay: {
            MID: {
                early: "Gérez votre énergie avec soin (le A coûte cher au lv 1). Utilisez la pointe du A pour ralentir et activer le cercle de votre passif.",
                mid: "Votre linceul (Z) vous rend intouchable dans les escarmouches d'objectifs. Chassez l'ADC adverse avec le combo R1 > E1 > E2 > R2.",
                late: "Attendez que le combat soit engagé avant de plonger. Exécutez les cibles low HP avec le R2 (dégâts en fonction des PV manquants)."
            },
            TOP: {
                early: "Contre les bruisers, kite autour de votre linceul et abusez des auto-attaques renforcées du passif.",
                mid: "Splitpush efficace, difficile à attraper en 1v1.",
                late: "Flankez les combats par l'arrière de la ligne de front."
            }
        },
        vsMeleeTactics: "Utilisez la pointe de votre A pour les ralentir à distance sans qu'ils puissent riposter. Entrez dans votre Z (Linceul) dès qu'ils tentent de riposter, frappez avec l'auto passive renforcée, puis retournez dans la fumée pour casser leur ciblage.",
        vsRangedTactics: "Prenez Bouclier de Doran et Second Souffle. Ne prenez aucun dégât inutile aux niveaux 1 et 2. Au niveau 3, utilisez le Z pour vous approcher sans être ciblé, touchez votre E (Lancer acrobatique) et sautez dessus pour infliger votre burst."
    },
    "Camille": {
        primaryRole: "TOP",
        roles: ["TOP", "MID", "SUPPORT"],
        rangeType: "MELEE",
        attackRange: 125,
        damageType: "AD",
        archetype: "Diver",
        resource: "Mana",
        maxOrder: "R > Q > E > W",
        spells: { TOP: ["Téléportation", "Embrasement / Flash"], MID: ["Téléportation", "Flash"], SUPPORT: ["Flash", "Embrasement"] },
        keyRunes: { primary: "Volonté : Poigne de l'immortel, Coup de bouclier, Second souffle, Revitalisation", secondary: "Inspiration : Chaussures magiques, Savoir cosmique" },
        coreItems: ["Force de la trinité", "Hydre vorace", "Gage de Sterak", "Danse de la mort", "Coques en acier"],
        gameplay: {
            TOP: {
                early: "Tradez uniquement lorsque votre bouclier passif est disponible. Chargez votre A1 sur un sbire, puis touchez le champion ennemi avec le A2 (dégâts bruts colossaux).",
                mid: "Vous êtes une monstre de splitpush. Si l'ennemi envoie une seule personne pour vous défendre, tuez-la ou détruisez la tour avec la Trinité.",
                late: "En teamfight, verrouillez l'hypercarry adverse avec votre R (Ultimatum Hextech). Il ne peut absolument pas s'échapper."
            },
            MID: {
                early: "Utilisez votre E contre les murs pour punir les mages sans mobilité.",
                mid: "Roams ultra violents dans la rivière avec le grappin.",
                late: "Assassinat ciblé sur les cibles prioritaires isolées."
            },
            SUPPORT: {
                early: "Engage surprise depuis les buissons avec le E et le bouclier passif pour absorber la riposte.",
                mid: "Pick-off garanti dès le niveau 6 avec l'Ultimatum Hextech.",
                late: "Peel offensif et verrouillage de cible."
            }
        },
        vsMeleeTactics: "Votre bouclier passif s'adapte au type de dégâts (AD ou AP). Ne tradez jamais sans lui. Utilisez le balayage extérieur de votre Z (W) pour ralentir et vous soigner quand l'ennemi veut s'avancer.",
        vsRangedTactics: "Le Z vous offre du sustain et un ralentissement à distance. Attendez qu'ils s'approchent d'un mur pour lancer E (Grappin) + saut rapide + A2 dégâts bruts. À partir du niveau 6, votre R les piège sans aucune issue possible."
    },
    "Darius": {
        primaryRole: "TOP",
        roles: ["TOP", "JUNGLE"],
        rangeType: "MELEE",
        attackRange: 175,
        damageType: "AD",
        archetype: "Juggernaut",
        resource: "Mana",
        maxOrder: "R > Q > E > W",
        spells: { TOP: ["Fantôme (Ghost)", "Flash"], JUNGLE: ["Châtiment", "Fantôme"] },
        keyRunes: { primary: "Précision : Conquérant, Triomphe, Alacrité, Baroud d'honneur", secondary: "Sorcellerie : Manteau nuageux, Célérité" },
        coreItems: ["Plaque du mort", "Gage de Sterak", "Force de la trinité / Estropieur", "Force de la nature", "Coques en acier"],
        gameplay: {
            TOP: {
                early: "L'un des plus puissants niveaux 1 du jeu avec le Z ou le A. Cherchez à stacker vos 5 marques d'Hémorragie pour déclencher la Force de Noxus (+ AD massive).",
                mid: "Activez Fantôme lors des escarmouches pour coller les ennemis. Gardez votre E (Crampon) pour interrompre les fuites ou les canalisations.",
                late: "Exécutez une première cible low HP avec votre R pour obtenir instantanément 5 marques et réinitialiser le R, puis déchaînez des ultimes en chaîne sur l'équipe ennemie."
            },
            JUNGLE: {
                early: "Clear rapide grâce au passif de saignement sur les monstres. Ganks puissants dès que vous avez Fantôme activé.",
                mid: "Sécurisation des dragons et larves avec la menace de votre R.",
                late: "Tanky brawler en première ligne."
            }
        },
        vsMeleeTactics: "Votre zone de prédilection : aucun mêlée ne gagne un combat prolongé contre vos 5 marques. Utilisez le Z pour réinitialiser votre auto-attaque, puis placez le fer extérieur de votre A pour vous soigner et infliger le saignement.",
        vsRangedTactics: "Le cauchemar classique de Darius : vous n'avez pas de dash natif. Prenez Bouclier de Doran + Second Souffle. Prenez Fantôme + Flash obligatoirement. Laissez la vague venir sous votre tour. Dès que l'ennemi s'avance trop, lancez Fantôme, esquivez ses CC et attrapez-le avec le E."
    },
    "Jinx": {
        primaryRole: "ADC",
        roles: ["ADC", "MID"],
        rangeType: "RANGED",
        attackRange: 525,
        damageType: "AD",
        archetype: "Marksman",
        resource: "Mana",
        maxOrder: "R > Q > W > E",
        spells: { ADC: ["Flash", "Purge / Fantôme"], MID: ["Flash", "Barrière"] },
        keyRunes: { primary: "Précision : Tempo mortel / Flotte-pied, Présence d'esprit, Sangsue, Coup de grâce", secondary: "Sorcellerie : Tempête menaçante, Célérité" },
        coreItems: ["Tueur de krakens", "Ouragan de Runaan", "Lame d'infini", "Salutations de Dominik", "Jambières du berzerker"],
        gameplay: {
            ADC: {
                early: "Alternez entre le Minigun (DPS monocible rapide et mana gratuit pour farm) et le Lance-roquettes Fishbones (+ portée jusqu'à 725 et splash damage). Placez vos pyromâcheurs (E) derrière l'adversaire quand votre support engage.",
                mid: "Farmez pour atteindre votre pic de puissance à 3 objets. Utilisez votre R (Super roquette de la mort) en snipe transversal pour aider les autres lanes.",
                late: "Une seule élimination ou assistance déclenche votre passif (Enthousiasme !), vous octroyant une vitesse surhumaine pour balayer l'équipe ennemie entière."
            },
            MID: {
                early: "Poussez les vagues avec le lance-roquettes pour empêcher l'ennemi de décaler.",
                mid: "Siège de tour longue portée.",
                late: "DPS astronomique en arrière-garde."
            }
        },
        vsMeleeTactics: "Activez le Lance-roquettes (A) pour atteindre plus de 650 de portée : vous pouvez attaquer les mêlées de tellement loin qu'ils ne peuvent même pas vous toucher. Si un assassin plonge sur vous, posez immédiatement vos Pyromâcheurs (E) directement sous vos propres pieds.",
        vsRangedTactics: "Contre les tireurs à plus courte portée (Lucian, Kai'Sa, Vayne), zoner-les avec votre A dès qu'ils tentent de frapper un sbire. Respectez les mages d'artillerie et esquivez leurs skillshots."
    },
    "Lee Sin": {
        primaryRole: "JUNGLE",
        roles: ["JUNGLE", "TOP"],
        rangeType: "MELEE",
        attackRange: 125,
        damageType: "AD",
        archetype: "Diver",
        resource: "Énergie",
        maxOrder: "R > Q > W > E",
        spells: { JUNGLE: ["Châtiment", "Flash"], TOP: ["Téléportation", "Flash"] },
        keyRunes: { primary: "Précision : Conquérant, Triomphe, Alacrité, Baroud d'honneur", secondary: "Inspiration : Chaussures magiques, Savoir cosmique" },
        coreItems: ["Éclipse", "Ciel éventré", "Gage de Sterak", "Danse de la mort", "Coques en acier"],
        gameplay: {
            JUNGLE: {
                early: "Vous êtes le roi de l'early game. Clear 3 camps rapide puis gank agressif ou invade sur le jungler adverse. Enchaînez 2 compétences entre chaque sort pour rentabiliser le passif.",
                mid: "Créez du surnombre sur les objectifs. Maîtrisez le kick 'Insec' (A1 > A2 > Ward derrière la cible > Z sur la ward > R vers votre équipe).",
                late: "Votre rôle passe de duelliste à protecteur (peel) pour votre ADC ou initiateur de pick-off clutch avec un R bien placé."
            },
            TOP: {
                early: "Trades agressifs avec A et Z pour le vampirisme.",
                mid: "Duelliste sur les lignes latérales.",
                late: "Kick défensif sur les bruisers ennemis."
            }
        },
        vsMeleeTactics: "Utilisez le E pour révéler les invisibles et réduire leur vitesse d'attaque/déplacement. Tradez avec vos auto-attaques sous passif et utilisez votre Z pour absorber leur burst et vous repositionner sur un sbire allié.",
        vsRangedTactics: "Touchez votre A1 (Onde sonore) à travers les ouvertures de la vague. Ne foncez pas immédiatement avec A2 : attendez qu'ils utilisent leur sort d'esquive ou de recul, puis sautez avec A2 pour les coller."
    },
    "Thresh": {
        primaryRole: "SUPPORT",
        roles: ["SUPPORT"],
        rangeType: "RANGED",
        attackRange: 450,
        damageType: "AP",
        archetype: "Catcher",
        resource: "Mana",
        maxOrder: "R > Q > W > E",
        spells: { SUPPORT: ["Flash", "Embrasement / Épuisement"] },
        keyRunes: { primary: "Inspiration : Optimisation glaciale, Chaussures magiques, Livraison de biscuits, Savoir cosmique", secondary: "Volonté : Plaque d'os, Inébranlable" },
        coreItems: ["Traîneau du solstice", "Médaillon de l'Iron Solari", "Vœu du chevalier", "Convergence de Zeke", "Bottes de mobilité"],
        gameplay: {
            SUPPORT: {
                early: "Collectez les âmes pour booster votre armure et puissance. Utilisez le passif chargé du E pour infliger de lourdes auto-attaques au niveau 1. Au niveau 2, cherchez l'engagement avec Flay (E vers l'arrière) suivi du Grappin (A) garanti.",
                mid: "Votre lanterne (Z) est l'un des meilleurs sorts du jeu : jetez-la pour sauver un allié pris au piège ou pour ramener votre jungler en gank surprise.",
                late: "En teamfight, protégez votre carry en interrompant les dashs ennemis avec votre E (ex: saut de Kha'Zix, dash de Tristana, R de Leona)."
            }
        },
        vsMeleeTactics: "Profitez de votre statut de semi-distance (450 portée) pour zoner les supports de mêlée au niveau 1. Lorsqu'ils tentent d'engager au corps-à-corps, utilisez votre E vers l'arrière pour stopper net leur trajectoire dans les airs.",
        vsRangedTactics: "Contre les enchanteurs et mages à longue distance (Lux, Xerath), ne subissez pas le poke passif : contrôlez les buissons avec des balises de contrôle et mettez la pression avec l'animation imprévisible de votre A."
    },
    "Yasuo": {
        primaryRole: "MID",
        roles: ["MID", "TOP", "ADC"],
        rangeType: "MELEE",
        attackRange: 175,
        damageType: "AD",
        archetype: "Skirmisher",
        resource: "Sans coût (Flux)",
        maxOrder: "R > Q > E > W",
        spells: { MID: ["Flash", "Embrasement"], TOP: ["Flash", "Téléportation"], ADC: ["Flash", "Purge"] },
        keyRunes: { primary: "Précision : Conquérant / Tempo mortel, Triomphe, Alacrité, Baroud d'honneur", secondary: "Volonté : Second souffle / Plaque d'os, Inébranlable" },
        coreItems: ["Lame d'infini", "Danseur fantôme / Poignard de Statikk", "Soif-de-sang", "Gage de Sterak", "Jambières du berzerker"],
        gameplay: {
            MID: {
                early: "Glissez de sbire en sbire avec le E tout en chargeant votre A (Tempête d'acier). Utilisez le Mur de vent (Z) pour annuler les sorts majeurs adverses (stun de Twisted Fate, flèche d'Ashe, combo d'Ahri).",
                mid: "Vos coups critiques doublés par le passif vous donnent un DPS démentiel à 2 objets. Combinez votre R avec les bumps de vos alliés (Malphite, Diana, Alistar).",
                late: "Jouez avec patience en teamfight : ne balancez pas votre R sur le premier bump si cela vous place au milieu de 5 ennemis sans soutien."
            },
            TOP: {
                early: "Attention aux bruisers avec beaucoup d'armure de base. Prenez des trades courts en glissant avec le E.",
                mid: "Pression constante sur les lignes latérales.",
                late: "Splitpush ou flanc d'équipe."
            },
            ADC: {
                early: "Combinez avec un support à projection (Nautilus, Alistar, Rakan) pour un combo instantané au niveau 6.",
                mid: "Votre Mur de vent neutralise complètement le DPS de l'ADC ennemi en 2v2.",
                late: "Dégâts critiques équivalents à un hypercarry traditionnel."
            }
        },
        vsMeleeTactics: "Vous avez l'avantage de mobilité à travers la vague de sbires. Stackez votre tornade de A à distance, puis kitez les colosses immobiles. Ne restez pas collé contre des duellistes avec plus de stats brutes (comme Darius ou Sett) quand la vague de sbires est terminée.",
        vsRangedTactics: "Votre Mur de vent (Z) est l'arme absolue contre les tireurs et mages : il bloque 100% de leurs projectiles. Utilisez les sbires ennemis comme échelle avec votre E pour fermer la distance en une fraction de seconde, frappez avec le combo E+A circulaire, et coupez leur fuite."
    }
};

// Stratégies générales universelles pour tous les champions par rôle et classe
const GENERAL_ROLE_GUIDELINES = {
    TOP: {
        roleName: "Toplane",
        identity: "Ligne solitaire d'endurance, de duels et de gestion chirurgicale des vagues de sbires.",
        summoners: "Téléportation + Saut éclair (ou Embrasement pour dominer la phase de ligne).",
        earlyGame: "Les 3 premières vagues déterminent la lane : obtenez le niveau 2 au 7ème sbire pour prendre l'ascendant. Si vous subissez, laissez la vague crasher sous votre tour.",
        midGame: "Splitpush sur les lignes opposées aux objectifs majeurs (Top si Dragon actif, Bot si Baron actif) avec votre Téléportation prête à intervenir.",
        lateGame: "Créez une pression 1-3-1 ou rejoignez votre équipe en flank pour initier le combat d'équipe final."
    },
    JUNGLE: {
        roleName: "Jungle",
        identity: "Moteur stratégique de la partie : contrôle de la carte, vision et rythme des objectifs neutres.",
        summoners: "Châtiment (Smite) + Saut éclair (ou Fantôme selon la mobilité).",
        earlyGame: "Identifiez votre condition de victoire (lane alliée la plus forte à snowball) et adaptez votre pathing pour finir votre premier clear vers elle.",
        midGame: "Priorité absolue sur le contrôle des Larves du Néant (Voidgrubs), du Héraut de la faille et des Dragons élémentaires. Ne gankez jamais sans objectif derrière.",
        lateGame: "Sécurisez les buissons autour du Baron Nashor et de l'Âme de Dragon. Ne vous faites jamais attraper sans smite avant un objectif."
    },
    MID: {
        roleName: "Midlane",
        identity: "Cœur névralgique de la carte : rotation rapide, impact direct sur les deux rivières et les escarmouches.",
        summoners: "Saut éclair + Téléportation (pour le tempo) ou Embrasement (pour la létalité).",
        earlyGame: "Maintenez la priorité de ligne pour assister votre jungler lors de la contestation des carapateurs et des escarmouches en rivière.",
        midGame: "Après la chute de la première tour, échangez généralement votre lane avec votre duo Bot pour aller farm sur une sidelane en sécurité.",
        lateGame: "Positionnement en arrière-garde ou prise d'angle dans le brouillard de guerre pour appliquer vos contrôles et bursts décisifs."
    },
    ADC: {
        roleName: "Botlane (ADC / Tireur)",
        identity: "Puissance de feu principale et assurance-vie de l'équipe pour les combats de fin de partie et la prise de structures.",
        summoners: "Saut éclair + Purge (face aux contrôles lourds) ou Soins / Fantôme.",
        earlyGame: "Concentrez-vous sur le last-hitting parfait (10 CS/min). Synchronisez vos trades avec les déplacements de votre support sans vous isoler.",
        midGame: "Dès que la tour bot tombe, prenez la midlane pour farmer au centre de la carte en toute sécurité avec vos coéquipiers autour de vous.",
        lateGame: "Front-to-back : attaquez la cible la plus proche en restant à portée maximale. Ne franchissez JAMAIS la ligne de front alliée."
    },
    SUPPORT: {
        roleName: "Support",
        identity: "Architecte de la vision, protecteur de l'ADC et catalyseur des escarmouches de l'équipe.",
        summoners: "Saut éclair + Embrasement (pour la pression de kill) ou Épuisement (contre les assassins).",
        earlyGame: "Établissez la présence de ligne au niveau 1. Aidez votre ADC à contrôler le rythme de la vague et placez une balise de vision dans la rivière à 2:45.",
        midGame: "Profitez des rappels de votre ADC pour effectuer des décalages (roams) vers la midlane ou avec le jungler dans la jungle ennemie.",
        lateGame: "Posez 3 balises de vision et 1 balise de contrôle autour du prochain objectif 1 minute avant son apparition, puis préparez le déblaiement avec votre brouilleur."
    }
};

// Moteur tactique d'analyse comparative Mêlée vs Distance
const MATCHUP_TACTICS_ENGINE = {
    meleeVsMelee: {
        title: "Duel Mêlée contre Mêlée (Au Corps-à-Corps)",
        keyRule: "La guerre du niveau 2 et la gestion des combats prolongés.",
        details: [
            "<strong>Course au niveau 2 :</strong> Le premier joueur qui élimine les 7 premiers sbires passe niveau 2 et possède un avantage écrasant de statistiques. Utilisez cet instant pour forcer un trade immédiat.",
            "<strong>Respect des passifs cumulatifs :</strong> Méfiez-vous des champions qui deviennent plus forts au fil du combat (Darius, Jax, Irelia, Trundle, Olaf, Conquérant / Tempo). Si vous n'avez pas ce profil, faites des trades courts et désengagez.",
            "<strong>Attention à l'aggro des sbires :</strong> Frapper un champion au milieu d'une vague de 6 sbires ennemis inflige souvent plus de dégâts que les compétences adverses aux niveaux 1 à 3. Utilisez les buissons pour briser l'aggro.",
            "<strong>Bait des compétences clés :</strong> Ne lancez pas votre all-in tant que l'adversaire a son sort défensif disponible (ex: Contre-attaque de Jax, Parade de Fiora, Bouclier de Shen)."
        ]
    },
    meleeVsRanged: {
        title: "Mêlée face à un Champion à Distance (VS Ranged)",
        keyRule: "L'économie absolue de vos Points de Vie et le timing d'All-in chirurgical.",
        details: [
            "<strong>Sacrifiez des sbires, jamais vos PV :</strong> Concédez 2 ou 3 sbires au niveau 1 pour rester à 100% de vie. Être à 30% PV sous tour vous condamne à vous faire zoner ou dive.",
            "<strong>Setup de runes & départ défensif :</strong> Équipez systématiquement le Bouclier de Doran et la rune Second Souffle. Chaque auto-attaque ennemie reçue déclenchera une régénération continue.",
            "<strong>Le Bush Dancing (Jeu de buisson) :</strong> Réfugiez-vous dans les buissons de la ligne pour casser la ligne de mire de l'adversaire et l'empêcher de vous cibler avec ses attaques à distance.",
            "<strong>Le timing d'All-in :</strong> Les champions à distance ont des statistiques défensives très basses. Dès qu'ils ratent leur sort de désengagement ou qu'ils avancent au-delà de la moitié de la lane, engagez sans hésitation : au corps-à-corps pur, vous l'emportez."
        ]
    },
    rangedVsMelee: {
        title: "Champion à Distance face à un Mêlée (VS Melee)",
        keyRule: "Le spacing permanent (Tethering), la punition au last hit et la conservation du sort de disengage.",
        details: [
            "<strong>Punition systématique au last hit :</strong> Chaque fois que le champion mêlée s'avance pour donner le coup de grâce à un sbire, envoyez-lui une auto-attaque et une compétence.",
            "<strong>Ne gaspillez JAMAIS votre sort défensif :</strong> Conservez précieusement votre sort de contrôle ou de fuite (cage, bump, recul, saut). Ne l'utilisez jamais pour farm ou poke : c'est votre seule assurance-vie face à leur dash.",
            "<strong>Le piège du push involontaire :</strong> Évitez d'auto-attaquer les sbires en continu. Laissez la vague venir vers vous et gelez-la (freeze) juste devant votre tour pour forcer le mêlée à s'exposer aux ganks.",
            "<strong>Orbwalking / Kiting :</strong> Frappez, puis déplacez-vous immédiatement vers l'arrière pendant le temps de recharge de votre attaque pour maintenir la distance maximale de sécurité."
        ]
    },
    rangedVsRanged: {
        title: "Duel Distance contre Distance (Bataille de Portée & Skillshots)",
        keyRule: "La portée effective, l'esquive perpendiculaire et le trading parallèle.",
        details: [
            "<strong>Avantage de portée d'attaque :</strong> Le champion qui possède ne serait-ce que 25 ou 50 points de portée d'avance (ex: Caitlyn 650 vs Lucian 500) dicte le tempo. Punissez l'adversaire dès qu'il franchit votre ligne.",
            "<strong>Trading parallèle :</strong> Positionnez-vous en miroir par rapport à la vague de sbires. Si l'ennemi s'avance pour trade, punissez en même temps pour ne pas subir gratuitement.",
            "<strong>Esquive des skillshots :</strong> Déplacez-vous en diagonale ou perpendiculairement à la trajectoire des tirs plutôt que de fuir en ligne droite.",
            "<strong>Gestion de la mana :</strong> Ne videz pas votre jauge de mana sur les sbires. Gardez toujours de quoi riposter ou sécuriser un kill."
        ]
    }
};

// Export global pour être consommé par app.js et guides.js
window.ARCHETYPES_INFO = ARCHETYPES_INFO;
window.CHAMPIONS_STRATEGY_DATA = CHAMPIONS_STRATEGY_DATA;
window.GENERAL_ROLE_GUIDELINES = GENERAL_ROLE_GUIDELINES;
window.MATCHUP_TACTICS_ENGINE = MATCHUP_TACTICS_ENGINE;
