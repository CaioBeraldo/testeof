// ═══════════════════════════════════════════════════════════
// QUADROAI PRO — CONFIG.JS v9
// ═══════════════════════════════════════════════════════════

var PROMPT_RAW_RULE = 'CRITICAL: Generate ONLY the raw image itself. NO picture frame, NO frame border, NO wooden or metal frame, NO canvas stretcher bars, NO room background, NO wall, NO interior scene, NO white margins, NO mockup. Image fills 100% edge to edge — pure scene only.';

var FRAME_OPTS = [
  {id:'moldura', label:'Moldura', type:'single', items:[
    'Preta fosca','Preta brilhante','Ouro escovado','Ouro polido',
    'Madeira escura','Madeira clara','Prata','Rose gold','Bronze','Sem moldura (canvas)'
  ]}
];

var COMPOSICAO_OPTS = [
  {id:'composicao', label:'Layout do kit', type:'single', items:[
    'Cada quadro independente','Panorama continuo nas 3 pecas','Central em destaque + laterais'
  ]}
];

var FONTES_COMPLETAS = {
  id:'fonte', label:'Fonte da frase', type:'font',
  items:[
    {name:'Great Vibes',        css:'Great Vibes, cursive',         sample:'Nunca foi sorte',   group:'Cursivas'},
    {name:'Dancing Script',     css:'Dancing Script, cursive',      sample:'Sempre foi Deus',   group:'Cursivas'},
    {name:'Pacifico',           css:'Pacifico, cursive',            sample:'Fé que move',       group:'Cursivas'},
    {name:'Satisfy',            css:'Satisfy, cursive',             sample:'Graça divina',      group:'Cursivas'},
    {name:'Cinzel',             css:'Cinzel, serif',                sample:'GLORIA A DEUS',     group:'Serifadas'},
    {name:'Cormorant Garamond', css:'Cormorant Garamond, serif',    sample:'Fé e Esperança',    group:'Serifadas'},
    {name:'Playfair Display',   css:'Playfair Display, serif',      sample:'Amor Eterno',       group:'Serifadas'},
    {name:'EB Garamond',        css:'EB Garamond, serif',           sample:'Graça e Paz',       group:'Serifadas'},
    {name:'Libre Baskerville',  css:'Libre Baskerville, serif',     sample:'Força e Honra',     group:'Serifadas'},
    {name:'Raleway',            css:'Raleway, sans-serif',          sample:'DEUS É FIEL',       group:'Modernas'},
    {name:'Montserrat',         css:'Montserrat, sans-serif',       sample:'KINGDOM',           group:'Modernas'},
    {name:'Josefin Sans',       css:'Josefin Sans, sans-serif',     sample:'PEACE & FAITH',     group:'Modernas'},
    {name:'Oswald',             css:'Oswald, sans-serif',           sample:'FORÇA',             group:'Modernas'},
  ]
};

