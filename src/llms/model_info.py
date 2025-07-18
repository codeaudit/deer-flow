"""
LLM Model Info class with SQLAlchemy integration
"""

from datetime import datetime
from typing import Dict, List, Optional, Any

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.backend.database.base import Base


class ModelInfo(Base):
    """Extends existing ModelInfo with SQLAlchemy persistence"""

    __tablename__ = "llm_models"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    model = Column(String, nullable=False)
    provider = Column(String)
    context_window = Column(Integer)
    base_url = Column(String)
    verify_ssl = Column(Boolean, default=True)
    account_id = Column(String, ForeignKey("auth.users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, data: Optional[Dict[str, Any]] = None, **kwargs):
        """Initialize the model info"""
        if data is not None:
            kwargs.update(data)

        # Set defaults for dates if not provided
        if "created_at" not in kwargs:
            kwargs["created_at"] = datetime.utcnow()
        if "updated_at" not in kwargs:
            kwargs["updated_at"] = datetime.utcnow()

        super().__init__(**kwargs)

    def to_dict(self) -> Dict[str, Any]:
        """Convert the model info to a dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "model": self.model,
            "provider": self.provider,
            "context_window": self.context_window,
            "base_url": self.base_url,
            "verify_ssl": self.verify_ssl,
            "account_id": self.account_id,
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
    async def create(
        cls, session: AsyncSession, model_data: Dict[str, Any]
    ) -> "ModelInfo":
        """Create a new model info"""
        model_info = cls(model_data)
        session.add(model_info)
        await session.commit()
        return model_info

    @classmethod
    async def get_by_id(
        cls, session: AsyncSession, model_id: str
    ) -> Optional["ModelInfo"]:
        """Get a model info by ID"""
        result = await session.execute(select(cls).where(cls.id == model_id))
        return result.scalars().first()

    @classmethod
    async def get_all(cls, session: AsyncSession) -> List["ModelInfo"]:
        """Get all model infos"""
        result = await session.execute(select(cls))
        return list(result.scalars().all())

    @classmethod
    async def get_for_account(
        cls, session: AsyncSession, account_id: str
    ) -> List["ModelInfo"]:
        """Get all model infos for a specific account"""
        result = await session.execute(select(cls).where(cls.account_id == account_id))
        return list(result.scalars().all())

    @classmethod
    async def update(
        cls, session: AsyncSession, model_id: str, model_data: Dict[str, Any]
    ) -> Optional["ModelInfo"]:
        """Update a model info"""
        model_info = await cls.get_by_id(session, model_id)
        if model_info:
            for key, value in model_data.items():
                if hasattr(model_info, key):
                    setattr(model_info, key, value)
            model_info.updated_at = datetime.utcnow()
            await session.commit()
        return model_info

    @classmethod
    async def delete(cls, session: AsyncSession, model_id: str) -> bool:
        """Delete a model info"""
        model_info = await cls.get_by_id(session, model_id)
        if model_info:
            await session.delete(model_info)
            await session.commit()
            return True
        return False

    @classmethod
    async def get_or_create(
        cls, session: AsyncSession, model_data: Dict[str, Any]
    ) -> "ModelInfo":
        """Get or create a model info"""
        model_id = model_data.get("id")
        if not model_id:
            raise ValueError("Model ID is required")

        model_info = await cls.get_by_id(session, model_id)
        if not model_info:
            model_info = await cls.create(session, model_data)
        return model_info
