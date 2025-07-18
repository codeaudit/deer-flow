from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.backend.database.models import UserSettings
from typing import Optional, Dict, Any, cast, Union
import uuid


async def get_settings_by_user_id(
    session: AsyncSession, user_id: Union[str, uuid.UUID]
) -> Optional[Dict[str, Any]]:
    # Ensure user_id is a UUID object
    if isinstance(user_id, str):
        user_id = uuid.UUID(user_id)
    result = await session.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings_obj = result.scalars().first()
    if settings_obj:
        return cast(Dict[str, Any], settings_obj.settings)
    return None


async def upsert_settings_by_user_id(
    session: AsyncSession, user_id: Union[str, uuid.UUID], settings: Dict[str, Any]
) -> Dict[str, Any]:
    if isinstance(user_id, str):
        user_id = uuid.UUID(user_id)
    result = await session.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings_obj = result.scalars().first()
    if settings_obj:
        settings_obj.settings = cast(Any, settings)
    else:
        settings_obj = UserSettings(user_id=user_id, settings=settings)
        session.add(settings_obj)
    await session.commit()
    await session.refresh(settings_obj)
    return cast(Dict[str, Any], settings_obj.settings)


async def reset_settings_by_user_id(
    session: AsyncSession,
    user_id: Union[str, uuid.UUID],
    default_settings: Dict[str, Any],
) -> Dict[str, Any]:
    if isinstance(user_id, str):
        user_id = uuid.UUID(user_id)
    result = await session.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings_obj = result.scalars().first()
    if settings_obj:
        settings_obj.settings = cast(Any, default_settings)
        await session.commit()
        await session.refresh(settings_obj)
        return cast(Dict[str, Any], settings_obj.settings)
    else:
        settings_obj = UserSettings(user_id=user_id, settings=default_settings)
        session.add(settings_obj)
        await session.commit()
        await session.refresh(settings_obj)
        return cast(Dict[str, Any], settings_obj.settings)
