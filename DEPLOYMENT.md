# Déploiement du portfolio — de zéro à la production

> Comment ce site ([baptiste-lelievre.fr](https://baptiste-lelievre.fr)) est passé d'un `ng new` à une infrastructure de production complète et automatisée : VPS durci, Docker, Nginx, TLS, IPv4/IPv6, playbook Ansible et déploiement continu par GitHub Actions.
>
> Ce document est la référence de fond. Pour la mise en route pas à pas d'un serveur neuf, voir `runbook-vps-ovh-debian.md`. Pour le démarrage rapide du projet Angular, voir `README.md`.
>
> Dernière mise à jour : juillet 2026.

---

## 1. Vue d'ensemble

### L'architecture, du visiteur au conteneur

```
        Développeur                          GitHub
            |                                   |
       git push main                    Actions : test -> build
            +----------------------------------->
                                                | push image
                                                v
                                    +-----------------------+
                                    |  GHCR (registre)      |
                                    |  ghcr.io/kazh-boop/... |
                                    +-----------+-----------+
                                                | SSH deploy -> docker pull
   Internet (IPv4 + IPv6)                       v
        |                              +-----------------------------+
   DNS A / AAAA                        |  VPS OVH (Debian, durci)     |
        |                              |                              |
        |   HTTPS :443 -------------->  |  Nginx (hote) — TLS, HSTS,   |
        |   HTTP  :80  --redirect301->  |  gzip, cache, reverse proxy  |
        |                              |        | proxy_pass          |
        |                              |  127.0.0.1:4000              |
        |                              |  Conteneur Docker            |
        |                              |  Node 22 - Angular SSR       |
        |                              +-----------------------------+
```

Une requête de visiteur suit ce chemin : le DNS résout `baptiste-lelievre.fr` vers l'IP du VPS (en IPv4 *ou* IPv6), la requête arrive sur Nginx en HTTPS, Nginx termine le TLS et relaie vers le conteneur Node qui écoute en local sur le port 4000, lequel rend le HTML côté serveur (SSR) et le renvoie.

Un déploiement suit un autre chemin : un `git push` sur `main` déclenche GitHub Actions, qui teste puis construit l'image Docker, la pousse sur le registre GHCR, puis se connecte en SSH au VPS pour lui faire tirer la nouvelle image et redémarrer le conteneur.

### La stack

**Application** : Angular 22 (composants standalone, signals, zoneless, nouveau control flow, SSR avec prerendering), Tailwind CSS 4, DaisyUI 5. Site bilingue FR/EN, thème clair/sombre, données mockées derrière des services prêts à basculer vers un backend.

**Infrastructure** : Docker (image multi-stage), Nginx sur l'hôte (TLS Let's Encrypt), Ansible (convergence de l'infra), GitHub Actions + GHCR (déploiement continu). Serveur OVH VPS Debian, 4 Go de RAM.

### La philosophie : deux outils, deux responsabilités

La règle qui structure tout : **le serveur ne contient aucune configuration qui n'existe pas dans un dépôt.** S'il brûle, on le réinstalle, on rejoue, il revient.

Cette règle se décline en une séparation nette :

- **Le playbook Ansible fait converger l'*infrastructure*** — durcissement SSH, réseau IPv6, pare-feu, Docker, Nginx, TLS, utilisateurs. Il est lancé *par un humain*, quand l'infra change.
- **La CI (GitHub Actions) rafraîchit l'*application*** — elle construit et déploie l'image du site. Elle est lancée *par un push*, sans jamais toucher à l'infra.

La dépendance est à sens unique : la CI suppose que l'infra existe (Docker installé, dossier de déploiement présent), l'infra ignore l'existence de la CI. Cette séparation n'est pas cosmétique : elle permet de développer intensément l'application (dizaines de déploiements) sans risquer de toucher au socle, et de reconfigurer le socle sans interrompre le service.

---

## 2. Le Dockerfile — construire une image minimale

Le `Dockerfile` (à la racine du dépôt) utilise un **build multi-stage** : deux étapes, dont seule la seconde produit l'image finale.

```dockerfile
# --- Étape 1 : build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Étape 2 : runtime ---
FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=4000
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/dist/baptiste-lelievre-portfolio ./dist
USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4000/ || exit 1
CMD ["node", "dist/server/server.mjs"]
```

Trois décisions à comprendre :

**L'ordre des `COPY` maximise le cache Docker.** On copie d'abord *seulement* les manifestes (`package.json`, `package-lock.json`) et on installe les dépendances ; ensuite on copie le code source. Docker met en cache chaque couche : tant que `package-lock.json` ne change pas, la couche `npm ci` est réutilisée telle quelle, et seul le build Angular est rejoué. Un simple changement de label ne réinstalle donc jamais les dépendances — le build passe de plusieurs minutes à quelques secondes.

**L'image finale ne contient que le résultat.** La seconde étape repart d'une image vierge et n'y copie que le dossier `dist/`. Ni le code source, ni les `node_modules` de build, ni les devDependencies ne survivent : le serveur SSR d'Angular est bundlé et autonome. Résultat : surface d'attaque et taille réduites.

**Le conteneur tourne sous un utilisateur non-root** (`app`), même principe du moindre privilège que sur le VPS, une couche plus bas. Le `HEALTHCHECK` permet à Docker de détecter un SSR planté et de le signaler comme *unhealthy*.

Le `.dockerignore` exclut du contexte de build tout ce qui n'a rien à y faire (`node_modules`, `dist`, `.git`, `ansible`, la doc), pour que le build soit rapide et reproductible.

---

## 3. Le playbook Ansible — la convergence de l'infrastructure

### Le principe fondateur : bootstrap minimal, tout le reste codifié

Ansible a besoin de SSH pour configurer une machine — y compris pour configurer SSH lui-même. Ce paradoxe de l'œuf et de la poule se résout en séparant deux mondes.

Le **bootstrap**, manuel et minimal, consiste uniquement à créer un utilisateur sudoer et à y déposer une clé publique : cinq minutes sur un serveur neuf (détaillé dans le runbook). C'est le strict nécessaire pour qu'Ansible puisse ensuite prendre le relais.

Tout le reste — durcissement SSH, pare-feu, fail2ban, réseau IPv6, Docker, application, Nginx, TLS, utilisateur de déploiement — est porté par le playbook. Conséquence pratique : une réinstallation complète du VPS coûte le bootstrap plus un `ansible-playbook site.yml -K`, soit une dizaine de minutes. La configuration n'est plus un savoir-faire fragile logé dans une seule tête, c'est un artefact reproductible et versionné.

### La structure du dépôt Ansible

```
ansible/
├── ansible.cfg              # config locale : inventaire, chemins des rôles
├── requirements.yml         # collections externes à installer
├── inventory.yml            # les machines cibles et comment s'y connecter
├── group_vars/
│   └── all.yml              # LES variables : domaine, clés, IPv6, image…
├── site.yml                 # le playbook : quelle machine reçoit quels rôles
└── roles/
    ├── hardening/           # sécurité système + utilisateurs
    ├── network/             # IPv6 statique (netplan)
    ├── docker/              # installation du moteur Docker
    ├── app/                 # déploiement de l'application
    └── nginx/               # reverse proxy + TLS
```

Cette arborescence n'est pas un choix de style : c'est **la convention Ansible**. Chaque rôle contient des sous-dossiers aux noms imposés (`tasks/`, `templates/`, `handlers/`) qu'Ansible résout automatiquement. Un `src: 51-ipv6.yaml.j2` dans une tâche est cherché dans `roles/<rôle>/templates/` sans qu'on le précise. C'est la même logique *convention over configuration* qu'un projet Angular : quiconque connaît l'outil sait où regarder.

Le fichier `site.yml` est volontairement laconique — il ne fait qu'ordonner les rôles :

```yaml
- name: Configurer et déployer le portfolio
  hosts: vps
  become: true
  roles:
    - hardening    # on sécurise avant d'exposer
    - network      # le socle réseau avant les services
    - docker       # prérequis de l'application
    - app          # prérequis du proxy (Nginx vérifie que sa cible répond)
    - nginx        # en dernier : le point d'entrée public
```

L'ordre des rôles encode des dépendances implicites, décrites en commentaires. Le `become: true` déclare l'élévation de privilèges *au niveau du play*, là où elle est nécessaire — pas globalement dans `ansible.cfg`, ce qui forcerait sudo même pour un simple `ansible vps -m ping` (voir la war story « le become trop large »).

### L'idempotence — pourquoi on peut rejouer sans peur

La propriété centrale du playbook : le rejouer sur un serveur déjà conforme ne change **rien**. Chaque tâche décrit un *état cible* (« ce paquet est présent », « ce fichier a ce contenu », « ce service tourne »), pas une action ; Ansible compare l'état réel à l'état cible et n'agit que sur l'écart.

Plusieurs mécanismes encodent des décisions réfléchies :

**Les handlers ne redémarrent un service que si nécessaire.** Une tâche qui modifie la config sshd *notifie* un handler `Restart ssh` ; celui-ci ne s'exécute que si la tâche a réellement changé quelque chose, et une seule fois même notifié plusieurs fois. Le `meta: flush_handlers` force l'exécution du handler *avant* la suite du rôle — indispensable quand on vérifie juste après que la nouvelle config est appliquée.

**Les templates Jinja2 sont l'unique source de vérité.** Le `docker-compose.yml`, la config Nginx, le drop-in sshd, la config netplan sont générés depuis `group_vars/all.yml`. Changer de domaine, d'IPv6 ou de port se fait à un seul endroit. Chaque fichier généré porte l'en-tête « Géré par Ansible — ne pas éditer à la main » : toute modification manuelle sur le serveur sera écrasée au prochain run, et c'est voulu.

**Les assertions vérifient l'*effectif*, pas l'*écrit*.** C'est le principe le plus important du playbook, né de plusieurs incidents réels. Le rôle hardening ne se contente pas de déposer le drop-in sshd : il exécute `sshd -T` (la configuration effectivement appliquée après fusion de tous les fichiers) et fait échouer le playbook si `passwordauthentication no` n'y figure pas. Le rôle network vérifie la présence d'une adresse IPv6 `scope global` puis teste un ping IPv6 sortant. Le rôle app termine par un healthcheck HTTP : le déploiement n'est déclaré réussi que si le SSR répond 200.

**Le `validate:` protège les fichiers critiques.** Le template sshd est validé par `sshd -t` avant installation ; la config netplan passe par `netplan generate` avant `netplan apply`. Sur des fichiers dont une erreur de syntaxe peut couper l'accès au serveur, on ne déploie jamais sans filet.

**`exclusive: true` sur les clés SSH : la liste fait foi.** Les clés autorisées sont déclarées dans `group_vars`, et le module `authorized_key` en mode exclusif fait converger le fichier serveur vers cette liste — ajout des manquantes, *révocation* des absentes. La gestion des accès devient une pull request : auditable, versionnée, réversible.

### Rôle par rôle

**`hardening`** codifie la sécurisation initiale (faite d'abord à la main, c'est la meilleure façon de comprendre ce qu'on automatise). SSH est verrouillé par un drop-in `/etc/ssh/sshd_config.d/00-hardening.conf` — le préfixe `00-` est essentiel : sshd applique la *première* occurrence de chaque directive et lit les drop-ins par ordre alphabétique ; un `99-` serait neutralisé par le `50-cloud-init.conf` de l'image OVH (voir la war story). UFW n'ouvre que 22/80/443 ; fail2ban lit journald (`backend = systemd`, les Debian récents n'ayant plus `/var/log/auth.log`) ; unattended-upgrades applique les patchs de sécurité. Ce rôle crée aussi l'utilisateur `deploy` de la CI (sans sudo, membre du groupe docker) et gère ses clés.

**`network`** configure l'IPv6 statique. Sur les images OVH récentes, la chaîne réseau est : cloud-init écrit du netplan -> netplan traduit en unités systemd-networkd -> networkd applique. Le rôle dépose un `/etc/netplan/51-ipv6.yaml` qui fusionne avec le `50-cloud-init.yaml` sans jamais l'éditer. Subtilité OVH : la gateway IPv6 est *hors* du sous-réseau de l'adresse, d'où la route déclarée `on-link: true`.

**`docker`** installe le moteur depuis le dépôt officiel Docker (le paquet Debian `docker.io` est en retard et n'inclut pas compose v2), et gère l'authentification au registre GHCR (voir la section CI/CD).

**`app`** crée `/opt/baptiste-lelievre-portfolio`, y dépose le `docker-compose.yml` templaté, et garantit que le conteneur tourne. Détail crucial du template : `ports: "127.0.0.1:4000:4000"`. Docker écrit directement dans iptables et **contourne UFW** — sans le préfixe `127.0.0.1`, le port serait exposé au monde entier malgré le pare-feu. Seul Nginx, sur l'hôte, doit joindre le conteneur. Le conteneur reçoit aussi la variable `NG_ALLOWED_HOSTS` (voir la war story du 400 Angular).

**`nginx`** résout le problème d'œuf et de poule du TLS : la config HTTPS référence des certificats qui n'existent pas encore, et certbot a besoin d'un serveur web sur le port 80 pour prouver la propriété du domaine. D'où trois temps : config HTTP minimale (challenge ACME) -> `certbot certonly --webroot` -> config HTTPS définitive (redirection 301, HTTP/2, HSTS, en-têtes de sécurité, gzip, cache, proxy vers le SSR). Un hook recharge Nginx après chaque renouvellement automatique du certificat.

### Politique de cache Nginx

Un point qui mérite sa sous-section car il a coûté un incident (voir « le PDF immortel »). Nginx applique deux politiques de cache opposées selon la nature de l'asset :

- **Assets fingerprintés** (les `.js`, `.css` générés par Angular, dont le nom contient un hash du contenu) : cache agressif et permanent. Le nom changeant à chaque modification, le navigateur télécharge automatiquement toute nouvelle version — aucun risque de servir du périmé.
- **Assets stables** (le CV `.pdf`, `llms.txt`, `sitemap.xml`, `ai-context.md` : URL fixe, contenu mutable) : un bloc `location` dédié ajoute `Cache-Control: no-cache`, qui force le navigateur à *revalider* auprès du serveur avant de servir sa copie. La revalidation est quasi gratuite (réponse `304 Not Modified` si rien n'a changé) et garantit la fraîcheur.

Le piège sémantique : `no-cache` ne veut pas dire « ne pas cacher » mais « revalider avant usage ». « Ne rien stocker » serait `no-store`, inutilement brutal ici.

---

## 4. La CI/CD — le déploiement continu

### Le principe : on déploie exactement ce qu'on a testé

L'image Docker est construite **une seule fois**, dans la CI, poussée sur GHCR (le registre de conteneurs de GitHub), et taguée avec le **sha du commit**. Le VPS ne compile plus jamais rien : il *tire* une image et redémarre. Cela garantit que l'artefact déployé est exactement celui qui a passé les tests, élimine les builds sur la machine de production (adieu les pics de RAM), et rend chaque déploiement traçable et réversible.

### Le flux

```
Pull request      -> test + build             (filet de sécurité, aucun déploiement)
Push sur main     -> test -> build -> push ghcr.io/kazh-boop/...:<sha> + :latest
                  -> deploy : SSH vers le VPS -> docker compose pull -> up -> healthcheck
```

Le tag `sha` (hash du commit) rend chaque image traçable jusqu'à son commit et permet un rollback (redéployer un sha précédent). Le tag `latest` est un alias mouvant : c'est lui que le `docker-compose.yml` du VPS référence.

### Le workflow

`.github/workflows/deploy.yml` définit trois jobs chaînés par `needs` :

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
env:
  IMAGE: ghcr.io/kazh-boop/portfolio

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test -- --watch=false
      - run: npm run build

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      # Commentaires sur leur propre ligne, jamais en fin de ligne dans un bloc |
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE }}:${{ github.sha }}
            ${{ env.IMAGE }}:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            set -e
            cd ${{ secrets.DEPLOY_PATH }}
            docker compose pull
            docker compose up -d
            docker image prune -f
            sleep 5
            curl -sf http://127.0.0.1:4000/ > /dev/null && echo "SSR OK" || exit 1
```

Points à comprendre :

**Le modèle mental.** Un workflow GitHub Actions est cousin d'un playbook : un job est un play, une step une tâche, `uses:` un module écrit par un tiers, `run:` l'équivalent d'un module `command`. La syntaxe `${{ ... }}` est un templating cousin de Jinja2 : `env.X` (variables), `secrets.X` / `vars.X` (coffres), `github.X` (contexte du déclenchement).

**Le contrôle de flux.** `needs:` chaîne les jobs (rien ne se déploie si les tests échouent). `if: github.ref == 'refs/heads/main'` fait qu'une pull request s'arrête après test+build : le filet de sécurité sans le déploiement. Le `needs` propage la condition aux jobs suivants.

**Les secrets et permissions.** Pousser sur GHCR ne coûte aucun secret à créer : le `GITHUB_TOKEN` automatique suffit, doté du seul droit `packages: write` (moindre privilège jusque dans la CI). Le déploiement utilise trois paramètres externes : `DEPLOY_SSH_KEY` (la clé privée de l'utilisateur `deploy`), `DEPLOY_HOST` (l'IP), `DEPLOY_PATH` (le dossier de déploiement). Aucune valeur n'est en dur dans le workflow — même discipline que le playbook avec `group_vars`.

**Le `set -e` rend le script honnête.** Sans lui, un script shell continue après une commande échouée : un `cd` raté n'interrompt pas la suite, et le healthcheck final peut valider un *ancien* conteneur survivant, affichant un faux « SSR OK » (voir la war story). `set -e` fait avorter le script à la première erreur.

### L'authentification au registre GHCR

Détail qui a coûté plusieurs itérations : la **visibilité d'un package (l'image) est indépendante de celle du dépôt (le code)**. Le dépôt est public (vitrine de code pour les recruteurs), mais l'image est **privée** — c'est le choix retenu, plus propre (on n'ouvre que ce qui doit l'être) et cohérent avec l'arrivée future du backend.

Une image privée impose au VPS de s'authentifier pour la tirer. Le mécanisme : un **Personal Access Token (classic)** à portée `read:packages` uniquement, avec lequel l'utilisateur `deploy` fait un `docker login ghcr.io` une fois. Docker stocke le credential dans son `config.json`, et le `pull` du workflow s'authentifie alors automatiquement.

Ce token est un secret *au repos sur le serveur* — acceptable, mais à noter. La version durcie le mettrait dans un GitHub Secret et referait le `docker login` dans le job deploy à chaque run. Et surtout, cette authentification doit être **codifiée** (tâche `docker_login` dans le rôle Docker/app, token en Ansible Vault) pour survivre à une réinstallation — c'est une dette technique identifiée (voir la roadmap).

### Deux drapeaux `isMock`, pas un seul

Le front distingue deux préoccupations aux cycles de vie différents, chacune avec son drapeau dans `environment.ts` :

- `isMock` (global) pilote les *données* (profil, expériences, projets) — elles restent mockées jusqu'au backend NestJS.
- `contact.isMock` pilote le *formulaire de contact* — il est réel dès aujourd'hui via le relais Web3Forms.

Cette séparation est née d'un bug (voir la war story « le drapeau à deux maîtres ») : un `isMock` global unique rendait le formulaire physiquement incapable d'envoyer, puisqu'il partageait le drapeau des données, qui doivent rester mockées. La leçon : *un drapeau de configuration doit avoir la granularité de ce qu'il contrôle*.

---

## 5. Les incidents, et ce qu'ils ont appris

Cette section est la plus précieuse du document : chaque incident est réel, et sa leçon est encodée quelque part dans la config décrite plus haut. En entretien, ces histoires valent plus qu'une liste d'outils — elles démontrent une méthode.

**1. Le drop-in fantôme (`99-` vs `00-`).** Après le durcissement SSH, le serveur acceptait toujours les mots de passe. Le fichier était bien écrit… mais silencieusement neutralisé : sshd applique la première occurrence d'une directive, et le `50-cloud-init.conf` d'OVH passait avant le `99-hardening.conf`. Diagnostic par `sshd -T` (la config effective). Leçon, devenue une assertion du playbook : **on ne vérifie jamais qu'une config est écrite, on vérifie qu'elle est appliquée.**

**2. Le blocage silencieux du clone git.** Le playbook restait suspendu sans erreur sur la tâche de clone : le dépôt était privé, git posait une question d'authentification à laquelle personne ne pouvait répondre en session non interactive. Un blocage Ansible est presque toujours un prompt invisible côté distant. Résolution : dépôt public, et le réflexe `-vvv` pour voir où ça coince.

**3. Le `become` trop large.** Un simple `ansible vps -m ping` réclamait le mot de passe sudo : `become = True` était déclaré globalement dans `ansible.cfg`. Leçon : **déclarer l'escalade de privilèges au niveau le plus bas qui la nécessite** — ici, le play, pas la config globale.

**4. Le 400 d'Angular 22 (`NG_ALLOWED_HOSTS`).** Conteneur démarré, réseau OK, mais le healthcheck recevait un 400 signé Express. Les versions récentes d'Angular valident strictement le header `Host` côté SSR (protection contre le DNS rebinding) : `127.0.0.1` n'était pas autorisé. Diagnostic dans `docker logs`. Correctif : la variable `NG_ALLOWED_HOSTS` listant *tous* les chemins d'accès légitimes (adresses locales pour les healthchecks, domaine pour les requêtes transmises par Nginx). Vivre sur les toutes dernières versions, c'est essuyer les plâtres.

**5. L'IPv6 fantôme (le AAAA menteur).** Le site fonctionnait à la maison mais pas en 4G ni au travail. Première question d'un diagnostic de disponibilité : *cassé pour qui ?* Les réseaux mobiles français sont largement IPv6-first ; le DNS publiait un enregistrement AAAA vers une adresse IPv6 attribuée par OVH mais jamais configurée sur l'interface (seule une `fe80::` link-local était présente). Une box dual-stack se rabat silencieusement sur l'IPv4 ; un mobile IPv6-only tombe dans le vide. Correctif immédiat : dépublier le AAAA (**on ne publie que ce qu'on sert**). Correctif complet : le rôle `network`. Leçon bonus : « ça marche chez moi » ne teste qu'un chemin réseau — `curl -4` et `curl -6` font désormais partie de la checklist.

**6. Le `.yml` silencieux.** Le rôle network déposait sa config, `netplan apply` s'exécutait sans erreur, et l'adresse n'apparaissait pas. Inspection maillon par maillon de la chaîne (fichier -> fusion netplan -> unités networkd -> interface) : la fusion ignorait le fichier, car netplan ne lit que l'extension `.yaml` — un `.yml` est ignoré **sans le moindre warning**. La pire espèce de bug : l'échec silencieux. C'est l'assertion `scope global` du rôle qui l'a détecté.

**7. Le StrictModes.** L'utilisateur `deploy` ne pouvait pas se connecter malgré une clé correcte, avec un `Permission denied (publickey)` trompeur. Cause : `authorized_keys` et son dossier `.ssh`, créés avec `sudo` par `baptiste`, appartenaient à root. Or `StrictModes yes` (visible dans `sshd -T`) fait refuser à sshd un `authorized_keys` que l'utilisateur ne possède pas. Correctif : `chown -R deploy:deploy /home/deploy/.ssh`. Encore un échec quasi silencieux, dont la vraie raison n'apparaît que dans `journalctl -u ssh`.

**8. Le drapeau à deux maîtres.** Le formulaire de contact affichait un succès sans jamais envoyer d'email, et l'onglet Network ne montrait aucune requête. Cause : un `isMock` global unique, partagé entre les données (qui doivent rester mockées) et le contact (qui doit être réel) — le formulaire prenait donc systématiquement le chemin « simulation ». Correctif : un drapeau par préoccupation (`isMock` et `contact.isMock`). Leçon : *un drapeau doit avoir la granularité de ce qu'il contrôle.*

**9. Le PDF immortel.** Le CV modifié s'affichait dans son ancienne version, sauf en navigation privée. Diagnostic en un test (privé = cache vierge) : problème de cache navigateur. Les assets Angular n'avaient jamais ce souci grâce au fingerprinting (nom = hash du contenu) ; le PDF, sous URL fixe, était caché sans consigne de revalidation. Correctif : un `Cache-Control: no-cache` sur les assets stables. Leçon : *les assets stables sous URL fixe ont besoin d'une politique de revalidation explicite.*

**10. Le pipeline aux cinq maillons.** Le premier déploiement continu a enchaîné cinq bugs distincts, débuggés un par un : (a) un commentaire de fin de ligne aspiré dans un tag Docker (dans un bloc YAML `|`, tout est littéral, `#` compris) ; (b) le dossier de déploiement au mauvais nom (`portfolio` générique vs `baptiste-lelievre-portfolio` réel), corrigé via un paramètre externe et non en dur ; (c) un healthcheck menteur validant l'ancien conteneur, corrigé par `set -e` ; (d) un `denied` GHCR à cause d'une image privée exigeant l'authentification du VPS ; (e) et surtout la révélation finale — **repo public != package public**, deux objets aux réglages de visibilité indépendants. Diagnostic clé : un `curl` sur l'API de token GHCR pour tester la visibilité réelle, indépendamment du workflow. Leçon transversale : *on isole chaque maillon et on vérifie l'effectif à la source, on ne spécule pas sur la chaîne entière.*

---

## 6. Le workflow au quotidien

Déployer une modification tient en une commande depuis la machine de développement (WSL2 sous Windows, le nœud de contrôle Ansible devant être Linux) :

```bash
git push
```

C'est tout. GitHub Actions teste, construit, pousse l'image et déploie. Le contrat de maintenance qui va avec : toute modification de contenu met à jour, dans le même commit, les données mockées, les fichiers `llms.txt` / `ai-context.md`, et le `lastmod` du `sitemap.xml`.

Pour reconfigurer l'infrastructure (rare), le playbook :

```bash
cd ansible && ansible-playbook site.yml -K
```

Commandes d'exploitation utiles :

```bash
docker logs -f baptiste-lelievre-portfolio        # logs du SSR
curl -4 -I https://baptiste-lelievre.fr           # tester le chemin IPv4
curl -6 -I https://baptiste-lelievre.fr           # tester le chemin IPv6
sudo certbot renew --dry-run                       # tester le renouvellement TLS
sudo fail2ban-client status sshd                   # bannissements en cours
```

---

## 7. Comment cette infrastructure va évoluer

Le socle actuel est pensé pour grandir. Les chantiers, dans l'ordre envisagé, avec la logique de chacun.

**Supervision (prochain chantier).** Un uptime checker externe d'abord — le serveur ne peut pas signaler sa propre mort, il faut un observateur extérieur qui alerte en cas de coupure (cinq minutes à mettre en place, grande valeur). Prometheus + Grafana ensuite, en option d'apprentissage, pour observer ce qui se passe *dans* la machine (métriques CPU, latence, requêtes).

**Backend NestJS + PostgreSQL.** Le gros morceau. Le contrat d'API est déjà écrit (`ai-context.md`) et le front prêt à basculer (`isMock: false`). Premier vrai cas d'usage : persister les messages du formulaire de contact (reprendre la main sur le relais Web3Forms). Côté infra : un second service dans le compose (publié sur 127.0.0.1), une base de données (qui pose la première vraie question de persistance : volumes Docker, sauvegardes), une `location /api/` dans Nginx. Choix acté : PostgreSQL (aligné avec le marché et l'expérience existante).

**Page d'administration (CMS + dashboard).** La destination qui donne son sens au backend : une interface protégée pour éditer le contenu du site (CMS) et consulter les messages reçus (dashboard). Elle introduit l'**authentification** de bout en bout (JWT, guards Angular, middleware NestJS) — le sujet que le portfolio n'a jamais abordé et que toute application réelle exige. À construire dans l'ordre : backend + base -> auth -> page admin qui consomme le tout.

**Ansible Vault.** Le jour du backend, un mot de passe de base de données et le token GHCR de déploiement apparaîtront. Ils seront chiffrés avec `ansible-vault` : versionnés mais illisibles sans la clé de coffre. Premier usage réel de Vault, à introduire quand des secrets existent — pas avant.

**Dettes techniques identifiées.** Deux, à ne pas oublier : (1) le `docker login` GHCR sur le VPS est manuel et doit être codifié dans le playbook (avec le token en Vault) ; (2) vérifier que le `set -e` reste en tête du script de déploiement, sous peine de futurs faux « SSR OK ».

**Raffinements ultérieurs.** Un environnement de *staging* (la structure `group_vars` est déjà prête : un second hôte, un fichier de variables par groupe, le même playbook) ; des tests d'infrastructure avec *Molecule* (tester les rôles dans des conteneurs jetables) ; le *zero-downtime deployment* (deux conteneurs et bascule Nginx) — quelques secondes de coupure par déploiement restant acceptables pour un portfolio.

---

*Ce document fait partie du dépôt du portfolio : la configuration décrite ici est celle, réelle et versionnée, qui fait tourner le site.*
