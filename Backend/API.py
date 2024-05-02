from fastapi import FastAPI
from pydantic import BaseModel
import json
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# hinzufügen von CORS Middleware , um Anfragen von jeder Quelle zu erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Erlaubt Zugriffe von allen Domänen
    allow_credentials=True,
    allow_methods=["*"],  # Erlaubt alle Methoden
    allow_headers=["*"],  # Erlaubt alle Header
)

class FeatureImportance(BaseModel):
    col_name: str
    percentage_importance: float

@app.get("/data/", response_model=List[FeatureImportance])
def get_data():
    try:
        with open("shap_feature_importance.json", "r") as file:
            data = json.load(file)
            return data
    except FileNotFoundError:
        return {"error": "File not found"}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}
