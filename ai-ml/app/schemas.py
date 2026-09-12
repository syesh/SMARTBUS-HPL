from pydantic import BaseModel, Field
from typing import Optional

class ETARequest(BaseModel):
    # Required for backwards compatibility
    route_id: str = Field(..., description="The ID of the bus route")
    boarding_point_id: str = Field(..., description="The ID of the destination boarding point")
    distance_remaining_km: float = Field(..., ge=0, description="Distance remaining in kilometers")
    current_speed_kmh: float = Field(..., ge=0, description="Current speed in km/h")
    time_of_day: str = Field(..., description="Time of day in HH:MM format", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    
    # Optional extensions for future traffic/historical integration
    historical_average_travel_time: Optional[float] = Field(None, ge=0, description="Historical average travel time in minutes")
    historical_average_delay: Optional[float] = Field(None, description="Historical average delay in minutes")
    traffic_level: Optional[str] = Field("normal", description="Traffic level (normal, moderate, heavy)")

class ETAResponse(BaseModel):
    eta_minutes: float = Field(..., description="Estimated time of arrival in minutes")
    confidence: str = Field(..., description="Confidence level (ML, Low)")
    prediction_source: Optional[str] = Field(None, description="Source of the prediction (random_forest, heuristic)")
    traffic_level: Optional[str] = Field(None, description="Traffic level used for calculation")

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
