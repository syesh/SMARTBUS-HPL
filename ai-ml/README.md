# Smart College Bus Tracking - ETA Service

This is the AI/ML ETA microservice that predicts bus arrival times using a Random Forest Regressor trained on historical trip data.

## Features
- **FastAPI** with robust Pydantic validation.
- **Scikit-Learn** integration for intelligent ETA predictions.
- **Deterministic Heuristic Fallback** logic for when the model is unavailable or training.
- Clean project structure and dependency management.

## Setup Instructions

### 1. Create and Activate Virtual Environment
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# macOS/Linux
python -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Generate Data and Train Model
If you do not have a trained model, run the training script to generate demo data and train a new model:
```bash
python train_model.py
```
*This will create `data/synthetic_demo_data.csv` and `models/eta_model.pkl`.*

### 4. Run the FastAPI Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Note: Using `python -m uvicorn` ensures the server uses the correct virtual environment interpreter.*

## Running Tests
To verify all endpoints and input validation, run:
```bash
pytest
```

## API Documentation
Once the server is running, interactive Swagger documentation is available at:
[http://localhost:8000/docs](http://localhost:8000/docs)

### Example `POST /predict-eta` Payload
```json
{
  "route_id": "Route A",
  "boarding_point_id": "bp-1",
  "distance_remaining_km": 5.0,
  "current_speed_kmh": 40.0,
  "time_of_day": "08:30",
  "day_of_week": 1,
  "traffic_level": "moderate"
}
```

### Example Response
```json
{
  "eta_minutes": 8.5,
  "confidence": "ML",
  "prediction_source": "random_forest",
  "traffic_level": "moderate"
}
```
