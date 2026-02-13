"""Seed the database with roles and contract data from contratos.xlsx"""

from datetime import date

from app.database import Base, SessionLocal, engine
from app.models.client import Client
from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.models.person import Person
from app.models.person_role import PersonRole
from app.models.role import Role

ROLES = [
    ("Engenheiro IA", "Engenheiro de Inteligencia Artificial"),
    ("Engenheiro Dados", "Engenheiro de Dados"),
    ("Desenvolvedor", "Desenvolvedor de Software"),
    ("Engenheiro de ML", "Engenheiro de Machine Learning"),
    ("PO", "Product Owner"),
    ("PM", "Project Manager"),
]

CONTRACTS_DATA = [
    {
        "client": "COPASTUR",
        "sector": "Turismo",
        "name": "COPASTUR - Factory POC",
        "plan_type": "Factory - POC",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 12,
        "start_date": date(2025, 4, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {},
    },
    {
        "client": "TRACK & FIELD",
        "sector": "Comercio e Varejo",
        "name": "TRACK & FIELD - Squad AI Factory",
        "plan_type": "Squad AI Factory",
        "mrr": 80000.0,
        "total_value": 960000.0,
        "duration_months": 12,
        "start_date": date(2025, 6, 1),
        "end_date": date(2026, 5, 31),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro Dados": 1},
    },
    {
        "client": "ALMAP BBDO",
        "sector": "Marketing e Publicidade",
        "name": "ALMAP BBDO - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 102200.0,
        "total_value": 1226400.0,
        "duration_months": 12,
        "start_date": date(2025, 7, 1),
        "end_date": date(2026, 6, 30),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro Dados": 1, "PO": 1},
    },
    {
        "client": "BANCO PINE",
        "sector": "Servicos Financeiros",
        "name": "BANCO PINE - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 150000.0,
        "total_value": 1800000.0,
        "duration_months": 12,
        "start_date": date(2025, 7, 1),
        "end_date": date(2026, 6, 30),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro Dados": 1, "Engenheiro de ML": 1},
    },
    {
        "client": "CNP SEGURADORA",
        "sector": "Seguros",
        "name": "CNP SEGURADORA - Projetos IA Factory",
        "plan_type": "Projetos IA Factory",
        "mrr": 70000.0,
        "total_value": 420000.0,
        "duration_months": 6,
        "start_date": date(2025, 9, 1),
        "end_date": date(2026, 2, 17),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro Dados": 1},
    },
    {
        "client": "MICHELIN",
        "sector": "Automotivo",
        "name": "MICHELIN - Squad AI Factory",
        "plan_type": "Squad - AI Factory",
        "mrr": 135203.0,
        "total_value": 1622436.0,
        "duration_months": 12,
        "start_date": date(2025, 9, 19),
        "end_date": date(2026, 9, 18),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro Dados": 1, "PO": 0.5},
    },
    {
        "client": "COMGAS - COMPASS",
        "sector": "Industria",
        "name": "COMGAS COMPASS - Squad AI Factory GASPEC",
        "plan_type": "Squad - AI Factory - GASPEC",
        "mrr": 331740.0,
        "total_value": 2985660.0,
        "duration_months": 9,
        "start_date": date(2025, 9, 1),
        "end_date": date(2026, 5, 31),
        "payment_method": "Parcelado",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro Dados": 1, "PO": 1},
    },
    {
        "client": "BANCO BMG",
        "sector": "Servicos Financeiros",
        "name": "BANCO BMG - Squad AI Factory",
        "plan_type": "Squad AI Factory",
        "mrr": 48439.44,
        "total_value": 387515.52,
        "duration_months": 8,
        "start_date": date(2026, 2, 21),
        "end_date": date(2026, 10, 21),
        "payment_method": "Parcelado",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro de ML": 0.5, "PO": 0.5},
    },
    {
        "client": "Yara Fertilizantes",
        "sector": "Agronegocio",
        "name": "Yara Fertilizantes - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 22176.0,
        "total_value": 66528.0,
        "duration_months": 3,
        "start_date": date(2025, 12, 1),
        "end_date": date(2026, 2, 28),
        "payment_method": "Entrega",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "PO": 1},
    },
    {
        "client": "JSL",
        "sector": "Transporte e Mobilidade",
        "name": "JSL - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 49086.5,
        "total_value": 98173.0,
        "duration_months": 2,
        "start_date": date(2025, 12, 10),
        "end_date": date(2026, 2, 9),
        "payment_method": "Parcelado",
        "notes": None,
        "roles": {"Engenheiro IA": 2, "PO": 1},
    },
    {
        "client": "ALPER SEGUROS",
        "sector": "Seguros",
        "name": "ALPER SEGUROS - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 19154.0,
        "total_value": 57462.0,
        "duration_months": 3,
        "start_date": date(2025, 12, 1),
        "end_date": date(2026, 2, 28),
        "payment_method": "Entrega",
        "notes": None,
        "roles": {},
    },
    {
        "client": "PEPSICO DO BRASIL",
        "sector": "Industria e Comercio",
        "name": "PEPSICO DO BRASIL - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 323483.33,
        "total_value": 1940900.0,
        "duration_months": 6,
        "start_date": date(2025, 12, 22),
        "end_date": date(2026, 7, 1),
        "payment_method": "Parcelado",
        "notes": None,
        "roles": {"Engenheiro Dados": 1, "Engenheiro de ML": 2, "PO": 1},
    },
    {
        "client": "ALMAP BBDO",
        "sector": "Marketing e Publicidade",
        "name": "ALMAP BBDO - AI Factory (Nov)",
        "plan_type": "AI Factory",
        "mrr": 50147.91,
        "total_value": 150443.73,
        "duration_months": 3,
        "start_date": date(2025, 11, 13),
        "end_date": date(2026, 2, 12),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 0.5, "Desenvolvedor": 1},
    },
    {
        "client": "VITTA",
        "sector": "Saude",
        "name": "VITTA - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 37238.33,
        "total_value": 111715.0,
        "duration_months": 3,
        "start_date": date(2026, 1, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Entrega",
        "notes": None,
        "roles": {},
    },
    {
        "client": "UNIMED BH",
        "sector": "Saude",
        "name": "UNIMED BH - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 41666.67,
        "total_value": 125000.0,
        "duration_months": 3,
        "start_date": date(2026, 1, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Entrega",
        "notes": None,
        "roles": {},
    },
    {
        "client": "SWIFT - SEARA",
        "sector": "Varejo",
        "name": "SWIFT SEARA - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 13414.85,
        "total_value": 174393.0,
        "duration_months": 13,
        "start_date": date(2025, 11, 17),
        "end_date": date(2026, 11, 30),
        "payment_method": "Parcelado",
        "notes": None,
        "roles": {
            "Engenheiro IA": 1,
            "Engenheiro Dados": 1,
            "Desenvolvedor": 1,
            "PO": 0.5,
            "PM": 0.5,
        },
    },
    {
        "client": "BENEFICIENCIA PORTUGUESA",
        "sector": "Saude",
        "name": "BP - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 84779.25,
        "total_value": 254337.75,
        "duration_months": 3,
        "start_date": date(2026, 1, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "PO": 0.5},
    },
    {
        "client": "BANCO PINE",
        "sector": "Servicos Financeiros",
        "name": "BANCO PINE - AI Factory (Jan)",
        "plan_type": "AI Factory",
        "mrr": 50000.0,
        "total_value": 300000.0,
        "duration_months": 6,
        "start_date": date(2026, 1, 12),
        "end_date": date(2026, 6, 30),
        "payment_method": "Mensal",
        "notes": None,
        "roles": {
            "Engenheiro IA": 1,
            "Engenheiro Dados": 1,
            "Engenheiro de ML": 1,
            "PO": 1,
        },
    },
    {
        "client": "COMPASS GAS E ENERGIA S.A",
        "sector": "Industria",
        "name": "COMPASS - AI Factory (Jan)",
        "plan_type": "AI Factory",
        "mrr": 66191.33,
        "total_value": 198574.0,
        "duration_months": 3,
        "start_date": date(2026, 1, 26),
        "end_date": date(2026, 4, 25),
        "payment_method": "A vista",
        "notes": None,
        "roles": {"Engenheiro IA": 1, "Engenheiro Dados": 1, "PO": 1},
    },
]

PEOPLE_DATA = [
    # === DISTRITO - Engenheiro Dados (7) ===
    {"name": "Everson Henrich", "email": "everson.henrich@distrito.me",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Distrito"},
    {"name": "Priscila Franca", "email": "priscila.franca@distrito.me",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Distrito"},
    {"name": "Joseandra Anger", "email": "joseandra.anger@distrito.me",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Distrito"},
    {"name": "Viktor Oleksiuk", "email": "viktor.oleksiuk@distrito.me",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Distrito"},
    {"name": "Patricia Miranda", "email": "patricia.miranda@distrito.me",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Distrito"},
    {"name": "Rodrigo Cattoi", "email": "rodrigo.cattoi@distrito.me",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Distrito"},
    {"name": "Ailan Paula Goncalves", "email": "ailan.goncalves@distrito.me",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Distrito"},
    # === DISTRITO - Engenheiro IA (11, includes former AI FC) ===
    {"name": "Arthur Dorigueto", "email": "arthur.dorigueto@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Bianka Passos", "email": "bianka.passos@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Leo Vilela", "email": "leo.vilela@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Vanessa Santos", "email": "vanessa.santos@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Breno Funicheli", "email": "breno.funicheli@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Matheus Muniz", "email": "matheus.muniz@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Rafael Mayer", "email": "rafael.mayer@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Hudson Barroso", "email": "hudson.barroso@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Eduardo Anaxagoras", "email": "eduardo.anaxagoras@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Eraldo Barbosa", "email": "eraldo.barbosa@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    {"name": "Patrick Silva", "email": "patrick.silva@distrito.me",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Distrito"},
    # === DISTRITO - Desenvolvedor (2, includes former Software FC + Arquiteto) ===
    {"name": "Vitor Traut", "email": "vitor.traut@distrito.me",
     "roles": ["Desenvolvedor"], "primary": "Desenvolvedor", "company": "Distrito"},
    {"name": "Mateus Cardoso", "email": "mateus.cardoso@distrito.me",
     "roles": ["Desenvolvedor"], "primary": "Desenvolvedor", "company": "Distrito"},
    {"name": "Valdson Leme", "email": "valdson.leme@distrito.me",
     "roles": ["Desenvolvedor"], "primary": "Desenvolvedor", "company": "Distrito"},
    # === DOJO - Tech ===
    {"name": "Giovani", "email": "giovani@dojo.do",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Dojo"},
    {"name": "Lucas", "email": "lucas@dojo.do",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Dojo"},
    {"name": "Kaique", "email": "kaique@dojo.do",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Dojo"},
    {"name": "Luan", "email": "luan@dojo.do",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Dojo"},
    {"name": "Marcus", "email": "marcus@dojo.do",
     "roles": ["Engenheiro IA"], "primary": "Engenheiro IA", "company": "Dojo"},
    {"name": "William", "email": "william@dojo.do",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Dojo"},
    {"name": "Bianca", "email": "bianca@dojo.do",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Dojo"},
    {"name": "Samuel", "email": "samuel@dojo.do",
     "roles": ["Engenheiro Dados"], "primary": "Engenheiro Dados", "company": "Dojo"},
    {"name": "Hermes", "email": "hermes@dojo.do",
     "roles": ["Engenheiro Dados", "Engenheiro de ML"], "primary": "Engenheiro Dados", "company": "Dojo"},
    # === FCamara / Dojo - Desenvolvedores ===
    {"name": "Leo Souza", "email": "leo.souza@fcamara.com",
     "roles": ["Desenvolvedor"], "primary": "Desenvolvedor", "company": "FCamara"},
    {"name": "Leo Haine", "email": "leo.haine@dojo.do",
     "roles": ["Desenvolvedor"], "primary": "Desenvolvedor", "company": "Dojo"},
    {"name": "Vinicius", "email": "vinicius@dojo.do",
     "roles": ["Desenvolvedor"], "primary": "Desenvolvedor", "company": "Dojo"},
    # === DISTRITO - PO (7) ===
    {"name": "Daniel Mischiatti", "email": "daniel.mischiatti@distrito.me",
     "roles": ["PO"], "primary": "PO", "company": "Distrito"},
    {"name": "Roberta Senda", "email": "roberta.senda@distrito.me",
     "roles": ["PO"], "primary": "PO", "company": "Distrito"},
    {"name": "Bruno Cricenti", "email": "bruno.cricenti@distrito.me",
     "roles": ["PO"], "primary": "PO", "company": "Distrito"},
    {"name": "Vinicius Hessel", "email": "vinicius.hessel@distrito.me",
     "roles": ["PO"], "primary": "PO", "company": "Distrito"},
    {"name": "Nathalia Souza", "email": "nathalia.souza@distrito.me",
     "roles": ["PO"], "primary": "PO", "company": "Distrito"},
    {"name": "Thais Chehab", "email": "thais.chehab@distrito.me",
     "roles": ["PO"], "primary": "PO", "company": "Distrito"},
    {"name": "Rafaella Costa", "email": "rafaella.costa@distrito.me",
     "roles": ["PO"], "primary": "PO", "company": "Distrito"},
    # === DOJO - PO ===
    {"name": "Fabio", "email": "fabio@dojo.do",
     "roles": ["PO"], "primary": "PO", "company": "Dojo"},
    {"name": "Priscila", "email": "priscila@dojo.do",
     "roles": ["PO"], "primary": "PO", "company": "Dojo"},
    {"name": "Rafael", "email": "rafael@dojo.do",
     "roles": ["PO"], "primary": "PO", "company": "Dojo"},
    # === DOJO - PM ===
    {"name": "Ricardo", "email": "ricardo@dojo.do",
     "roles": ["PM"], "primary": "PM", "company": "Dojo"},
    {"name": "Kewin", "email": "kewin@dojo.do",
     "roles": ["PM"], "primary": "PM", "company": "Dojo"},
    {"name": "Carlos", "email": "carlos@dojo.do",
     "roles": ["PM"], "primary": "PM", "company": "Dojo"},
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Role).count() > 0:
            print("Database already seeded. Skipping.")
            return

        # Seed roles
        role_map = {}
        for name, desc in ROLES:
            role = Role(name=name, description=desc)
            db.add(role)
            db.flush()
            role_map[name] = role.id
        print(f"Created {len(ROLES)} roles")

        # Seed people
        for p in PEOPLE_DATA:
            person = Person(
                name=p["name"], email=p["email"],
                company=p.get("company", "Distrito"),
            )
            db.add(person)
            db.flush()
            for role_name in p["roles"]:
                pr = PersonRole(
                    person_id=person.id,
                    role_id=role_map[role_name],
                    is_primary=(role_name == p["primary"]),
                )
                db.add(pr)
        print(f"Created {len(PEOPLE_DATA)} people")

        # Seed clients and contracts
        client_map = {}
        contract_count = 0
        role_count = 0
        for c in CONTRACTS_DATA:
            client_name = c["client"]
            if client_name not in client_map:
                client = Client(name=client_name, sector=c["sector"])
                db.add(client)
                db.flush()
                client_map[client_name] = client.id

            contract = Contract(
                client_id=client_map[client_name],
                name=c["name"],
                start_date=c["start_date"],
                end_date=c["end_date"],
                status="active",
                plan_type=c["plan_type"],
                mrr=c["mrr"],
                total_value=c["total_value"],
                duration_months=c["duration_months"],
                payment_method=c["payment_method"],
                notes=c["notes"],
            )
            db.add(contract)
            db.flush()
            contract_count += 1

            # Create ContractRoles from the roles dict
            for role_name, value in c.get("roles", {}).items():
                if not value or value <= 0:
                    continue
                if value == 0.5:
                    quantity, alloc_pct = 1, 50
                elif value == int(value):
                    quantity, alloc_pct = int(value), 100
                else:
                    quantity, alloc_pct = int(value) + 1, 100
                cr = ContractRole(
                    contract_id=contract.id,
                    role_id=role_map[role_name],
                    allocation_percentage=alloc_pct,
                    quantity=quantity,
                )
                db.add(cr)
                role_count += 1

        print(f"Created {len(client_map)} clients, {contract_count} contracts, {role_count} contract roles")

        db.commit()
        print("Seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