var CONFIG = {

  // ══════════════════════════════════════════════════════
  religioso: {
    icon:'✝', name:'Religioso', sub:'Jesus, Leao, Maria, Frases', color:'#c9923c',
    opts:[
      // 1. PERSONAGENS
      {id:'personagens', label:'Personagens (pode marcar mais de 1)', type:'multi', items:[
        // Jesus
        'Jesus Cristo — close rosto com coroa de espinhos',
        'Jesus Cristo — figura inteira com manto branco',
        'Jesus Cristo — retrato majestoso olhando para cima',
        'Jesus Cristo — mãos abertas com chagas',
        'Jesus Cristo com leão de Judá lado a lado',
        'Jesus Cristo e leão — silhuetas ao entardecer',
        // Leão
        'Leão de Judá — close rosto olhos intensos',
        'Leão de Judá — majestoso de frente com crina dourada',
        'Leão de Judá com olhos azuis penetrantes',
        'Família de leões — pai, mãe e 3 filhotes',
        'Leão e filhote juntos',
        // Maria
        'Maria — Nossa Senhora orando com manto azul',
        'Maria — Nossa Senhora com halo dourado',
        'Maria e menino Jesus',
        // Sagrada Família
        'Sagrada Família — Jesus, Maria e José',
        // Outros
        'Arcanjo Miguel derrotando o demônio',
        'Anjo guerreiro com espada de fogo',
        'Anjo da guarda com criança',
        '3 Cruzes do Calvário ao entardecer',
        'Mãos em oração com bíblia e rosário',
        'Cordeiro de Deus sobre pedra',
        'Santa Ceia — panorama completo',
        'Pomba do Espírito Santo com luz',
        'Bom Pastor com ovelha nos ombros'
      ]},
      // 2. ESTILO
      {id:'estilo', label:'Estilo artístico', type:'single', items:[
        'Ultra-realismo fotográfico 8K',
        'Pintura a óleo barroca estilo Caravaggio',
        'Escultura 3D em mármore branco e ouro',
        'CGI cinematográfico 3D hiper-realista',
        'Vitral colorido estilo catedral gótica',
        'Mosaico bizantino dourado',
        'Aquarela dramática com respingos de tinta',
        'Grafite artístico ultra-detalhado preto e branco',
        'Pintura digital épica estilo concept art',
        'Arte sacra medieval dourada',
        'Fotorrealismo 8K estilo editorial'
      ]},
      // 3. ATMOSFERA
      {id:'atmosfera', label:'Atmosfera', type:'single', items:[
        'Glória dourada — raios de luz divina explosivos',
        'Dark e cinematográfico — sombras dramáticas',
        'Fogo e chamas ao redor — épico e intenso',
        'Épico e tempestuoso — relâmpagos e nuvens',
        'Místico e noturno — céu estrelado',
        'Celestial suave — luz do paraíso',
        'Guerreiro e poderoso — batalha espiritual',
        'Melancólico e tocante — sofrimento sagrado',
        'Majestoso e grandioso — trono celestial',
        'Renascimento italiano — luz natural clássica'
      ]},
      // 4. CENÁRIO
      {id:'cenario', label:'Cenário de fundo', type:'single', items:[
        'Céu com nuvens e raios de luz dourados',
        'Montanha sagrada com névoa ao fundo',
        'Jerusalém antiga ao entardecer dourado',
        'Floresta mística com neblina e luz filtrada',
        'Oceano e tempestade épica',
        'Deserto com amanhecer dourado',
        'Interior de catedral gótica com vitrais',
        'Campo de batalha espiritual épico',
        'Cosmos e nebulosas coloridas',
        'Fundo abstrato com manchas de tinta dourada',
        'Parede de pedra texturizada antiga',
        'Fundo preto puro com partículas de ouro'
      ]},
      // 5. DETALHES
      {id:'detalhes', label:'Detalhes decorativos (pode marcar mais de 1)', type:'multi', items:[
        'Coroa de espinhos com gotas de sangue',
        'Coroa de ouro reluzente',
        'Halo de luz divina dourado',
        'Asas de anjo brancas abertas',
        'Asas de anjo douradas',
        'Espada de luz flamejante',
        'Cruz dourada ao fundo',
        'Rosas vermelhas ao redor',
        'Pomba branca voando',
        'Raios de luz celeste',
        'Manto vermelho heróico',
        'Manto azul celestial',
        'Manchas de tinta dourada (gold splash)',
        'Folhas de ouro flutuando',
        'Chamas ao redor'
      ]},
      // 6. EFEITOS
      {id:'efeitos', label:'Efeitos visuais (pode marcar mais de 1)', type:'multi', items:[
        'Partículas de ouro flutuando',
        'Brilho divino dourado ao redor',
        'Névoa mística dourada',
        'Fumaça épica ao fundo',
        'Luz vazando entre nuvens',
        'Reflexo em água abaixo',
        'Labaredas de fogo ao fundo',
        'Bokeh de luz dourada',
        'Raios e trovões ao fundo',
        'Poeira de luz dourada',
        'Respingos de tinta dourada (paint splash)',
        'Efeito espelho abaixo'
      ]},
      // 7. CORES
      {id:'paleta', label:'Paleta de cores', type:'single', items:[
        'Preto e ouro — clássico premium',
        'Branco e ouro — limpo e divino',
        'Azul escuro e ouro — noturno majestoso',
        'Vinho e ouro — dramático e rico',
        'Sépia envelhecido — vintage sacro',
        'Laranja e ouro — fogo divino',
        'Cinza e prata — clean moderno',
        'Marrom terroso e ouro — rústico sagrado',
        'Vermelho e ouro — guerra e glória',
        'Verde esmeralda e ouro'
      ]},
      ...COMPOSICAO_OPTS,
      // 8. FRASES
      {id:'frase_esq', label:'Frase painel esquerdo', type:'text', placeholder:'Ex: Nunca foi sorte'},
      {id:'frase_dir', label:'Frase painel direito',  type:'text', placeholder:'Ex: Sempre foi Deus'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  gold: {
    icon:'✨', name:'Gold Luxo', sub:'Flores, vasos e ouro premium', color:'#B8860B',
    opts:[
      {id:'tema', label:'Tema principal', type:'single', items:[
        'Flores 3D douradas em relevo — fundo preto',
        'Tulipas douradas 3D esculturais',
        'Magnólias douradas em relevo — fundo dark',
        'Orquídeas douradas estilo gold foil',
        'Penas de ouro elegantes — fundo escuro',
        'Árvore dourada panorâmica com folhas caindo',
        'Borboletas douradas em voo',
        'Ginkgo biloba dourado — minimalista',
        'Bambu dourado estilizado',
        'Pavão com cauda dourada aberta',
        'Rosas douradas 3D — fundo preto premium',
        'Flores silvestres gold line art',
        'Arabescos e rendas douradas — fundo escuro',
        'Dente-de-leão dourado com vento',
        'Cisnes dourados em água espelhada',
        'Peonias douradas em relevo',
        'Espirais e geometria dourada premium',
        'Galhos floridos dourados — estilo japonês',
        'Folhas botânicas douradas — estilo art nouveau'
      ]},
      {id:'estilo_gold', label:'Estilo visual', type:'single', items:[
        'Gold foil sobre fundo escuro premium',
        '3D escultura volumétrica realista',
        'Line art dourada minimalista',
        'Aquarela com toques de folha de ouro',
        'Art nouveau dourado ornamental',
        'Fotorrealista macro com detalhes',
        'Silhueta dourada clean sobre fundo dark'
      ]},
      {id:'fundo', label:'Cor de fundo', type:'single', items:[
        'Preto absoluto','Carvão escuro texturizado','Azul marinho profundo',
        'Vinho escuro bordô','Verde floresta escuro','Creme e bege luxo',
        'Cinza pérola','Branco premium','Cinza antracite',
        'Marrom chocolate escuro','Roxo escuro premium'
      ]},
      {id:'acabamento', label:'Tom do metal', type:'single', items:[
        'Ouro 24k brilhante','Ouro fosco envelhecido','Champagne metálico',
        'Rose gold','Platina fria','Bronze dourado antiquado',
        'Cobre polido','Ouro e prata combinados','Ouro branco moderno'
      ]},
      {id:'efeitos', label:'Efeitos extras (pode marcar mais de 1)', type:'multi', items:[
        'Partículas douradas flutuando','Brilho metálico intenso',
        'Reflexo espelhado no fundo','Fumaça dourada sutil',
        'Bokeh dourado ao fundo','Luz lateral dramática',
        'Bordas com folha de ouro','Poeira de ouro',
        'Veias de ouro no fundo','Halo de luz dourada'
      ]},
      ...COMPOSICAO_OPTS,
      {id:'frase', label:'Frase (opcional)', type:'text', placeholder:'Ex: Luxo e Elegância'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  floral: {
    icon:'✿', name:'Floral', sub:'Rosas, peonias, orquideas e mais', color:'#9B2255',
    opts:[
      {id:'flor', label:'Flor principal', type:'single', items:[
        // Rosas
        'Rosa vermelha — close macro com gotas',
        'Rosa branca pura — fine art fundo dark',
        'Rosa preta dark — dramática',
        'Rosa coral — tons quentes',
        'Rosa azul mágica',
        'Rosa dourada — gold foil',
        // Peonias
        'Peônia rosa blush — romântica',
        'Peônia champagne — luxo claro',
        'Peônia coral — vibrante',
        'Peônia branca — clean fine art',
        'Peônia roxa — dramática dark',
        'Peônia vermelha — apaixonada',
        // Orquídeas
        'Orquídea branca — elegante dark',
        'Orquídea roxa — místico dark',
        'Orquídea amarela dourada',
        'Orquídea borboleta rosa',
        // Outras florais
        'Tulipa branca','Tulipa vermelha','Tulipa roxa bicolor',
        'Girassol vibrante','Lavanda francesa — campo',
        'Magnólia branca','Magnólia rosa',
        'Cerejeira sakura rosa','Cerejeira branca nevada',
        'Ranúnculo rosa intenso',
        'Anêmona roxa dark','Anêmona vermelha',
        'Hibisco vermelho tropical',
        'Dália roxa premium','Dália vermelha',
        'Hortênsia azul','Hortênsia rosa','Hortênsia branca',
        'Íris roxa','Lírio branco','Lírio laranja',
        'Flor de lótus roxa — aquática',
        'Flor de lótus branca — zen',
        'Ginkgo biloba outonal'
      ]},
      {id:'estilo', label:'Estilo visual', type:'single', items:[
        'Fotografia macro ultra-realista — fundo dark',
        'Fine art dark floral — fundo preto dramatico',
        'Fine art fundo branco minimalista — clean',
        'Gold foil sobre fundo escuro',
        'Aquarela romântica suave — pastel',
        'Pintura a óleo clássica holandesa',
        '3D escultura em relevo — volumétrico',
        'Neon sobre fundo preto — vibrante',
        'Dupla exposição artística',
        'Impressionismo floral — Monet style',
        'Botânica científica vintage — herbário',
        'Watercolor splash vibrante — colorido',
        'Pintura digital hiper-realista'
      ]},
      {id:'atmosfera_floral', label:'Atmosfera', type:'single', items:[
        'Romântica e sonhadora','Dramática e dark luxo',
        'Primaveril e fresca','Vintage e nostálgica',
        'Luxuosa e premium','Delicada e pastel',
        'Vibrante e saturada','Mística e etérea',
        'Oriental e serena','Bold e contemporânea'
      ]},
      {id:'fundo', label:'Cor de fundo', type:'single', items:[
        'Preto absoluto dramatico','Verde floresta escuro',
        'Navy midnight profundo','Creme luxo suave',
        'Branco puro clean','Vinho escuro bordô',
        'Cinza carvão premium','Azul petróleo elegante',
        'Verde sage','Terracota escuro','Roxo escuro',
        'Marrom mogno','Rosa escuro dramático'
      ]},
      {id:'composicao_floral', label:'Tipo de composição', type:'single', items:[
        'Flor única herói — close macro dominante',
        'Bouquet rico e abundante',
        'Ramo com folhas e caule — vertical elegante',
        'Pétalas caindo em movimento',
        'Arranjo de floricultura premium',
        'Flat lay artístico — vista de cima',
        'Flores emergindo da escuridão',
        'Jardim botânico exuberante'
      ]},
      {id:'extras', label:'Detalhes extras (pode marcar mais de 1)', type:'multi', items:[
        'Gotas de água cristalinas','Folha de ouro (gold leaf)',
        'Bokeh dourado ao fundo','Pétalas caindo em movimento',
        'Borboleta pousada na flor','Abelha na flor',
        'Musgo e terra ao redor','Fita de seda elegante',
        'Ramos e folhas ao fundo','Névoa sutil ao fundo',
        'Brilhos e partículas de luz','Teia de aranha com orvalho',
        'Respingos de tinta aquarela'
      ]},
      {id:'paleta', label:'Clima de cores', type:'single', items:[
        'Tons naturais da flor — autêntico',
        'Dramático escuro — alto contraste',
        'Suave e romântico pastel','Vibrante e saturado',
        'Monocromático elegante','Gold e escuro luxuoso',
        'Vintage e envelhecido','Fresco e primaveril',
        'Terracota e nude quente'
      ]},
      ...COMPOSICAO_OPTS,
      {id:'frase', label:'Frase (opcional)', type:'text', placeholder:'Ex: Floresça'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  abstrato: {
    icon:'◈', name:'Abstrato', sub:'Fluid, geometrico, 3D, vasos', color:'#1E6FBF',
    opts:[
      {id:'estilo', label:'Estilo abstrato', type:'single', items:[
        // Geométrico (como nas imagens enviadas)
        'Geométrico 3D com iluminação dramática — círculos e formas',
        'Geométrico minimalista — retângulos sobrepostos com luz',
        'Formas orgânicas 3D com glow — fundo escuro',
        'Geometria sagrada — mandala central premium',
        'Arquitetura abstrata — volumes e sombras',
        // Fluid
        'Fluid art — tinta fluída orgânica premium',
        'Fluid art com objetos decorativos',
        'Marmorizado líquido 3D — veios dourados',
        // Folhas/botânico abstrato (como ginkgo nas imagens)
        'Folhas de ginkgo biloba — coloridas sobrepostas',
        'Folhas tropicais abstratas — teal e dourado',
        'Folhas outono — laranja, teal e bronze sobrepostas',
        'Pétalas abstratas em camadas coloridas',
        // Outros
        'Ondas 3D volumétricas — pintura de areia',
        'Pinceladas expressivas gestuais — bold',
        'Arte fractal digital — cósmica',
        'Vitral colorido artístico',
        'Dripping art — tinta pingando',
        'Brush strokes orientais zen',
        'Topográfico ondulado — camadas',
        'Cristais geométricos 3D — facetado',
        'Tinta em água macro — orgânico'
      ]},
      {id:'atmosfera_abs', label:'Clima visual', type:'single', items:[
        'Alto contraste dramático','Suave e esfumado etéreo',
        'Explosivo e vibrante','Delicado e transparente',
        'Metálico e refletivo premium','Escuro e misterioso',
        'Luminoso e celestial','Sereno e zen',
        'Bold e contemporâneo'
      ]},
      {id:'paleta', label:'Paleta de cores', type:'single', items:[
        'Teal e laranja — complementar vibrante',
        'Teal, dourado e marrom — outonal rico',
        'Ouro e preto — premium clássico',
        'Laranja, cinza e dourado — moderno',
        'Roxo e ouro','Azul royal e ouro',
        'Verde esmeralda e ouro','Rosa e rose gold',
        'Prata e preto','Neon sobre preto',
        'Terracota e bronze','Vermelho e ouro',
        'Azul e prata','Bege e creme luxo',
        'Vinho e platina'
      ]},
      {id:'objeto_esq', label:'Objeto painel esquerdo', type:'single', items:[
        'Nenhum objeto — arte pura','Vaso geométrico moderno',
        'Vaso marmorizado alto slim','Vaso cerâmica texturizado',
        'Vaso metálico dourado','Galho seco decorativo',
        'Livros empilhados','Vela em castiçal slim',
        'Planta suculenta em vaso','Escultura abstrata pequena'
      ]},
      {id:'objeto_ctr', label:'Objeto painel central', type:'single', items:[
        'Nenhum objeto — arte pura','Vaso marmorizado grande herói',
        'Vaso geométrico alto impactante','Orbe de cristal',
        'Vela em castiçal gold alto','Busto clássico mármore',
        'Vaso com ramo seco dramático','Escultura abstrata grande',
        'Frasco de perfume luxo'
      ]},
      {id:'objeto_dir', label:'Objeto painel direito', type:'single', items:[
        'Nenhum objeto — arte pura','Vaso geométrico moderno',
        'Vaso marmorizado alto slim','Vaso cerâmica texturizado',
        'Vaso metálico dourado','Galho seco decorativo',
        'Livros empilhados','Vela em castiçal slim',
        'Planta suculenta em vaso','Escultura abstrata pequena'
      ]},
      ...COMPOSICAO_OPTS,
      {id:'frase', label:'Frase (opcional)', type:'text', placeholder:'Ex: Equilíbrio'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  marmore: {
    icon:'◻', name:'Marmore', sub:'Pedra nobre, veios, luxo mineral', color:'#607080',
    opts:[
      {id:'tipo', label:'Tipo de pedra', type:'single', items:[
        'Carrara branco clássico — veios suaves',
        'Marquina preto belga — veios brancos',
        'Calacatta oro italiano — veios dourados',
        'Ônix mel translúcido — retroiluminado',
        'Ônix preto com veias douradas',
        'Rosa português — tons rosados',
        'Verde Guatemala escuro',
        'Granito preto Galaxy — brilhos estelares',
        'Quartzito azul Macaubas',
        'Travertino bege romano — rústico',
        'Jaspe vermelho imperial',
        'Ônix verde esmeralda',
        'Sodalita azul royal',
        'Ametista geodo — roxo brilhante',
        'Granito branco polar',
        'Lápis-lazúli azul profundo',
        'Marmore laranja veneziano'
      ]},
      {id:'veias', label:'Cor das veias', type:'single', items:[
        'Ouro 24k brilhante','Platina fria espelhada','Rose gold',
        'Prata espelhada','Bronze escuro antiquado',
        'Ouro e branco combinados','Sem veias — pedra pura',
        'Branco leitoso','Preto intenso','Cobre metálico',
        'Ouro envelhecido','Vermelho profundo'
      ]},
      {id:'acabamento', label:'Acabamento', type:'single', items:[
        'Polido espelhado alto brilho','Fosco natural leathered',
        'Semi-polido acetinado suave','Backlit translúcido luminoso',
        'Escovado brushed premium','Levigado antigo patinado'
      ]},
      {id:'iluminacao', label:'Iluminação', type:'single', items:[
        'Luz lateral rasante que realça textura',
        'Luz zenital suave e uniforme',
        'Backlit iluminado de baixo para cima',
        'Reflexo ambiente luxo dourado',
        'Luz diagonal dramática',
        'Múltiplos pontos de luz premium'
      ]},
      {id:'efeitos', label:'Efeitos extras', type:'multi', items:[
        'Reflexos de luz na superfície','Brilhos nos cristais',
        'Partículas douradas flutuando','Veias com glow de luz',
        'Luz pulsante de dentro'
      ]},
      ...COMPOSICAO_OPTS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  natureza: {
    icon:'🌿', name:'Botânico', sub:'Plantas, frases e leveza natural', color:'#2E7D32',
    opts:[
      {id:'planta', label:'Planta principal', type:'single', items:[
        'Eucalipto — ramos elegantes',
        'Oliveira com azeitonas',
        'Monstera deliciosa',
        'Bambu — vertical zen',
        'Cerejeira sakura',
        'Lavanda francesa',
        'Samambaia',
        'Cactus e suculentas',
        'Ramo de pinheiro',
        'Folha de bananeira tropical',
        'Palmeira areca',
        'Ipê amarelo florido',
        'Jacarandá florido',
        'Flor de lótus',
        'Ramo de algodão',
        'Galhos com flores de primavera',
        'Hortênsias',
        'Figueira'
      ]},
      {id:'estilo', label:'Estilo visual', type:'single', items:[
        'Minimalista escandinavo clean','Aquarela suave romântica',
        'Fotográfico macro realista','Japonês zen sumi-e ink',
        'Vintage herbário científico','Boho terracota',
        'Art nouveau decorativo','Fine art botânico escuro'
      ]},
      {id:'atmosfera_nat', label:'Atmosfera', type:'single', items:[
        'Serena e minimalista','Romântica e delicada',
        'Vibrante e tropical','Mística e neblinosa',
        'Outonal quente','Primaveril fresca'
      ]},
      {id:'paleta', label:'Paleta de cores', type:'single', items:[
        'Verde sage e creme','Terracota e bege',
        'Branco e cinza quente','Rosa e creme pastel',
        'Preto e branco fine art','Ocre e ferrugem',
        'Verde escuro e madeira','Verde musgo e dourado',
        'Laranja queimado e marrom'
      ]},
      ...COMPOSICAO_OPTS,
      {id:'frase_esq', label:'Frase painel esquerdo', type:'text', placeholder:'Ex: Respire'},
      {id:'frase_ctr', label:'Frase painel central',  type:'text', placeholder:'Ex: Gratidão'},
      {id:'frase_dir', label:'Frase painel direito',  type:'text', placeholder:'Ex: Viva'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  lavabo: {
    icon:'🛁', name:'Lavabo e Spa', sub:'Velas, perfumes, elegância', color:'#8D6E63',
    opts:[
      {id:'composicao_lavabo', label:'Objetos principais', type:'single', items:[
        'Vela, difusor e folhagens','Perfumes e bandeja elegante',
        'Pedras zen, vela e musgo','Toalhas dobradas e flores',
        'Sabonetes artesanais e flores','Espelho, vela e buquê',
        'Bandeja gold com perfumes e joias','Banheira com pétalas e velas',
        'Flores em vaso e vela acesa','Esfoliante, sabonete e bambu'
      ]},
      {id:'estilo', label:'Estilo', type:'single', items:[
        'Spa clean bege e branco','Rose chic feminino luxo',
        'Minimalista moderno high-end','Hotel boutique 5 estrelas',
        'Japonês zen sereno','Provençal romântico francês',
        'Nórdico aconchegante hygge','Contemporâneo cinza e ouro'
      ]},
      {id:'flores_lavabo', label:'Flores decorativas', type:'single', items:[
        'Sem flores','Rosas brancas elegantes','Peônia rosa blush',
        'Orquídeas brancas','Lavanda francesa',
        'Eucalipto e ramos verdes','Flores silvestres mistas',
        'Flor de algodão','Dália branca'
      ]},
      {id:'paleta', label:'Paleta de cores', type:'single', items:[
        'Bege branco e dourado','Rose champagne e branco',
        'Cinza claro e branco premium','Verde sage e off-white',
        'Preto e ouro minimalista','Terracota e creme',
        'Branco puro clean','Creme e rose gold','Nude e platina'
      ]},
      {id:'efeitos', label:'Efeitos extras', type:'multi', items:[
        'Fumaça sutil da vela acesa','Reflexo em superfície brilhante',
        'Luz suave lateral quente','Bokeh ao fundo',
        'Partículas douradas','Sombras suaves e elegantes'
      ]},
      ...COMPOSICAO_OPTS,
      {id:'frase', label:'Frase (opcional)', type:'text', placeholder:'Ex: Seu lar, seu refúgio'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  infantil: {
    icon:'🐢', name:'Infantil', sub:'Safari, ursinhos, espaço e mais', color:'#E91E63',
    opts:[
      {id:'tema', label:'Tema', type:'single', items:[
        // Safari — como nas imagens
        'Safari — girafa, elefantinho e leão baby',
        'Safari — leão, zebra e elefante baby',
        'Safari — animais baby dormindo na lua',
        // Ursinhos — como nas imagens
        'Ursinho Pooh dormindo em nuvem',
        'Ursinho polar dormindo com estrelas',
        'Ursinho teddy bear fluffy na lua',
        'Ursinho de pelúcia no espaço',
        // Dinossauros — como nas imagens
        'Dinossauros baby coloridos — T-Rex, braquiossauro, triceratops',
        'Dinossauros baby fofos acenando',
        'Dinos baby em floresta mágica',
        // Espaço — como nas imagens
        'Astronauta baby no espaço com planetas',
        'Foguete e planetas coloridos',
        'Astronauta, saturno e estrelas — cartoon',
        // Outros temas populares
        'Unicórnio mágico arco-íris',
        'Sereia fofinha no oceano',
        'Pets fofos — cachorros',
        'Pets fofos — gatinhos',
        'Coelhinhos na páscoa',
        'Panda comendo bambu',
        'Flamingo rosa estiloso',
        'Fazendinha com animais',
        'Jardim encantado com fadas',
        'Princesa e castelo encantado',
        'Dragão fofo e amigável',
        'Pinguins no gelo',
        'Baleia na água azul',
        'Raposa no outono'
      ]},
      {id:'estilo_render', label:'Estilo de render', type:'single', items:[
        'Aquarela pastel suave — delicado (estilo das imagens)',
        'Pixar 3D — volume e brilho',
        'Clay 3D — argila colorida e fofa',
        'Cartoon colorido vibrante',
        'Bichinho de pelúcia realista',
        'Sticker brilhante com contorno',
        'Illustration livro infantil premium',
        'Chibi anime fofo',
        'Digital painting detalhado',
        'Fofo e cute 2D clean'
      ]},
      {id:'expressao', label:'Expressão do personagem', type:'single', items:[
        'Dormindo fofinho pacificamente',
        'Sorrindo super feliz',
        'Olhando curioso com olhos grandes',
        'Pulando de alegria',
        'Acenando oi com simpatia',
        'Abraçando pelúcia',
        'Fazendo coração com as mãos',
        'Comendo sorvete encantado',
        'Usando chapéu de festa'
      ]},
      {id:'fundo', label:'Cenário', type:'single', items:[
        'Automático para o tema escolhido',
        'Céu azul com nuvens fofas e lua',
        'Fundo bege neutro limpo — minimalista',
        'Jardim de flores gigantes coloridas',
        'Floresta mágica com cogumelos luminosos',
        'Oceano com corais coloridos e bolhas',
        'Espaço com planetas e estrelas coloridos',
        'Savana africana ao entardecer',
        'Neve e inverno fofo com flocos',
        'Degradê pastel suave',
        'Nuvens de algodão doce',
        'Praia tropical com palmeiras'
      ]},
      {id:'paleta', label:'Paleta de cores', type:'single', items:[
        'Tons neutros e pastel — bege, creme, caramelo',
        'Pastel suave bebê','Rosa e lavanda',
        'Azul bebê e amarelo sol','Verde lima e coral',
        'Cores vivas e vibrantes','Arco-íris completo',
        'Candy colors doces','Teal e amarelo moderno'
      ]},
      {id:'extras', label:'Detalhes mágicos (pode marcar mais de 1)', type:'multi', items:[
        'Estrelinhas e luzinhas ao redor',
        'Corações e florinhas',
        'Confetes coloridos caindo',
        'Bolhas transparentes flutuando',
        'Brilhos e glitter',
        'Arco-íris decorativo',
        'Balões coloridos flutuando',
        'Borboletas ao redor',
        'Luzes de fada brilhando',
        'Nuvens fofas ao redor',
        'Bandeirinhas de festa'
      ]},
      ...COMPOSICAO_OPTS,
      {id:'nome_crianca', label:'Nome da criança (opcional)', type:'text', placeholder:'Ex: Sofia'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  gamer: {
    icon:'🎮', name:'Gamer', sub:'Neon, controles, headset, setup', color:'#00C853',
    opts:[
      {id:'objetos_gamer', label:'Objetos no kit', type:'single', items:[
        'Controle | Headset | Teclado',
        'Loading bar | Controle | Game On',
        'Setup completo panorâmico',
        'Headset herói + elementos laterais',
        'Controle retro neon',
        'HUD futurista + símbolos gamer',
        'Mouse + Teclado + Headset',
        'Joystick arcade retrô',
        'Console + controle',
        'Personagem de jogo + objetos'
      ]},
      {id:'estilo', label:'Estilo visual', type:'single', items:[
        'Neon verde — Xbox vibes','Neon ciano e magenta — arcade retrô',
        'RGB roxo e azul — setup premium','Vermelho gamer agressivo',
        'Poster minimalista clean gamer','Cyber holográfico futurista',
        'Esports high contrast profissional','Pop art gamer colorido',
        'Vaporwave estético','Glitch art digital',
        'Militar tático dark','Sci-fi alien futurista'
      ]},
      {id:'personagem_gamer', label:'Personagem (opcional)', type:'single', items:[
        'Nenhum personagem','Astronauta pixel art',
        'Soldado futurista neon','Ninja cyber',
        'Cavaleiro medieval neon','Robô futurista',
        'Personagem RPG épico','Piloto de corrida',
        'Espadachim samurai neon','Mago com staff de luz'
      ]},
      {id:'paleta', label:'Paleta neon', type:'single', items:[
        'Verde neon e preto','Ciano e magenta','Roxo e azul neon',
        'Vermelho e preto','Azul elétrico e preto','Branco RGB clean',
        'Laranja e preto','Amarelo neon e preto','Rosa neon e preto',
        'Multicolorido RGB'
      ]},
      {id:'efeitos', label:'Efeitos extras (pode marcar mais de 1)', type:'multi', items:[
        'Glow neon intenso','Partículas de luz coloridas',
        'Raios elétricos','Fumaça colorida dramática',
        'Reflexo em superfície','Holográfico ao fundo',
        'Scan lines retrô','Glitch digital',
        'Explosão de pixels','Chamas neon',
        'Matrix de códigos caindo'
      ]},
      ...COMPOSICAO_OPTS,
      {id:'frase_esq', label:'Frase esquerda', type:'text', placeholder:'Ex: PLAY HARD'},
      {id:'frase_ctr', label:'Frase central',  type:'text', placeholder:'Ex: PLAYER 1'},
      {id:'frase_dir', label:'Frase direita',  type:'text', placeholder:'Ex: GAME ON'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  },

  // ══════════════════════════════════════════════════════
  cidades: {
    icon:'🗺', name:'Cidades', sub:'Paris, Toquio, Nova York e mais', color:'#C62828',
    opts:[
      {id:'cidade', label:'Cidade', type:'single', items:[
        'Paris','Londres','Roma','Nova York','Tóquio','Veneza',
        'Santorini','Amsterdam','Barcelona','Lisboa','Dubai',
        'Rio de Janeiro','Marrakesh','Praga','Viena','Florença',
        'Bali','Istambul','Buenos Aires','Kyoto',
        'Seul','Singapura','Sydney','San Francisco',
        'Miami','Las Vegas','Chicago',
        'Cairo e pirâmides','Machu Picchu','Taj Mahal',
        'Coliseu de Roma','Sahara e dunas'
      ]},
      {id:'estilo', label:'Estilo artístico', type:'single', items:[
        'Aquarela romântica','Fotografia P&B artístico',
        'Vintage travel poster anos 50','Impressionismo estilo Monet',
        'Neon cyberpunk noturno','Art nouveau decorativo',
        'Sketch a lápis detalhado','Pintura a óleo clássica',
        'Pop art colorido','Line art minimalista',
        'Gravura vintage sépia','Cinematográfico fotográfico'
      ]},
      {id:'cena_esq', label:'Cena painel esquerdo', type:'single', items:[
        'Detalhe arquitetônico típico','Café ou restaurante típico',
        'Beco ou ruela charmosa','Jardim ou parque',
        'Ponte ou rio famoso','Mercado local vibrante'
      ]},
      {id:'cena_ctr', label:'Cena painel central', type:'single', items:[
        'Monumento mais icônico','Vista panorâmica da cidade',
        'Skyline ao entardecer','Vista noturna com luzes',
        'Casal no monumento romântico','Vista aérea impressionante'
      ]},
      {id:'cena_dir', label:'Cena painel direito', type:'single', items:[
        'Detalhe típico da cidade','Transporte típico local',
        'Comida ou bebida local','Janela com flores e varanda',
        'Detalhe de porta colorida'
      ]},
      {id:'clima', label:'Clima e horário', type:'single', items:[
        'Entardecer dourado hora mágica','Noite com luzes da cidade',
        'Dia ensolarado vibrante','Chuva romântica com reflexos',
        'Nevando suavemente','Primavera com flores nas árvores',
        'Amanhecer rosa e dourado','Outono folhas coloridas'
      ]},
      {id:'paleta', label:'Paleta de cores', type:'single', items:[
        'Cores originais vibrantes','Rosa e dourado romântico',
        'Monocromático elegante','Sépia vintage envelhecido',
        'Pastel suave sonhador','Azul e branco mediterrâneo',
        'Preto e branco cinematográfico','Neon e escuro urbano'
      ]},
      ...COMPOSICAO_OPTS,
      {id:'frase', label:'Frase (opcional)', type:'text', placeholder:'Ex: La vie est belle'},
      FONTES_COMPLETAS,
      ...FRAME_OPTS
    ]
  }

};

var CAT_META = {
  religioso:  {badge:'Sacro',    blurb:'Jesus, Leao, Maria, Frases'},
  gold:       {badge:'Luxo',     blurb:'Flores e ouro premium'},
  floral:     {badge:'Floral',   blurb:'Rosas, peonias, orquideas'},
  abstrato:   {badge:'Abstrato', blurb:'Fluid, geometrico, 3D, vasos'},
  marmore:    {badge:'Pedra',    blurb:'Veios nobres e luxo mineral'},
  natureza:   {badge:'Botânico', blurb:'Plantas, frases e leveza'},
  lavabo:     {badge:'Spa',      blurb:'Velas, perfumes, elegância'},
  infantil:   {badge:'Infantil', blurb:'Safari, ursinhos, espaço'},
  gamer:      {badge:'Gamer',    blurb:'Neon, controles e headset'},
  cidades:    {badge:'Urbano',   blurb:'Paris, Tóquio, Nova York...'}
};
