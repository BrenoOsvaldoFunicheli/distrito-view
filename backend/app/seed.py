"""Seed the database with roles and contract data from dados..ods"""

from datetime import date, datetime

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models.allocation import Allocation
from app.models.client import Client
from app.models.contract import Contract
from app.models.contract_role import ContractRole
from app.models.person import Person
from app.models.person_role import PersonRole
from app.models.role import Role

ROLES = [
    ("Engenharia AI", "Engenheiro de AI (LLM ou ML)"),
    ("Engenharia AI FC", "Engenheiro de AI Full Cycle (LLM ou ML)"),
    ("Engenharia Dados", "Engenheiro de Dados"),
    ("Engenharia Software", "Engenheiro de Software"),
    ("Engenharia Software FC", "Engenheiro de Software Full Cycle"),
    ("Arquiteto Solucoes", "Arquiteto de Solucoes"),
]

CONTRACTS_DATA = [
    {
        "client": "LIFETIME",
        "sector": "Servicos Financeiros",
        "name": "LIFETIME - Squad Factory",
        "plan_type": "Squad Factory",
        "mrr": 68500.0,
        "total_value": 890500.0,
        "duration_months": 13,
        "start_date": date(2025, 2, 1),
        "end_date": date(2026, 3, 10),
        "payment_method": "Mensal",
        "notes": None,
    },
    {
        "client": "COMPASS GAS E ENERGIA S.A",
        "sector": "Industria",
        "name": "COMPASS - Squad Factory",
        "plan_type": "Squad Factory",
        "mrr": 117463.0,
        "total_value": 1409556.0,
        "duration_months": 12,
        "start_date": date(2025, 2, 28),
        "end_date": date(2026, 2, 27),
        "payment_method": "Mensal",
        "notes": None,
    },
    {
        "client": "COPASTUR",
        "sector": "Turismo",
        "name": "COPASTUR - Factory POC (Postmetria)",
        "plan_type": "Factory - POC",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 12,
        "start_date": date(2025, 4, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Mensal",
        "notes": "Valor variavel",
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
    },
    {
        "client": "TRACK & FIELD",
        "sector": "Comercio e Varejo",
        "name": "TRACK & FIELD - Squad AI Factory (Variavel)",
        "plan_type": "Squad AI Factory",
        "mrr": 40000.0,
        "total_value": 480000.0,
        "duration_months": 12,
        "start_date": date(2025, 6, 1),
        "end_date": date(2026, 5, 31),
        "payment_method": "Mensal",
        "notes": "Remuneracao Variavel",
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
        "notes": "Rescisao apos 3 meses e mediante aviso previo de 60 dias",
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
    },
    {
        "client": "COMPASS GAS E ENERGIA S.A",
        "sector": "Industria",
        "name": "COMPASS - Squad AI Factory (Out)",
        "plan_type": "Squad - AI Factory",
        "mrr": 125875.0,
        "total_value": 629375.0,
        "duration_months": 5,
        "start_date": date(2025, 10, 1),
        "end_date": date(2026, 2, 27),
        "payment_method": "Parcelado",
        "notes": None,
    },
    {
        "client": "COMGAS - COMPASS",
        "sector": "Industria",
        "name": "COMGAS - Squad AI Factory GASPEC",
        "plan_type": "Squad - AI Factory - GASPEC",
        "mrr": 331740.0,
        "total_value": 2985660.0,
        "duration_months": 9,
        "start_date": date(2025, 9, 1),
        "end_date": date(2026, 5, 31),
        "payment_method": "Parcelado",
        "notes": "GASPEC",
    },
    {
        "client": "BANCO BMG",
        "sector": "Servicos Financeiros",
        "name": "BANCO BMG - Squad AI Factory (4 parcelas)",
        "plan_type": "Squad AI Factory",
        "mrr": 99350.0,
        "total_value": 397400.0,
        "duration_months": 4,
        "start_date": date(2025, 10, 22),
        "end_date": date(2026, 2, 21),
        "payment_method": "Parcelado",
        "notes": "Mensal - 4 Parcelas",
    },
    {
        "client": "BANCO BMG",
        "sector": "Servicos Financeiros",
        "name": "BANCO BMG - Squad AI Factory (5 parcelas)",
        "plan_type": "Squad AI Factory",
        "mrr": 21593.04,
        "total_value": 107965.2,
        "duration_months": 5,
        "start_date": date(2025, 10, 22),
        "end_date": date(2026, 3, 21),
        "payment_method": "Parcelado",
        "notes": "Mensal - 5 Parcelas",
    },
    {
        "client": "BANCO BMG",
        "sector": "Servicos Financeiros",
        "name": "BANCO BMG - Squad AI Factory (8 parcelas)",
        "plan_type": "Squad AI Factory",
        "mrr": 48439.44,
        "total_value": 387515.52,
        "duration_months": 8,
        "start_date": date(2026, 2, 21),
        "end_date": date(2026, 10, 21),
        "payment_method": "Parcelado",
        "notes": "Mensal - 8 Parcelas",
    },
    {
        "client": "Yara Fertilizantes",
        "sector": "Agronegocio",
        "name": "Yara Fertilizantes - AI Factory (AWS)",
        "plan_type": "AI Factory",
        "mrr": 22176.0,
        "total_value": 66528.0,
        "duration_months": 3,
        "start_date": date(2025, 12, 1),
        "end_date": date(2026, 2, 28),
        "payment_method": "Entrega",
        "notes": "Funding AWS",
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
        "notes": "2x - 50% no inicio e 50% na entrega",
    },
    {
        "client": "ALPER SEGUROS",
        "sector": "Seguros",
        "name": "ALPER SEGUROS - AI Factory (AWS)",
        "plan_type": "AI Factory",
        "mrr": 19154.0,
        "total_value": 57462.0,
        "duration_months": 3,
        "start_date": date(2025, 12, 1),
        "end_date": date(2026, 2, 28),
        "payment_method": "Entrega",
        "notes": "Funding AWS",
    },
    {
        "client": "PEPSICO DO BRASIL",
        "sector": "Industria e Comercio",
        "name": "PEPSICO - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 323483.33,
        "total_value": 1940900.0,
        "duration_months": 6,
        "start_date": date(2025, 12, 22),
        "end_date": date(2026, 7, 1),
        "payment_method": "Parcelado",
        "notes": None,
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
        "notes": "Subcontratacao FC por 20k",
    },
    {
        "client": "VITTA",
        "sector": "Saude",
        "name": "VITTA - AI Factory (AWS)",
        "plan_type": "AI Factory",
        "mrr": 37238.33,
        "total_value": 111715.0,
        "duration_months": 3,
        "start_date": date(2026, 1, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Entrega",
        "notes": "Funding AWS",
    },
    {
        "client": "UNIMED BH",
        "sector": "Saude",
        "name": "UNIMED BH - AI Factory (AWS)",
        "plan_type": "AI Factory",
        "mrr": 41666.67,
        "total_value": 125000.0,
        "duration_months": 3,
        "start_date": date(2026, 1, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Entrega",
        "notes": "Funding AWS",
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
    },
    {
        "client": "SWIFT - SEARA",
        "sector": "Varejo",
        "name": "SWIFT SEARA - AI Factory (AWS)",
        "plan_type": "AI Factory",
        "mrr": 9230.77,
        "total_value": 120000.0,
        "duration_months": 13,
        "start_date": date(2025, 11, 17),
        "end_date": date(2026, 11, 30),
        "payment_method": "Parcelado",
        "notes": "Funding AWS",
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
        "notes": "3x",
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
        "notes": "10 dias",
    },
]

PEOPLE_DATA = [
    # Engenharia Dados (7)
    {"name": "Everson Henrich", "email": "everson.henrich@distrito.me", "roles": ["Engenharia Dados"], "primary": "Engenharia Dados"},
    {"name": "Priscila Franca", "email": "priscila.franca@distrito.me", "roles": ["Engenharia Dados"], "primary": "Engenharia Dados"},
    {"name": "Joseandra Anger", "email": "joseandra.anger@distrito.me", "roles": ["Engenharia Dados"], "primary": "Engenharia Dados"},
    {"name": "Viktor Oleksiuk", "email": "viktor.oleksiuk@distrito.me", "roles": ["Engenharia Dados"], "primary": "Engenharia Dados"},
    {"name": "Patricia Miranda", "email": "patricia.miranda@distrito.me", "roles": ["Engenharia Dados"], "primary": "Engenharia Dados"},
    {"name": "Rodrigo Cattoi", "email": "rodrigo.cattoi@distrito.me", "roles": ["Engenharia Dados"], "primary": "Engenharia Dados"},
    {"name": "Ailan Paula Goncalves", "email": "ailan.goncalves@distrito.me", "roles": ["Engenharia Dados"], "primary": "Engenharia Dados"},
    # Engenharia AI (9)
    {"name": "Arthur Dorigueto", "email": "arthur.dorigueto@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    {"name": "Bianka Passos", "email": "bianka.passos@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    {"name": "Leo Vilela", "email": "leo.vilela@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    {"name": "Vanessa Santos", "email": "vanessa.santos@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    {"name": "Breno Funicheli", "email": "breno.funicheli@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    {"name": "Matheus Muniz", "email": "matheus.muniz@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    {"name": "Rafael Mayer", "email": "rafael.mayer@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    {"name": "Hudson Barroso", "email": "hudson.barroso@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    {"name": "Eduardo Anaxagoras", "email": "eduardo.anaxagoras@distrito.me", "roles": ["Engenharia AI"], "primary": "Engenharia AI"},
    # Engenharia AI FC (2)
    {"name": "Eraldo Barbosa", "email": "eraldo.barbosa@distrito.me", "roles": ["Engenharia AI FC"], "primary": "Engenharia AI FC"},
    {"name": "Patrick Silva", "email": "patrick.silva@distrito.me", "roles": ["Engenharia AI FC"], "primary": "Engenharia AI FC"},
    # Engenharia Software (1)
    {"name": "Vitor Traut", "email": "vitor.traut@distrito.me", "roles": ["Engenharia Software"], "primary": "Engenharia Software"},
    # Engenharia Software FC (1)
    {"name": "Mateus Cardoso", "email": "mateus.cardoso@distrito.me", "roles": ["Engenharia Software FC"], "primary": "Engenharia Software FC"},
    # Arquiteto Solucoes (1)
    {"name": "Valdson Leme", "email": "valdson.leme@distrito.me", "roles": ["Arquiteto Solucoes"], "primary": "Arquiteto Solucoes"},
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
        person_map = {}
        for p in PEOPLE_DATA:
            person = Person(name=p["name"], email=p["email"])
            db.add(person)
            db.flush()
            person_map[p["name"]] = person.id
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

            # Infer contract roles based on plan type
            plan = c["plan_type"].lower()
            if "squad" in plan:
                # Squad plans typically need more people
                cr1 = ContractRole(
                    contract_id=contract.id,
                    role_id=role_map["Engenharia AI"],
                    allocation_percentage=100,
                    quantity=2,
                )
                cr2 = ContractRole(
                    contract_id=contract.id,
                    role_id=role_map["Engenharia Software"],
                    allocation_percentage=100,
                    quantity=1,
                )
                cr3 = ContractRole(
                    contract_id=contract.id,
                    role_id=role_map["Engenharia Dados"],
                    allocation_percentage=50,
                    quantity=1,
                )
                db.add_all([cr1, cr2, cr3])
            else:
                # AI Factory / POC - smaller team
                cr1 = ContractRole(
                    contract_id=contract.id,
                    role_id=role_map["Engenharia AI"],
                    allocation_percentage=100,
                    quantity=1,
                )
                db.add(cr1)

        print(f"Created {len(client_map)} clients and {len(CONTRACTS_DATA)} contracts")

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
