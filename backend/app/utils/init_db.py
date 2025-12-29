"""
Script pour initialiser la base de données avec des données de test
"""
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole


def init_db():
    """Initialise la base de données"""
    # Créer les tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Vérifier si un admin existe déjà
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if not admin:
            # Créer un utilisateur admin par défaut
            admin = User(
                email="admin@pamf.bf",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                first_name="Admin",
                last_name="PAMF",
                role=UserRole.ADMIN,
                is_active=True,
                is_superuser=True,
                agency="Siège"
            )
            db.add(admin)
            
            # Créer un agent de crédit de test
            agent = User(
                email="agent@pamf.bf",
                username="agent",
                hashed_password=get_password_hash("agent123"),
                first_name="Agent",
                last_name="Crédit",
                role=UserRole.AGENT_CREDIT,
                is_active=True,
                agency="Diébougou"
            )
            db.add(agent)
            
            # Créer un risk officer de test
            risk_officer = User(
                email="risk@pamf.bf",
                username="risk",
                hashed_password=get_password_hash("risk123"),
                first_name="Risk",
                last_name="Officer",
                role=UserRole.RISK_OFFICER,
                is_active=True,
                agency="Siège"
            )
            db.add(risk_officer)
            
            # Créer un chef d'agence de test
            chef = User(
                email="chef@pamf.bf",
                username="chef",
                hashed_password=get_password_hash("chef123"),
                first_name="Chef",
                last_name="Agence",
                role=UserRole.CHEF_AGENCE,
                is_active=True,
                agency="Diébougou"
            )
            db.add(chef)
            
            db.commit()
            
            print("✅ Base de données initialisée avec succès!")
            print("\n📝 Utilisateurs créés:")
            print("   - Admin: admin / admin123")
            print("   - Agent: agent / agent123")
            print("   - Risk Officer: risk / risk123")
            print("   - Chef d'Agence: chef / chef123")
        else:
            print("ℹ️  La base de données contient déjà des utilisateurs.")
    
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation: {e}")
        db.rollback()
    
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Initialisation de la base de données...")
    init_db()
