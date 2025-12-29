"""
Application principale FastAPI - Gestion des Demandes de Crédit PAMF
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.config import get_settings
from app.database import init_db
from app.api import api_router

# Configuration
settings = get_settings()

# Logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    # Startup
    logger.info("🚀 Démarrage de l'application...")
    
    # Créer les dossiers nécessaires
    Path("logs").mkdir(exist_ok=True)
    Path("uploads").mkdir(exist_ok=True)
    Path("static").mkdir(exist_ok=True)
    
    # Initialiser la base de données
    init_db()
    logger.info("✅ Base de données initialisée")
    
    yield
    
    # Shutdown
    logger.info("👋 Arrêt de l'application...")


# Créer l'application FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## Application de Gestion des Demandes de Crédit
    
    Cette application permet de dématérialiser le processus de gestion des demandes de prêt.
    
    ### Fonctionnalités principales:
    - 📋 Gestion des clients et leurs informations
    - 💰 Création et suivi des demandes de prêt
    - 📊 Analyse financière et calcul des ratios
    - ✅ Workflow de validation (AC → Risk Officer → Chef d'Agence → Comité)
    - 🔗 Intégration avec le Core Banking System (CBS Oracle)
    
    ### Workflow de validation:
    1. **Saisie de la demande** - Agent de crédit
    2. **Visite de validation** - Agent terrain
    3. **Analyse financière** - Calcul automatique des ratios
    4. **Recommandation AC** - Agent de crédit
    5. **Avis Risk Officer** - Contrôle des risques
    6. **Avis Chef d'Agence** - Validation hiérarchique
    7. **Décision Comité** - Approbation finale
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS pour permettre les appels depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les origines autorisées
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monter les fichiers statiques
static_path = Path(__file__).parent.parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Templates Jinja2
templates_path = Path(__file__).parent.parent / "templates"
templates = Jinja2Templates(directory=str(templates_path)) if templates_path.exists() else None

# Inclure les routes API
app.include_router(api_router, prefix="/api/v1")


# Routes pour l'interface web
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Page d'accueil"""
    if templates:
        return templates.TemplateResponse("index.html", {"request": request})
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>PAMF - Gestion des Crédits</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="app" class="min-h-screen">
            <nav class="bg-blue-800 text-white p-4 shadow-lg">
                <div class="container mx-auto flex justify-between items-center">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-university mr-2"></i>
                        PAMF - Gestion des Crédits
                    </h1>
                    <div class="space-x-4">
                        <a href="/app/dashboard" class="hover:text-blue-200">
                            <i class="fas fa-chart-line mr-1"></i> Tableau de bord
                        </a>
                        <a href="/app/clients" class="hover:text-blue-200">
                            <i class="fas fa-users mr-1"></i> Clients
                        </a>
                        <a href="/app/demandes" class="hover:text-blue-200">
                            <i class="fas fa-file-alt mr-1"></i> Demandes
                        </a>
                        <a href="/docs" class="hover:text-blue-200">
                            <i class="fas fa-book mr-1"></i> API Docs
                        </a>
                    </div>
                </div>
            </nav>
            
            <main class="container mx-auto p-8">
                <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">
                        Bienvenue sur la plateforme de gestion des crédits
                    </h2>
                    <p class="text-gray-600 mb-6">
                        Cette application vous permet de gérer l'ensemble du processus de demande de crédit,
                        de la création du dossier client jusqu'à la décision du comité.
                    </p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <a href="/app/clients/nouveau" class="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                            <i class="fas fa-user-plus text-4xl text-blue-600 mb-4"></i>
                            <h3 class="text-xl font-semibold text-gray-800">Nouveau Client</h3>
                            <p class="text-gray-600">Enregistrer un nouveau client dans le système</p>
                        </a>
                        
                        <a href="/app/demandes/nouvelle" class="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition">
                            <i class="fas fa-plus-circle text-4xl text-green-600 mb-4"></i>
                            <h3 class="text-xl font-semibold text-gray-800">Nouvelle Demande</h3>
                            <p class="text-gray-600">Créer une nouvelle demande de prêt</p>
                        </a>
                        
                        <a href="/app/dashboard" class="block p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                            <i class="fas fa-chart-pie text-4xl text-purple-600 mb-4"></i>
                            <h3 class="text-xl font-semibold text-gray-800">Tableau de Bord</h3>
                            <p class="text-gray-600">Voir les statistiques et indicateurs</p>
                        </a>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-info-circle mr-2 text-blue-600"></i>
                        Accès API
                    </h3>
                    <p class="text-gray-600 mb-4">
                        L'API REST est disponible pour l'intégration avec d'autres systèmes.
                    </p>
                    <div class="flex space-x-4">
                        <a href="/docs" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            <i class="fas fa-book mr-2"></i>Documentation Swagger
                        </a>
                        <a href="/redoc" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                            <i class="fas fa-file-alt mr-2"></i>Documentation ReDoc
                        </a>
                    </div>
                </div>
            </main>
            
            <footer class="bg-gray-800 text-white p-4 mt-8">
                <div class="container mx-auto text-center">
                    <p>&copy; 2025 PAMF - Première Agence de Microfinance West Africa</p>
                    <p class="text-sm text-gray-400">Version """ + settings.APP_VERSION + """</p>
                </div>
            </footer>
        </div>
    </body>
    </html>
    """)


@app.get("/app/{page:path}", response_class=HTMLResponse)
async def app_pages(request: Request, page: str):
    """Routes pour les pages de l'application"""
    return HTMLResponse(content=get_app_html(page))


