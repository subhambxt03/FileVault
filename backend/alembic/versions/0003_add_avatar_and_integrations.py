"""add avatar and integrations to users

Revision ID: 0003
Revises: 0002
Create Date: 2025-01-03 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_key", sa.String(512), nullable=True))
    op.add_column("users", sa.Column("integrations", sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column("users", "integrations")
    op.drop_column("users", "avatar_key")