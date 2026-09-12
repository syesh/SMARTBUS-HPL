import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .schemas import ETARequest, ETAResponse, HealthResponse
from .eta_service import calculate_heuristic_eta
from .model_service import model_service

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the ML model
    logger.info("Starting up Smart Bus ETA Service...")
    model_service.load_model()
    yield
    # Shutdown: Clean up resources if necessary
    logger.info("Shutting down Smart Bus ETA Service...")

app = FastAPI(title="Smart Bus AI/ML ETA Service", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "AI/ML Service for Smart Bus is running."}

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        model_loaded=model_service.is_loaded()
    )

@app.post("/predict-eta", response_model=ETAResponse)
def predict_eta(req: ETARequest):
    logger.info(f"Received ETA request for route: {req.route_id}")
    
    # Attempt ML Prediction
    predicted_eta = model_service.predict(req)
    
    if predicted_eta is not None:
        confidence = "ML"
        source = "random_forest"
    else:
        # Fallback to heuristic
        predicted_eta = calculate_heuristic_eta(req)
        confidence = "Low"
        source = "heuristic"
        
    return ETAResponse(
        eta_minutes=round(predicted_eta, 1),
        confidence=confidence,
        prediction_source=source,
        traffic_level=req.traffic_level or "normal"
    )