def get_app_html(page: str) -> str:
    """Génère le HTML pour les différentes pages"""
    
    base_template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <title>PAMF - {title}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body class="bg-gray-100" x-data="app()">
        <!-- Navigation -->
        <nav class="bg-blue-800 text-white p-4 shadow-lg">
            <div class="container mx-auto flex justify-between items-center">
                <a href="/" class="text-2xl font-bold">
                    <i class="fas fa-university mr-2"></i>
                    PAMF
                </a>
                <div class="space-x-4">
                    <a href="/app/dashboard" class="hover:text-blue-200 px-3 py-2 rounded {nav_dashboard}">
                        <i class="fas fa-chart-line mr-1"></i> Tableau de bord
                    </a>
                    <a href="/app/clients" class="hover:text-blue-200 px-3 py-2 rounded {nav_clients}">
                        <i class="fas fa-users mr-1"></i> Clients
                    </a>
                    <a href="/app/demandes" class="hover:text-blue-200 px-3 py-2 rounded {nav_demandes}">
                        <i class="fas fa-file-alt mr-1"></i> Demandes
                    </a>
                </div>
            </div>
        </nav>
        
        <main class="container mx-auto p-6">
            {content}
        </main>
        
        <script>
        function app() {{
            return {{
                loading: false,
                error: null,
                
                async fetchAPI(url, options = {{}}) {{
                    this.loading = true;
                    this.error = null;
                    try {{
                        const response = await fetch('/api/v1' + url, {{
                            headers: {{'Content-Type': 'application/json'}},
                            ...options
                        }});
                        if (!response.ok) throw new Error('Erreur API');
                        return await response.json();
                    }} catch (e) {{
                        this.error = e.message;
                        return null;
                    }} finally {{
                        this.loading = false;
                    }}
                }},
                
                formatMontant(montant) {{
                    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
                }},
                
                formatDate(date) {{
                    return new Date(date).toLocaleDateString('fr-FR');
                }}
            }}
        }}
        </script>
        {scripts}
    </body>
    </html>
    """
    
    pages = {
        "dashboard": {
            "title": "Tableau de Bord",
            "nav": {"dashboard": "bg-blue-900", "clients": "", "demandes": ""},
            "content": get_dashboard_content(),
            "scripts": get_dashboard_scripts()
        },
        "clients": {
            "title": "Gestion des Clients",
            "nav": {"dashboard": "", "clients": "bg-blue-900", "demandes": ""},
            "content": get_clients_content(),
            "scripts": get_clients_scripts()
        },
        "clients/nouveau": {
            "title": "Nouveau Client",
            "nav": {"dashboard": "", "clients": "bg-blue-900", "demandes": ""},
            "content": get_new_client_content(),
            "scripts": get_new_client_scripts()
        },
        "demandes": {
            "title": "Demandes de Prêt",
            "nav": {"dashboard": "", "clients": "", "demandes": "bg-blue-900"},
            "content": get_demandes_content(),
            "scripts": get_demandes_scripts()
        },
        "demandes/nouvelle": {
            "title": "Nouvelle Demande",
            "nav": {"dashboard": "", "clients": "", "demandes": "bg-blue-900"},
            "content": get_new_demande_content(),
            "scripts": get_new_demande_scripts()
        }
    }
    
    config = pages.get(page, pages["dashboard"])
    
    return base_template.format(
        title=config["title"],
        nav_dashboard=config["nav"]["dashboard"],
        nav_clients=config["nav"]["clients"],
        nav_demandes=config["nav"]["demandes"],
        content=config["content"],
        scripts=config["scripts"]
    )


def get_dashboard_content():
    return """
    <h1 class="text-3xl font-bold text-gray-800 mb-6">
        <i class="fas fa-chart-line mr-2 text-blue-600"></i>
        Tableau de Bord
    </h1>
    
    <div x-data="dashboardData()" x-init="loadStats()">
        <!-- Cartes statistiques -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-blue-100 rounded-full">
                        <i class="fas fa-users text-blue-600 text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Total Clients</p>
                        <p class="text-2xl font-bold" x-text="stats.clients?.total || 0"></p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-green-100 rounded-full">
                        <i class="fas fa-file-alt text-green-600 text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Demandes en cours</p>
                        <p class="text-2xl font-bold" x-text="stats.demandes?.en_cours || 0"></p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-purple-100 rounded-full">
                        <i class="fas fa-check-circle text-purple-600 text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Taux d'approbation</p>
                        <p class="text-2xl font-bold" x-text="(stats.demandes?.taux_approbation || 0) + '%'"></p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-yellow-100 rounded-full">
                        <i class="fas fa-coins text-yellow-600 text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Montant approuvé</p>
                        <p class="text-xl font-bold" x-text="formatMontant(stats.montants?.total_approuve || 0)"></p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Alertes -->
        <div class="bg-white rounded-lg shadow p-6 mb-8" x-show="alertes.length > 0">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-bell mr-2 text-orange-500"></i>
                Alertes
            </h2>
            <template x-for="alerte in alertes">
                <div class="flex items-center p-3 mb-2 rounded" 
                     :class="alerte.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'">
                    <i class="fas" :class="alerte.type === 'warning' ? 'fa-exclamation-triangle text-yellow-600' : 'fa-info-circle text-blue-600'"></i>
                    <span class="ml-3" x-text="alerte.message"></span>
                </div>
            </template>
        </div>
        
        <!-- Demandes récentes -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-clock mr-2 text-blue-600"></i>
                Demandes Récentes
            </h2>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">N° Demande</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Montant</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Statut</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template x-for="demande in demandesRecentes">
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-3 text-blue-600 font-medium" x-text="demande.numero"></td>
                                <td class="px-4 py-3" x-text="formatMontant(demande.montant)"></td>
                                <td class="px-4 py-3">
                                    <span class="px-2 py-1 rounded text-xs" 
                                          :class="getStatutClass(demande.statut)"
                                          x-text="demande.statut"></span>
                                </td>
                                <td class="px-4 py-3 text-gray-600" x-text="formatDate(demande.date)"></td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    """


def get_dashboard_scripts():
    return """
    <script>
    function dashboardData() {
        return {
            stats: {},
            alertes: [],
            demandesRecentes: [],
            
            async loadStats() {
                const stats = await this.fetchAPI('/dashboard/statistiques');
                if (stats) this.stats = stats;
                
                const alertes = await this.fetchAPI('/dashboard/alertes');
                if (alertes) this.alertes = alertes;
                
                const demandes = await this.fetchAPI('/dashboard/demandes-recentes?limit=5');
                if (demandes) this.demandesRecentes = demandes;
            },
            
            getStatutClass(statut) {
                const classes = {
                    'Brouillon': 'bg-gray-200 text-gray-700',
                    'Soumise': 'bg-blue-200 text-blue-700',
                    'En Analyse': 'bg-yellow-200 text-yellow-700',
                    'Approuvée': 'bg-green-200 text-green-700',
                    'Refusée': 'bg-red-200 text-red-700'
                };
                return classes[statut] || 'bg-gray-200 text-gray-700';
            },
            
            formatMontant(montant) {
                return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
            },
            
            formatDate(date) {
                return new Date(date).toLocaleDateString('fr-FR');
            },
            
            async fetchAPI(url) {
                try {
                    const response = await fetch('/api/v1' + url);
                    return await response.json();
                } catch (e) {
                    console.error(e);
                    return null;
                }
            }
        }
    }
    </script>
    """


def get_clients_content():
    return """
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-users mr-2 text-blue-600"></i>
            Gestion des Clients
        </h1>
        <a href="/app/clients/nouveau" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i>Nouveau Client
        </a>
    </div>
    
    <div x-data="clientsData()" x-init="loadClients()">
        <!-- Recherche -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
            <div class="flex gap-4">
                <input type="text" x-model="search" @input.debounce.300ms="loadClients()"
                       placeholder="Rechercher par nom, numéro, téléphone..."
                       class="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                <select x-model="agenceFilter" @change="loadClients()" class="px-4 py-2 border rounded">
                    <option value="">Toutes les agences</option>
                    <template x-for="agence in agences">
                        <option :value="agence" x-text="agence"></option>
                    </template>
                </select>
            </div>
        </div>
        
        <!-- Liste des clients -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">N° Client</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nom & Prénom</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Téléphone</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Agence</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="client in clients">
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-3 font-medium text-blue-600" x-text="client.numero_client"></td>
                            <td class="px-4 py-3" x-text="client.nom + ' ' + client.prenom"></td>
                            <td class="px-4 py-3" x-text="client.cellulaire"></td>
                            <td class="px-4 py-3" x-text="client.agence"></td>
                            <td class="px-4 py-3">
                                <button @click="viewClient(client.id)" class="text-blue-600 hover:text-blue-800 mr-2">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <a :href="'/app/demandes/nouvelle?client=' + client.id" class="text-green-600 hover:text-green-800">
                                    <i class="fas fa-plus-circle"></i>
                                </a>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
            
            <!-- Pagination -->
            <div class="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <span class="text-sm text-gray-600">
                    Total: <span x-text="total"></span> clients
                </span>
                <div class="flex gap-2">
                    <button @click="prevPage()" :disabled="page <= 1" 
                            class="px-3 py-1 border rounded disabled:opacity-50">Précédent</button>
                    <span class="px-3 py-1" x-text="page + '/' + pages"></span>
                    <button @click="nextPage()" :disabled="page >= pages"
                            class="px-3 py-1 border rounded disabled:opacity-50">Suivant</button>
                </div>
            </div>
        </div>
    </div>
    """


def get_clients_scripts():
    return """
    <script>
    function clientsData() {
        return {
            clients: [],
            agences: [],
            search: '',
            agenceFilter: '',
            page: 1,
            total: 0,
            pages: 1,
            
            async loadClients() {
                let url = `/clients?page=${this.page}&size=20`;
                if (this.search) url += `&query=${this.search}`;
                if (this.agenceFilter) url += `&agence=${this.agenceFilter}`;
                
                const data = await this.fetchAPI(url);
                if (data) {
                    this.clients = data.items;
                    this.total = data.total;
                    this.pages = data.pages;
                }
                
                // Charger les agences
                const agences = await this.fetchAPI('/clients/agences');
                if (agences) this.agences = agences;
            },
            
            prevPage() {
                if (this.page > 1) {
                    this.page--;
                    this.loadClients();
                }
            },
            
            nextPage() {
                if (this.page < this.pages) {
                    this.page++;
                    this.loadClients();
                }
            },
            
            viewClient(id) {
                window.location.href = '/app/clients/' + id;
            },
            
            async fetchAPI(url) {
                try {
                    const response = await fetch('/api/v1' + url);
                    return await response.json();
                } catch (e) {
                    console.error(e);
                    return null;
                }
            }
        }
    }
    </script>
    """


def get_new_client_content():
    return """
    <h1 class="text-3xl font-bold text-gray-800 mb-6">
        <i class="fas fa-user-plus mr-2 text-blue-600"></i>
        Nouveau Client
    </h1>
    
    <div x-data="newClientForm()" class="bg-white rounded-lg shadow p-6">
        <form @submit.prevent="submitForm()">
            <!-- Étapes -->
            <div class="flex mb-8">
                <template x-for="(step, index) in steps">
                    <div class="flex-1 text-center">
                        <div class="w-10 h-10 mx-auto rounded-full flex items-center justify-center"
                             :class="currentStep >= index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'">
                            <span x-text="index + 1"></span>
                        </div>
                        <p class="text-sm mt-2" :class="currentStep >= index + 1 ? 'text-blue-600 font-medium' : 'text-gray-500'" 
                           x-text="step"></p>
                    </div>
                </template>
            </div>
            
            <!-- Étape 1: Informations personnelles -->
            <div x-show="currentStep === 1">
                <h2 class="text-xl font-semibold mb-4">Informations Personnelles</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input type="text" x-model="form.nom" required
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                        <input type="text" x-model="form.prenom" required
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <input type="date" x-model="form.date_naissance"
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sexe *</label>
                        <select x-model="form.sexe" required
                                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                            <option value="">Sélectionner</option>
                            <option value="M">Masculin</option>
                            <option value="F">Féminin</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Type pièce d'identité *</label>
                        <select x-model="form.type_piece_identite" required
                                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                            <option value="CNIB">CNIB</option>
                            <option value="Passeport">Passeport</option>
                            <option value="Carte Consulaire">Carte Consulaire</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">N° Pièce d'identité *</label>
                        <input type="text" x-model="form.numero_piece_identite" required
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
            </div>
            
            <!-- Étape 2: Coordonnées -->
            <div x-show="currentStep === 2">
                <h2 class="text-xl font-semibold mb-4">Coordonnées</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                        <input type="text" x-model="form.adresse" required
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone mobile *</label>
                        <input type="tel" x-model="form.cellulaire" required
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone fixe</label>
                        <input type="tel" x-model="form.telephone_fixe"
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Agence *</label>
                        <input type="text" x-model="form.agence" required
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">État civil</label>
                        <select x-model="form.etat_civil"
                                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                            <option value="">Sélectionner</option>
                            <option value="Marié(e)">Marié(e)</option>
                            <option value="Célibataire">Célibataire</option>
                            <option value="Divorcé(e)">Divorcé(e)</option>
                            <option value="Veuf/Veuve">Veuf/Veuve</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Étape 3: Activité -->
            <div x-show="currentStep === 3">
                <h2 class="text-xl font-semibold mb-4">Activité Professionnelle</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                        <input type="text" x-model="form.profession"
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                        <input type="text" x-model="form.nom_entreprise"
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                        <select x-model="form.secteur_activite"
                                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                            <option value="">Sélectionner</option>
                            <option value="Production">Production</option>
                            <option value="Service">Service</option>
                            <option value="Commerce">Commerce</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Adresse de l'activité</label>
                        <input type="text" x-model="form.adresse_activite"
                               class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description de l'activité</label>
                        <textarea x-model="form.activite_principale" rows="3"
                                  class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                </div>
            </div>
            
            <!-- Boutons de navigation -->
            <div class="flex justify-between mt-8">
                <button type="button" @click="prevStep()" x-show="currentStep > 1"
                        class="px-4 py-2 border rounded hover:bg-gray-100">
                    <i class="fas fa-arrow-left mr-2"></i>Précédent
                </button>
                <div></div>
                <button type="button" @click="nextStep()" x-show="currentStep < 3"
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Suivant<i class="fas fa-arrow-right ml-2"></i>
                </button>
                <button type="submit" x-show="currentStep === 3"
                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    <i class="fas fa-save mr-2"></i>Enregistrer
                </button>
            </div>
        </form>
        
        <!-- Message de succès/erreur -->
        <div x-show="message" class="mt-4 p-4 rounded" :class="success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
            <span x-text="message"></span>
        </div>
    </div>
    """


def get_new_client_scripts():
    return """
    <script>
    function newClientForm() {
        return {
            currentStep: 1,
            steps: ['Informations', 'Coordonnées', 'Activité'],
            form: {
                nom: '',
                prenom: '',
                date_naissance: '',
                sexe: '',
                type_piece_identite: 'CNIB',
                numero_piece_identite: '',
                adresse: '',
                cellulaire: '',
                telephone_fixe: '',
                agence: '',
                etat_civil: '',
                profession: '',
                nom_entreprise: '',
                secteur_activite: '',
                adresse_activite: '',
                activite_principale: ''
            },
            message: '',
            success: false,
            
            nextStep() {
                if (this.currentStep < 3) this.currentStep++;
            },
            
            prevStep() {
                if (this.currentStep > 1) this.currentStep--;
            },
            
            async submitForm() {
                try {
                    const response = await fetch('/api/v1/clients/', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(this.form)
                    });
                    
                    if (response.ok) {
                        const client = await response.json();
                        this.success = true;
                        this.message = 'Client créé avec succès! N° ' + client.numero_client;
                        setTimeout(() => {
                            window.location.href = '/app/clients';
                        }, 2000);
                    } else {
                        const error = await response.json();
                        this.success = false;
                        this.message = 'Erreur: ' + (error.detail || 'Erreur inconnue');
                    }
                } catch (e) {
                    this.success = false;
                    this.message = 'Erreur de connexion';
                }
            }
        }
    }
    </script>
    """


def get_demandes_content():
    return """
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">
            <i class="fas fa-file-alt mr-2 text-blue-600"></i>
            Demandes de Prêt
        </h1>
        <a href="/app/demandes/nouvelle" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>Nouvelle Demande
        </a>
    </div>
    
    <div x-data="demandesData()" x-init="loadDemandes()">
        <!-- Filtres -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
            <div class="flex gap-4">
                <input type="text" x-model="search" @input.debounce.300ms="loadDemandes()"
                       placeholder="Rechercher..."
                       class="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                <select x-model="statutFilter" @change="loadDemandes()" class="px-4 py-2 border rounded">
                    <option value="">Tous les statuts</option>
                    <option value="Brouillon">Brouillon</option>
                    <option value="Soumise">Soumise</option>
                    <option value="En Analyse">En Analyse</option>
                    <option value="En Comité">En Comité</option>
                    <option value="Approuvée">Approuvée</option>
                    <option value="Refusée">Refusée</option>
                </select>
            </div>
        </div>
        
        <!-- Liste des demandes -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">N° Demande</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Montant</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Durée</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Statut</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="demande in demandes">
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-3 font-medium text-blue-600" x-text="demande.numero_demande"></td>
                            <td class="px-4 py-3" x-text="formatMontant(demande.montant_sollicite)"></td>
                            <td class="px-4 py-3" x-text="demande.duree_mois + ' mois'"></td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 rounded text-xs" 
                                      :class="getStatutClass(demande.statut)"
                                      x-text="demande.statut"></span>
                            </td>
                            <td class="px-4 py-3 text-gray-600" x-text="formatDate(demande.date_demande)"></td>
                            <td class="px-4 py-3 space-x-2">
                                <button @click="viewDemande(demande.id)" class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button @click="editDemande(demande.id)" class="text-green-600 hover:text-green-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
            
            <div class="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <span class="text-sm text-gray-600">Total: <span x-text="total"></span> demandes</span>
                <div class="flex gap-2">
                    <button @click="prevPage()" :disabled="page <= 1" 
                            class="px-3 py-1 border rounded disabled:opacity-50">Précédent</button>
                    <span class="px-3 py-1" x-text="page + '/' + pages"></span>
                    <button @click="nextPage()" :disabled="page >= pages"
                            class="px-3 py-1 border rounded disabled:opacity-50">Suivant</button>
                </div>
            </div>
        </div>
    </div>
    """


def get_demandes_scripts():
    return """
    <script>
    function demandesData() {
        return {
            demandes: [],
            search: '',
            statutFilter: '',
            page: 1,
            total: 0,
            pages: 1,
            
            async loadDemandes() {
                let url = `/demandes?page=${this.page}&size=20`;
                if (this.search) url += `&query=${this.search}`;
                if (this.statutFilter) url += `&statut=${this.statutFilter}`;
                
                const data = await this.fetchAPI(url);
                if (data) {
                    this.demandes = data.items;
                    this.total = data.total;
                    this.pages = data.pages;
                }
            },
            
            prevPage() { if (this.page > 1) { this.page--; this.loadDemandes(); } },
            nextPage() { if (this.page < this.pages) { this.page++; this.loadDemandes(); } },
            
            viewDemande(id) { window.location.href = '/app/demandes/' + id; },
            editDemande(id) { window.location.href = '/app/demandes/' + id + '/edit'; },
            
            getStatutClass(statut) {
                const classes = {
                    'Brouillon': 'bg-gray-200 text-gray-700',
                    'Soumise': 'bg-blue-200 text-blue-700',
                    'En Analyse': 'bg-yellow-200 text-yellow-700',
                    'Approuvée': 'bg-green-200 text-green-700',
                    'Refusée': 'bg-red-200 text-red-700'
                };
                return classes[statut] || 'bg-gray-200 text-gray-700';
            },
            
            formatMontant(m) { return new Intl.NumberFormat('fr-FR').format(m) + ' FCFA'; },
            formatDate(d) { return new Date(d).toLocaleDateString('fr-FR'); },
            
            async fetchAPI(url) {
                try {
                    const response = await fetch('/api/v1' + url);
                    return await response.json();
                } catch (e) { return null; }
            }
        }
    }
    </script>
    """


def get_new_demande_content():
    return """
    <h1 class="text-3xl font-bold text-gray-800 mb-6">
        <i class="fas fa-plus-circle mr-2 text-green-600"></i>
        Nouvelle Demande de Prêt
    </h1>
    
    <div x-data="newDemandeForm()" class="bg-white rounded-lg shadow p-6">
        <form @submit.prevent="submitForm()">
            <div class="grid grid-cols-2 gap-6">
                <!-- Client -->
                <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                    <select x-model="form.client_id" required @change="loadClientInfo()"
                            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                        <option value="">Sélectionner un client</option>
                        <template x-for="client in clients">
                            <option :value="client.id" x-text="client.numero_client + ' - ' + client.nom + ' ' + client.prenom"></option>
                        </template>
                    </select>
                </div>
                
                <!-- Montant -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Montant sollicité (FCFA) *</label>
                    <input type="number" x-model="form.montant_sollicite" required min="50000"
                           class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- Durée -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Durée (mois) *</label>
                    <input type="number" x-model="form.duree_mois" required min="1" max="120"
                           class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- Périodicité -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Périodicité *</label>
                    <select x-model="form.periodicite" required
                            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                        <option value="Mensuel">Mensuel</option>
                        <option value="Trimestriel">Trimestriel</option>
                        <option value="Semestriel">Semestriel</option>
                        <option value="Annuel">Annuel</option>
                    </select>
                </div>
                
                <!-- Type crédit -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type de crédit</label>
                    <select x-model="form.type_credit"
                            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                        <option value="Fonds de Roulement">Fonds de Roulement</option>
                        <option value="Investissement">Investissement</option>
                        <option value="Équipement">Équipement</option>
                    </select>
                </div>
                
                <!-- Taux -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Taux d'intérêt (%)</label>
                    <input type="number" x-model="form.taux_interet" step="0.01" min="0" max="100"
                           class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
                </div>
                
                <!-- Objet -->
                <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Objet du crédit *</label>
                    <textarea x-model="form.objet_credit" required rows="4"
                              placeholder="Décrivez l'objet du crédit en détail..."
                              class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
            </div>
            
            <!-- Calcul préliminaire -->
            <div class="mt-6 p-4 bg-blue-50 rounded" x-show="form.montant_sollicite && form.duree_mois">
                <h3 class="font-semibold text-blue-800 mb-2">Estimation</h3>
                <p class="text-blue-700">
                    Mensualité estimée: <span class="font-bold" x-text="formatMontant(calculerMensualite())"></span>
                </p>
            </div>
            
            <div class="mt-6 flex justify-end space-x-4">
                <a href="/app/demandes" class="px-4 py-2 border rounded hover:bg-gray-100">Annuler</a>
                <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    <i class="fas fa-save mr-2"></i>Créer la demande
                </button>
            </div>
        </form>
        
        <div x-show="message" class="mt-4 p-4 rounded" :class="success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
            <span x-text="message"></span>
        </div>
    </div>
    """


def get_new_demande_scripts():
    return """
    <script>
    function newDemandeForm() {
        return {
            clients: [],
            form: {
                client_id: '',
                montant_sollicite: '',
                duree_mois: 12,
                periodicite: 'Mensuel',
                type_credit: 'Fonds de Roulement',
                taux_interet: 2,
                objet_credit: ''
            },
            message: '',
            success: false,
            
            async init() {
                // Charger les clients
                const response = await fetch('/api/v1/clients?size=100');
                const data = await response.json();
                this.clients = data.items || [];
                
                // Pré-remplir si client passé en URL
                const urlParams = new URLSearchParams(window.location.search);
                const clientId = urlParams.get('client');
                if (clientId) this.form.client_id = parseInt(clientId);
            },
            
            calculerMensualite() {
                const P = parseFloat(this.form.montant_sollicite) || 0;
                const r = (parseFloat(this.form.taux_interet) || 2) / 100 / 12;
                const n = parseInt(this.form.duree_mois) || 12;
                
                if (r === 0) return Math.round(P / n);
                return Math.round(P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
            },
            
            formatMontant(m) {
                return new Intl.NumberFormat('fr-FR').format(m) + ' FCFA';
            },
            
            async submitForm() {
                try {
                    const payload = {
                        ...this.form,
                        montant_sollicite: parseFloat(this.form.montant_sollicite),
                        duree_mois: parseInt(this.form.duree_mois),
                        taux_interet: parseFloat(this.form.taux_interet) / 100,
                        client_id: parseInt(this.form.client_id)
                    };
                    
                    const response = await fetch('/api/v1/demandes/', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                    
                    if (response.ok) {
                        const demande = await response.json();
                        this.success = true;
                        this.message = 'Demande créée! N° ' + demande.numero_demande;
                        setTimeout(() => window.location.href = '/app/demandes', 2000);
                    } else {
                        const error = await response.json();
                        this.success = false;
                        this.message = 'Erreur: ' + (error.detail || 'Erreur');
                    }
                } catch (e) {
                    this.success = false;
                    this.message = 'Erreur de connexion';
                }
            }
        }
    }
    </script>
    """


# Point d'entrée pour uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
