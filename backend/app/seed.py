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
    ("Ciencia de Dados", "Cientista de Dados"),
    ("Designer", "Designer"),
    ("Product Management", "Product Owner / Product Manager"),
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
    # New contracts from spreadsheet
    {
        "client": "AFYA",
        "sector": "Educacao",
        "name": "AFYA - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 6,
        "start_date": date(2025, 10, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Mensal",
        "notes": None,
    },
    {
        "client": "QUESTAR",
        "sector": "Tecnologia",
        "name": "QUESTAR - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 6,
        "start_date": date(2025, 10, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Mensal",
        "notes": None,
    },
    {
        "client": "ELUX",
        "sector": "Industria",
        "name": "ELUX - AI Factory",
        "plan_type": "AI Factory",
        "mrr": 0.0,
        "total_value": 0.0,
        "duration_months": 6,
        "start_date": date(2025, 10, 1),
        "end_date": date(2026, 3, 31),
        "payment_method": "Mensal",
        "notes": None,
    },
]

PEOPLE_DATA = [
    # === DISTRITO - Engenharia Dados (7) ===
    {"name": "Everson Henrich", "email": "everson.henrich@distrito.me",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Distrito"},
    {"name": "Priscila Franca", "email": "priscila.franca@distrito.me",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Distrito"},
    {"name": "Joseandra Anger", "email": "joseandra.anger@distrito.me",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Distrito"},
    {"name": "Viktor Oleksiuk", "email": "viktor.oleksiuk@distrito.me",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Distrito"},
    {"name": "Patricia Miranda", "email": "patricia.miranda@distrito.me",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Distrito"},
    {"name": "Rodrigo Cattoi", "email": "rodrigo.cattoi@distrito.me",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Distrito"},
    {"name": "Ailan Paula Goncalves", "email": "ailan.goncalves@distrito.me",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Distrito"},
    # === DISTRITO - Engenharia AI (9) ===
    {"name": "Arthur Dorigueto", "email": "arthur.dorigueto@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    {"name": "Bianka Passos", "email": "bianka.passos@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    {"name": "Leo Vilela", "email": "leo.vilela@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    {"name": "Vanessa Santos", "email": "vanessa.santos@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    {"name": "Breno Funicheli", "email": "breno.funicheli@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    {"name": "Matheus Muniz", "email": "matheus.muniz@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    {"name": "Rafael Mayer", "email": "rafael.mayer@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    {"name": "Hudson Barroso", "email": "hudson.barroso@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    {"name": "Eduardo Anaxagoras", "email": "eduardo.anaxagoras@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    # === DISTRITO - Engenharia AI FC (2) ===
    {"name": "Eraldo Barbosa", "email": "eraldo.barbosa@distrito.me",
     "roles": ["Engenharia AI FC"], "primary": "Engenharia AI FC", "company": "Distrito"},
    {"name": "Patrick Silva", "email": "patrick.silva@distrito.me",
     "roles": ["Engenharia AI FC"], "primary": "Engenharia AI FC", "company": "Distrito"},
    # === DISTRITO - Engenharia Software (1) ===
    {"name": "Vitor Traut", "email": "vitor.traut@distrito.me",
     "roles": ["Engenharia Software"], "primary": "Engenharia Software", "company": "Distrito"},
    # === DISTRITO - Engenharia Software FC (1) ===
    {"name": "Mateus Cardoso", "email": "mateus.cardoso@distrito.me",
     "roles": ["Engenharia Software FC"], "primary": "Engenharia Software FC", "company": "Distrito"},
    # === DISTRITO - Arquiteto Solucoes (1) ===
    {"name": "Valdson Leme", "email": "valdson.leme@distrito.me",
     "roles": ["Arquiteto Solucoes"], "primary": "Arquiteto Solucoes", "company": "Distrito"},
    # === DISTRITO - New tech people from allocation spreadsheet ===
    {"name": "Giovani", "email": "giovani@dojo.do",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Dojo"},
    {"name": "Lucas", "email": "lucas@dojo.do",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Dojo"},
    {"name": "Kaique", "email": "kaique@dojo.do",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Dojo"},
    {"name": "Luan", "email": "luan@dojo.do",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Dojo"},
    {"name": "Marcus", "email": "marcus@dojo.do",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Dojo"},
    {"name": "William", "email": "william@dojo.do",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Dojo"},
    {"name": "Bianca", "email": "bianca@dojo.do",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Dojo"},
    {"name": "Samuel", "email": "samuel@dojo.do",
     "roles": ["Engenharia Dados"], "primary": "Engenharia Dados", "company": "Dojo"},
    {"name": "Hermes", "email": "hermes@dojo.do",
     "roles": ["Engenharia Dados", "Ciencia de Dados"], "primary": "Engenharia Dados", "company": "Dojo"},
    {"name": "Leo Souza", "email": "leo.souza@distrito.me",
     "roles": ["Engenharia Software"], "primary": "Engenharia Software", "company": "Distrito"},
    {"name": "Leo Haine", "email": "leo.haine@distrito.me",
     "roles": ["Engenharia Software"], "primary": "Engenharia Software", "company": "Distrito"},
    {"name": "Vinicius", "email": "vinicius@distrito.me",
     "roles": ["Engenharia Software"], "primary": "Engenharia Software", "company": "Distrito"},
    {"name": "Rodrigo", "email": "rodrigo@distrito.me",
     "roles": ["Engenharia AI"], "primary": "Engenharia AI", "company": "Distrito"},
    # === DISTRITO - Produto (7) ===
    {"name": "Daniel Mischiatti", "email": "daniel.mischiatti@distrito.me",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Distrito"},
    {"name": "Roberta Senda", "email": "roberta.senda@distrito.me",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Distrito"},
    {"name": "Bruno Cricenti", "email": "bruno.cricenti@distrito.me",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Distrito"},
    {"name": "Vinicius Hessel", "email": "vinicius.hessel@distrito.me",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Distrito"},
    {"name": "Nathalia Souza", "email": "nathalia.souza@distrito.me",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Distrito"},
    {"name": "Thais Chehab", "email": "thais.chehab@distrito.me",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Distrito"},
    {"name": "Rafaella Costa", "email": "rafaella.costa@distrito.me",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Distrito"},
    # === DOJO - Others from allocation spreadsheet ===
    {"name": "Fabio", "email": "fabio@dojo.do",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Dojo"},
    {"name": "Priscila", "email": "priscila@dojo.do",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Dojo"},
    {"name": "Rafael", "email": "rafael@dojo.do",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Dojo"},
    {"name": "Ricardo", "email": "ricardo@dojo.do",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Dojo"},
    {"name": "Kewin", "email": "kewin@dojo.do",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Dojo"},
    {"name": "Carlos", "email": "carlos@dojo.do",
     "roles": ["Product Management"], "primary": "Product Management", "company": "Dojo"},
]

# Allocations from the spreadsheet
# Format: (person_name, contract_name, percentage, role_name)
# The contract_role will be looked up or created as needed
ALLOCATIONS_DATA = [
    # === Engenharia AI - LM multi-agents row ===
    # 1) Compass
    ("Matheus Muniz", "COMPASS - Squad Factory", 100, "Engenharia AI"),
    ("Arthur Dorigueto", "COMPASS - Squad Factory", 5, "Engenharia AI"),
    # 2) Pine
    ("Vanessa Santos", "BANCO PINE - AI Factory", 100, "Engenharia AI"),
    # 4) Track & Field
    ("Arthur Dorigueto", "TRACK & FIELD - Squad AI Factory", 90, "Engenharia AI"),
    # 5) Pepsico
    ("Eraldo Barbosa", "PEPSICO - AI Factory", 100, "Engenharia AI"),
    ("Hudson Barroso", "PEPSICO - AI Factory", 25, "Engenharia AI"),
    # 6) BMG
    ("Giovani", "BANCO BMG - Squad AI Factory (4 parcelas)", 100, "Engenharia AI"),
    # 7) BP
    ("Rafael Mayer", "BP - AI Factory", 100, "Engenharia AI"),
    ("Arthur Dorigueto", "BP - AI Factory", 5, "Engenharia AI"),
    # 8) Afya
    ("Leo Vilela", "AFYA - AI Factory", 100, "Engenharia AI"),
    # 9) Questar
    ("Eduardo Anaxagoras", "QUESTAR - AI Factory", 100, "Engenharia AI"),
    # 10) Michelin
    ("Bianka Passos", "MICHELIN - Squad AI Factory", 100, "Engenharia AI"),
    ("Hudson Barroso", "MICHELIN - Squad AI Factory", 5, "Engenharia AI"),
    # 11) CNP
    ("Patrick Silva", "CNP SEGURADORA - Projetos IA Factory", 100, "Engenharia AI FC"),
    # 12) Yara
    ("Hudson Barroso", "Yara Fertilizantes - AI Factory (AWS)", 70, "Engenharia AI"),
    # 13) Elux
    ("Lucas", "ELUX - AI Factory", 100, "Engenharia AI"),
    ("Rodrigo", "ELUX - AI Factory", 100, "Engenharia AI"),
    # 14) Swift/JBS
    ("Kaique", "SWIFT SEARA - AI Factory", 100, "Engenharia AI"),
    # 15) JSL
    ("Luan", "JSL - AI Factory", 100, "Engenharia AI"),

    # === Engenharia AI - ML supervised row ===
    ("Marcus", "SWIFT SEARA - AI Factory", 100, "Engenharia AI"),

    # === Engenharia Dados row ===
    # 1) Compass
    ("Everson Henrich", "COMPASS - Squad Factory", 100, "Engenharia Dados"),
    ("Priscila Franca", "COMPASS - Squad Factory", 100, "Engenharia Dados"),
    # 2) Pine
    ("Viktor Oleksiuk", "BANCO PINE - AI Factory", 100, "Engenharia Dados"),
    ("Rodrigo Cattoi", "BANCO PINE - AI Factory", 100, "Engenharia Dados"),
    ("Joseandra Anger", "BANCO PINE - AI Factory", 5, "Engenharia Dados"),
    # 4) Track & Field
    ("Joseandra Anger", "TRACK & FIELD - Squad AI Factory", 5, "Engenharia Dados"),
    # 5) Pepsico
    ("Patricia Miranda", "PEPSICO - AI Factory", 80, "Engenharia Dados"),
    # 6) BMG
    ("Hermes", "BANCO BMG - Squad AI Factory (4 parcelas)", 50, "Engenharia Dados"),
    # 8) Afya
    ("Joseandra Anger", "AFYA - AI Factory", 5, "Engenharia Dados"),
    # 9) Questar
    ("Joseandra Anger", "QUESTAR - AI Factory", 90, "Engenharia Dados"),
    ("Patricia Miranda", "QUESTAR - AI Factory", 20, "Engenharia Dados"),
    # 10) Michelin
    ("Ailan Paula Goncalves", "MICHELIN - Squad AI Factory", 100, "Engenharia Dados"),
    # 13) Elux
    ("William", "ELUX - AI Factory", 100, "Engenharia Dados"),
    ("Bianca", "ELUX - AI Factory", 50, "Engenharia Dados"),
    # 14) Swift/JBS
    ("Samuel", "SWIFT SEARA - AI Factory", 50, "Engenharia Dados"),
    # 16) Unimed BH
    ("Hermes", "UNIMED BH - AI Factory (AWS)", 50, "Engenharia Dados"),

    # === Ciencia de dados row ===
    ("Hermes", "BANCO BMG - Squad AI Factory (4 parcelas)", 50, "Ciencia de Dados"),
    ("Matheus Muniz", "BP - AI Factory", 25, "Ciencia de Dados"),

    # === Engenharia Software Full-stack row ===
    # 3) AlmapBBDO
    ("Leo Souza", "ALMAP BBDO - AI Factory", 100, "Engenharia Software"),
    ("Mateus Cardoso", "ALMAP BBDO - AI Factory", 100, "Engenharia Software FC"),
    # 4) Track & Field
    ("Mateus Cardoso", "TRACK & FIELD - Squad AI Factory", 10, "Engenharia Software FC"),
    # 13) Elux
    ("Leo Haine", "ELUX - AI Factory", 50, "Engenharia Software"),
    # 14) Swift/JBS
    ("Leo Haine", "SWIFT SEARA - AI Factory", 50, "Engenharia Software"),
    ("Vinicius", "SWIFT SEARA - AI Factory", 50, "Engenharia Software"),

    # === Engenharia Software Front-end row ===
    # 9) Questar
    ("Vitor Traut", "QUESTAR - AI Factory", 100, "Engenharia Software"),

    # === Product Management - PO row (Dojo) ===
    # 1) Compass
    ("Daniel Mischiatti", "COMPASS - Squad Factory", 95, "Product Management"),
    # 2) Pine
    ("Bruno Cricenti", "BANCO PINE - AI Factory", 100, "Product Management"),
    # 3) AlmapBBDO
    ("Vinicius Hessel", "ALMAP BBDO - AI Factory", 40, "Product Management"),
    ("Thais Chehab", "ALMAP BBDO - AI Factory", 3, "Product Management"),
    # AlmapBBDO Synths
    ("Vinicius Hessel", "ALMAP BBDO - AI Factory (Nov)", 10, "Product Management"),
    ("Thais Chehab", "ALMAP BBDO - AI Factory (Nov)", 3, "Product Management"),
    # 4) Track & Field
    ("Vinicius Hessel", "TRACK & FIELD - Squad AI Factory", 20, "Product Management"),
    # Track & Field - Rafaella
    ("Rafaella Costa", "TRACK & FIELD - Squad AI Factory", 100, "Product Management"),
    # 5) Pepsico
    ("Nathalia Souza", "PEPSICO - AI Factory", 50, "Product Management"),
    # 6) BMG
    ("Fabio", "BANCO BMG - Squad AI Factory (4 parcelas)", 50, "Product Management"),
    # 7) BP
    ("Roberta Senda", "BP - AI Factory", 30, "Product Management"),
    # 8) Afya
    ("Vinicius Hessel", "AFYA - AI Factory", 15, "Product Management"),
    ("Thais Chehab", "AFYA - AI Factory", 3, "Product Management"),
    # 9) Questar
    ("Vinicius Hessel", "QUESTAR - AI Factory", 15, "Product Management"),
    ("Thais Chehab", "QUESTAR - AI Factory", 3, "Product Management"),
    # 10) Michelin
    ("Roberta Senda", "MICHELIN - Squad AI Factory", 70, "Product Management"),
    # 12) Yara
    ("Nathalia Souza", "Yara Fertilizantes - AI Factory (AWS)", 50, "Product Management"),
    # 13) Elux
    ("Thais Chehab", "ELUX - AI Factory", 90, "Product Management"),
    # 14) Swift/JBS
    ("Priscila", "SWIFT SEARA - AI Factory", 50, "Product Management"),
    # 15) JSL
    ("Rafael", "JSL - AI Factory", 100, "Product Management"),
    # 18) Copastur
    ("Daniel Mischiatti", "COPASTUR - Factory POC (Postmetria)", 5, "Product Management"),

    # === Product Management - PM row (Dojo) ===
    # 6) BMG
    ("Kewin", "BANCO BMG - Squad AI Factory (4 parcelas)", 50, "Product Management"),
    ("Carlos", "BANCO BMG - Squad AI Factory (4 parcelas)", 50, "Product Management"),
    # 14) Swift/JBS - PM
    ("Ricardo", "SWIFT SEARA - AI Factory", 25, "Product Management"),
    # 15) JSL - PM
    ("Ricardo", "JSL - AI Factory", 25, "Product Management"),
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
            person = Person(
                name=p["name"], email=p["email"],
                company=p.get("company", "Distrito"),
            )
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
        contract_map = {}  # name -> contract object
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
            contract_map[c["name"]] = contract

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

        db.flush()
        print(f"Created {len(client_map)} clients and {len(CONTRACTS_DATA)} contracts")

        # Build contract_role lookup: (contract_id, role_id) -> contract_role
        cr_lookup = {}
        for cr in db.query(ContractRole).all():
            key = (cr.contract_id, cr.role_id)
            cr_lookup[key] = cr

        # Seed allocations
        alloc_count = 0
        for person_name, contract_name, percentage, role_name in ALLOCATIONS_DATA:
            person_id = person_map.get(person_name)
            if person_id is None:
                print(f"  WARNING: Person '{person_name}' not found, skipping")
                continue

            contract = contract_map.get(contract_name)
            if contract is None:
                print(f"  WARNING: Contract '{contract_name}' not found, skipping")
                continue

            role_id = role_map.get(role_name)
            if role_id is None:
                print(f"  WARNING: Role '{role_name}' not found, skipping")
                continue

            # Find or create contract_role
            key = (contract.id, role_id)
            cr = cr_lookup.get(key)
            if cr is None:
                cr = ContractRole(
                    contract_id=contract.id,
                    role_id=role_id,
                    allocation_percentage=100,
                    quantity=5,
                )
                db.add(cr)
                db.flush()
                cr_lookup[key] = cr

            allocation = Allocation(
                person_id=person_id,
                contract_role_id=cr.id,
                allocation_percentage=percentage,
                start_date=contract.start_date,
                end_date=contract.end_date,
            )
            db.add(allocation)
            alloc_count += 1

        print(f"Created {alloc_count} allocations")

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
