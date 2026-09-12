from .schemas import ETARequest

def calculate_heuristic_eta(req: ETARequest) -> float:
    """
    Calculates a deterministic fallback ETA based on distance and speed.
    """
    # 1. Base time calculation
    if req.current_speed_kmh > 0:
        base_time_minutes = (req.distance_remaining_km / req.current_speed_kmh) * 60
    else:
        # Default assumed speed if bus is stopped
        default_speed_kmh = 20.0
        base_time_minutes = (req.distance_remaining_km / default_speed_kmh) * 60

    # 2. Apply deterministic traffic factor based on traffic level
    traffic_multipliers = {
        "normal": 1.0,
        "moderate": 1.2,
        "heavy": 1.5
    }
    
    # Default to "normal" if missing or unrecognized
    level = req.traffic_level.lower() if req.traffic_level else "normal"
    multiplier = traffic_multipliers.get(level, 1.0)
    
    adjusted_eta = base_time_minutes * multiplier
    
    # Ensure ETA is at least 1 minute
    return max(1.0, adjusted_eta)
