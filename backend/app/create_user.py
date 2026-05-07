"""Cria um usuário do sistema.

Uso:
    uv run python -m app.create_user EMAIL SENHA [--name "Nome"] [--admin]

Se o email já existir, atualiza a senha (e is_admin se passada a flag).
"""

import argparse
import sys

from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password


def main() -> int:
    parser = argparse.ArgumentParser(description="Cria/atualiza usuário do sistema.")
    parser.add_argument("email")
    parser.add_argument("password")
    parser.add_argument("--name", default=None, help="Nome de exibição")
    parser.add_argument("--admin", action="store_true", help="Marca como admin")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == args.email).first()
        if user:
            user.password_hash = hash_password(args.password)
            if args.name is not None:
                user.name = args.name
            if args.admin:
                user.is_admin = True
            db.commit()
            print(f"Usuário atualizado: {user.email} (admin={user.is_admin})")
        else:
            user = User(
                email=args.email,
                name=args.name,
                password_hash=hash_password(args.password),
                is_admin=args.admin,
            )
            db.add(user)
            db.commit()
            print(f"Usuário criado: {user.email} (admin={user.is_admin})")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
