"""User / profile models for authentication sync and onboarding."""

from datetime import datetime

from pydantic import BaseModel, Field

from lib.dates import utcnow


class ProfileBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    degree: str = Field(min_length=2, max_length=120)
    branch: str = Field(min_length=2, max_length=120)
    graduation_year: int = Field(ge=2000, le=2040)
    skills: list[str] = Field(default_factory=list, max_length=30)
    projects: list[str] = Field(default_factory=list, max_length=15)
    experience: str = Field(default="", max_length=2000)
    target_role: str = Field(min_length=2, max_length=120)
    prep_level: str = Field(pattern="^(beginner|intermediate|advanced)$")
    weekly_hours: int = Field(ge=1, le=80)
    schedule_pref: str = Field(min_length=2, max_length=60)


class Profile(ProfileBase):
    user_id: str
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class OnboardingIn(ProfileBase):
    pass


class MeResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str | None = None
    onboarding_completed: bool = False
    profile: Profile | None = None
    created_at: datetime = Field(default_factory=utcnow)
