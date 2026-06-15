  -- ============================================================
  -- seed.sql — Utopi'C · Données initiales extraites du HTML
  -- Généré le 2026-06-10
  -- Coller dans : Supabase > SQL Editor > New query
  -- id et cree_le omis (DEFAULT auto attendu sur les tables)
  -- ============================================================


  -- ============================================================
  -- PROJETS
  -- ============================================================

  -- ---- Identité visuelle ----
  -- Note : carousel-1.png et presta-identite.jpg sont des placeholders
  --        réutilisés pour plusieurs projets dans le HTML actuel.
  --        TODO Cléa : remplacer image_url par les vraies images de chaque projet.
  insert into projets (categorie, titre, description, image_url, ordre) values
    ('identite-visuelle', 'Coiffure des Halles',        null, 'assets/images/carousel-1.png',      1),
    ('identite-visuelle', 'Be Pyrage',                  null, 'assets/images/carousel-1.png',      2), -- TODO Cléa : image réelle
    ('identite-visuelle', 'Chevet Presta''Services',    null, 'assets/images/presta-identite.jpg', 3), -- TODO Cléa : image réelle
    ('identite-visuelle', 'Projet identité visuelle',   null, 'assets/images/presta-identite.jpg', 4); -- TODO Cléa : titre et image réels

  -- ---- Print ----
  insert into projets (categorie, titre, description, image_url, ordre) values
    ('print', 'Direct Végétal — brochure',                  null, 'assets/images/carousel-3.png',    1),
    ('print', 'Letizia Quilici — dossier de sponsoring',    null, 'assets/images/carousel-4.jpg',    2),
    ('print', 'Projet print — flyer',                       null, 'assets/images/presta-print.jpg',  3), -- TODO Cléa : titre réel
    ('print', 'Projet print — affiche',                     null, 'assets/images/portfolio-print.jpg', 4); -- TODO Cléa : titre réel

  -- ---- Digital ----
  insert into projets (categorie, titre, description, image_url, ordre) values
    ('digital', 'Direct Végétal — réseaux sociaux',   null, 'assets/images/carousel-2.jpg',       1),
    ('digital', 'Projet digital — contenus',          null, 'assets/images/presta-digitale.jpeg', 2), -- TODO Cléa : titre réel
    ('digital', 'Projet digital — site web',          null, 'assets/images/portfolio-digitale.jpg', 3), -- TODO Cléa : titre réel
    ('digital', 'Présence digitale — mockup',         null, 'assets/images/mockup-smartphone.png', 4); -- TODO Cléa : titre et image réels


  -- ============================================================
  -- AVIS
  -- ============================================================
  -- Tous les avis sont 5 étoiles (5 SVG stars dans le HTML).
  -- Rôles/entreprises issus du HTML (non stockés ici, pas de colonne dédiée) :
  --   Loris KONEFAL      → Dirigeant, Direct'Végétal — Mai 2024
  --   Naturanossa        → Photographe animalier — Juin 2024
  --   Benjamin GANNE     → Fondateur BG Paysage — Mars 2025
  --   Stéphane LANGE     → Fondateur STS Sellerie — Juin 2024
  --   Séverine PETIT     → Mars 2025 (auto-école GPS CONDUITE)
  --   Paul REVEILLÉ      → Mars 2025
  --   Charles Antoine De Marguerie → Mars 2025 (restaurant versaillais)

  insert into avis (auteur, texte, note, lien_externe, ordre) values
    (
      'Loris KONEFAL',
      'Un contact au top pour la réalisation de votre communication. Nous recommandons les yeux fermés!',
      5, null, 1
    ),
    (
      'Naturanossa',
      'Je suis très satisfait du service de Utopi''C. J''ai particulièrement apprécié réactivité et l''écoute de Cléa tout au long de la mise à jour de mon site. Elle a su comprendre mes besoins et a fait en sorte que mon site soit moderne, commerçant et parfaitement à mon image. Je recommande vivement Utopi''C à tous ceux qui souhaitent un accompagnement professionnel et personnalisé ! Merci Cléa.',
      5, null, 2
    ),
    (
      'Benjamin GANNE',
      'Cléa est au top! Toujours disponible et à l''ecoute. Son travail est vraiment personnalisé et de qualité (voir mes cartes de visites, mes pages Insta, Facebook, Linktree ect ..) N''hésitez pas à faire appel aux services de cette jeune entrepreneuse. Je recommande les yeux fermés !',
      5, null, 3
    ),
    (
      'Stéphane LANGE',
      'Gentillesse, efficacité, rapidité, disponibilité... Utopi''C a su comprendre nos attentes et construire un site à notre image. Merci encore !',
      5, null, 4
    ),
    (
      'Séverine PETIT',
      'J''ai débuté mon activité en avril 2024 et j''ai démarché plusieurs entreprises pour développer le site internet de mon entreprise ( auto école GPS CONDUITE). Auprès d''Utopi''C, j''ai trouvé une personne très compétente et à votre écoute. Je n''y connaissais rien en "terme informatique", elle vous explique avec des mots simples et vous rassure dans toutes les démarches pour réaliser votre site. Un site internet créé de A à Z. Aujourd''hui je fais encore appel à elle dès que je recherche à intégrer de nouvelles activités sur mon site. Une personne dévouée, motivée et d''une gentillesse extrême. Merci Cléa',
      5, null, 5
    ),
    (
      'Paul REVEILLÉ',
      'Je recommande les services d''Utopi''C. Accompagnement, réactivité et professionnalisme. Si vous recherchez une entreprise de communication de qualité, vous êtes au bon endroit.',
      5, null, 6
    ),
    (
      'Charles Antoine De Marguerie',
      'Merci Cléa pour la création du site internet de notre restaurant versaillais. Vous avez réalisé un très beau travail et grâce à vous notre ca grimpe :-)))',
      5, null, 7
    );

  -- Article presse BGE : dans le même carrousel "Ils racontent mon univers"
  -- mais ce n'est pas un avis client. Ajouté ici avec lien_externe comme demandé.
  -- note = null (pas de notation étoiles pour un article de presse).
  insert into avis (auteur, texte, note, lien_externe, ordre) values
    (
      'BGE Terres de Loire',
      'Article de presse — portrait de Cléa Laubier / Utopi''C',
      null,
      'https://bge-terresdeloire.fr/entrepreneurs/clea-laubier-utopic/',
      8
    );

  -- Note : article "Votre Agglo — Le magazine de Chartres Métropole #130 - Avril 2024"
  -- est aussi dans la section presse mais sans lien externe ni texte extractible.
  -- TODO Cléa : ajouter le lien ou le texte de cet article si disponible.


  -- ============================================================
  -- CLIENTS (Ils m'ont fait confiance)
  -- logo_url = null partout — TODO Cléa : fournir fichiers logos
  -- Sources : bandeaux "Ils m'ont fait confiance" sur IV, Print, Digital
  -- Note : "8G Paysage" dans identite-visuelle.html est un typo corrigé en "BG Paysage"
  -- ============================================================

  insert into clients (nom, logo_url, ordre) values
    ('Coiffure des Halles',     null,  1), -- TODO Cléa : logo
    ('Be Pyrage',               null,  2), -- TODO Cléa : logo
    ('Chevet Presta''Services', null,  3), -- TODO Cléa : logo
    ('CK Paysages',             null,  4), -- TODO Cléa : logo
    ('BG Paysage',              null,  5), -- TODO Cléa : logo
    ('Direct''Végétal',         null,  6), -- TODO Cléa : logo
    ('Letizia Quilici',         null,  7), -- TODO Cléa : logo (vérifier orthographe)
    ('Naturanossa',             null,  8), -- TODO Cléa : logo
    ('STS Sellerie',            null,  9), -- TODO Cléa : logo
    ('GPS Conduite',            null, 10); -- TODO Cléa : logo


  -- ============================================================
  -- TEXTES ÉDITABLES
  -- ============================================================

  -- ---- Page : index ----
  insert into textes_editables (cle, valeur, page) values
    ('hero_tagline',            'Crée avec passion, Communiquez avec émotion.', 'index'),
    ('hero_subtitle',           'Ton projet, ma créativité, un résultat sur-mesure',  'index'),
    ('hero_cta',                'Un projet ? Parlons-en !',                            'index'),
    ('realisations_titre',      'De l''idée au projet',                               'index'),
    ('realisations_sous_titre', 'Chaque projet, une nouvelle aventure',               'index'),
    ('prestations_titre',       'Imaginer, concevoir / Rayonner.',                    'index'),
    ('experiences_titre',       'Ils racontent mon univers !',                        'index');

  -- ---- Page : a-propos ----
  insert into textes_editables (cle, valeur, page) values
    ('apropos_titre', 'Hello, je me présente !', 'a-propos'),
    (
      'apropos_p1',
      'Cléa LAUBIER, communicante passionnée de 25 ans, diplômée d''un Bachelor en Créative Communication et Digital Media, ainsi qu''un Master 2 en Management professionnel de la Communication.',
      'a-propos'
    ),
    (
      'apropos_p2',
      'Curieuse de découvrir les différents secteurs, et de relever de nouveaux défis, j''ai décidé de créer mon auto-entreprise, Utopi''C. Mon parcours m''a permis d''allier créativité et stratégie pour vous accompagner dans tous vos besoins.',
      'a-propos'
    ),
    (
      'apropos_p3',
      'Aujourd''hui, je souhaite mettre mon énergie et ma créativité au service d''une équipe et contribuer à des projets ambitieux.',
      'a-propos'
    );

  -- ---- Page : contact ----
  insert into textes_editables (cle, valeur, page) values
    ('contact_titre',     'Parlons de votre projet', 'contact'),
    ('contact_telephone', '06 98 54 69 47',          'contact'),
    ('contact_email',     'contact@utopi-c.com',     'contact');