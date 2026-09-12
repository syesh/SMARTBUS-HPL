import joblib
import pandas as pd
import logging
from pathlib import Path
from typing import Optional, Any
from .schemas import ETARequest

logger = logging.getLogger(__name__)

class ModelService:
    def __init__(self):
        self.model: Optional[Any] = None
        # Safely resolve model path relative to project root
        project_root = Path(__file__).resolve().parent.parent
        self.model_path = project_root / "models" / "eta_model.pkl"

    def load_model(self) -> bool:
        """Loads the Scikit-Learn model safely."""
        if self.model_path.exists():
            try:
                self.model = joblib.load(self.model_path)
                logger.info(f"Successfully loaded ML model from {self.model_path}")
                return True
            except Exception as e:
                logger.error(f"Failed to load ML model from {self.model_path}: {e}")
                self.model = None
                return False
        else:
            logger.warning(f"ML model not found at {self.model_path}. Will use fallback heuristic.")
            self.model = None
            return False

    def is_loaded(self) -> bool:
        return self.model is not None

    def predict(self, req: ETARequest) -> Optional[float]:
        """Runs the prediction using the ML model if loaded."""
        if not self.is_loaded():
            return None
        
        try:
            hour_of_day = int(req.time_of_day.split(":")[0])
        except ValueError:
            hour_of_day = 12

        input_df = pd.DataFrame([{
            'distance_remaining_km': req.distance_remaining_km,
            'current_speed_kmh': req.current_speed_kmh,
            'day_of_week': req.day_of_week,
            'hour_of_day': hour_of_day
        }])

        try:
            # Predict returns an array, we want the first element
            predicted_eta = float(self.model.predict(input_df)[0])
            return max(1.0, predicted_eta) # Ensure > 1 minute
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return None

# Singleton instance
model_service = ModelService()
