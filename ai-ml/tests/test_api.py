import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI/ML Service for Smart Bus is running."}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data

def test_predict_eta_valid():
    payload = {
        "route_id": "Route A",
        "boarding_point_id": "bp-1",
        "distance_remaining_km": 5.0,
        "current_speed_kmh": 40.0,
        "time_of_day": "08:30",
        "day_of_week": 1
    }
    response = client.post("/predict-eta", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "eta_minutes" in data
    assert data["eta_minutes"] >= 1.0
    assert data["confidence"] in ["ML", "Low"]

def test_predict_eta_invalid_distance():
    payload = {
        "route_id": "Route A",
        "boarding_point_id": "bp-1",
        "distance_remaining_km": -5.0, # Invalid
        "current_speed_kmh": 40.0,
        "time_of_day": "08:30",
        "day_of_week": 1
    }
    response = client.post("/predict-eta", json=payload)
    assert response.status_code == 422 # Unprocessable Entity

def test_predict_eta_invalid_day():
    payload = {
        "route_id": "Route A",
        "boarding_point_id": "bp-1",
        "distance_remaining_km": 5.0,
        "current_speed_kmh": 40.0,
        "time_of_day": "08:30",
        "day_of_week": 8 # Invalid
    }
    response = client.post("/predict-eta", json=payload)
    assert response.status_code == 422
