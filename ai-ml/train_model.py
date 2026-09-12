import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"

def generate_synthetic_data(num_records=1000) -> pd.DataFrame:
    np.random.seed(42)
    # Mock Features
    distance_remaining = np.random.uniform(0.5, 20.0, num_records) # km
    current_speed = np.random.uniform(10.0, 60.0, num_records) # km/h
    day_of_week = np.random.randint(0, 7, num_records)
    hour_of_day = np.random.randint(6, 20, num_records) 
    
    # Base calculation: Time = Distance / Speed * 60 (to get minutes)
    base_time = (distance_remaining / current_speed) * 60
    
    # Introduce traffic delays based on time of day
    traffic_multiplier = np.ones(num_records)
    peak_mask = ((hour_of_day >= 8) & (hour_of_day <= 10)) | ((hour_of_day >= 17) & (hour_of_day <= 19))
    traffic_multiplier[peak_mask] = np.random.uniform(1.2, 2.0, size=peak_mask.sum())
    
    # Weekend multiplier
    weekend_mask = (day_of_week >= 5)
    traffic_multiplier[weekend_mask] *= 0.8
    
    actual_time = base_time * traffic_multiplier + np.random.normal(0, 2, num_records)
    actual_time = np.maximum(actual_time, 1.0) # Cannot be less than 1 min
    
    df = pd.DataFrame({
        'distance_remaining_km': distance_remaining,
        'current_speed_kmh': current_speed,
        'day_of_week': day_of_week,
        'hour_of_day': hour_of_day,
        'actual_time_minutes': actual_time
    })
    
    DATA_DIR.mkdir(exist_ok=True)
    csv_path = DATA_DIR / "synthetic_demo_data.csv"
    df.to_csv(csv_path, index=False)
    logger.info(f"Synthetic demo data saved to {csv_path}")
    
    return df

def train_model():
    logger.info("Generating synthetic historical trip data...")
    df = generate_synthetic_data(5000)
    
    X = df[['distance_remaining_km', 'current_speed_kmh', 'day_of_week', 'hour_of_day']]
    y = df['actual_time_minutes']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    logger.info("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    logger.info(f"Model trained successfully. Mean Absolute Error on test set: {mae:.2f} minutes")
    
    MODELS_DIR.mkdir(exist_ok=True)
    model_path = MODELS_DIR / "eta_model.pkl"
    joblib.dump(model, model_path)
    logger.info(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
