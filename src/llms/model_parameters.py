from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy import (
    Column,
    String,
    Float,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import UUID

from src.backend.database.base import Base


class ModelParameters(Base):
    __tablename__ = "llm_model_parameters"
    __table_args__ = (
        UniqueConstraint("account_id", "model_id", name="uq_account_model"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(
        UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False, index=True
    )
    model_id = Column(String, nullable=False, index=True)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2048)
    top_p = Column(Float, default=0.9)
    frequency_penalty = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "account_id": self.account_id,
            "model_id": self.model_id,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_p": self.top_p,
            "frequency_penalty": self.frequency_penalty,
            "created_at": (
                self.created_at.isoformat()
                if hasattr(self.created_at, "isoformat")
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if hasattr(self.updated_at, "isoformat")
                else None
            ),
        }

    @classmethod
    async def get_for_account(
        cls, session: AsyncSession, account_id: str
    ) -> list["ModelParameters"]:
        result = await session.execute(select(cls).where(cls.account_id == account_id))
        return list(result.scalars().all())

    @classmethod
    async def get_for_model(
        cls, session: AsyncSession, account_id: str, model_id: str
    ) -> Optional["ModelParameters"]:
        result = await session.execute(
            select(cls).where(cls.account_id == account_id, cls.model_id == model_id)
        )
        return result.scalars().first()

    @classmethod
    async def upsert(
        cls,
        session: AsyncSession,
        account_id: str,
        model_id: str,
        params: Dict[str, Any],
    ) -> "ModelParameters":
        obj = await cls.get_for_model(session, account_id, model_id)
        if obj:
            for k, v in params.items():
                if hasattr(obj, k):
                    setattr(obj, k, v)
            obj.updated_at = datetime.utcnow()
        else:
            obj = cls(account_id=account_id, model_id=model_id, **params)
            session.add(obj)
        await session.commit()
        return obj

    @classmethod
    async def delete_for_model(
        cls, session: AsyncSession, account_id: str, model_id: str
    ) -> bool:
        obj = await cls.get_for_model(session, account_id, model_id)
        if obj:
            await session.delete(obj)
            await session.commit()
            return True
        return False
