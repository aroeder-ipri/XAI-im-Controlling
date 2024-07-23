from fastapi import FastAPI
from pydantic import BaseModel
import json
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(root_path="/api")

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

class CounterfactualExplanation(BaseModel):
    sales_actual: float
    sales_counterfactual: float
    changes: List[str]

class TestAPI(BaseModel):
    test: str

@app.get("/test", response_model=TestAPI, tags=['test_api'])
def test_api():
    dict_test = {'test': 'Hallo Controller, hier ist XAI'}
    return(dict_test)



@app.get("/feature_importance/", response_model=List[FeatureImportance], tags=["feature_importance"])
def get_feature_importance():
    try:
        with open("shap_feature_importance.json", "r") as file:
            data = json.load(file)
            return data
    except FileNotFoundError:
        return {"error": "File not found"}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

@app.get("/counterfactual_explanations/", response_model=List[CounterfactualExplanation], tags=["counterfactual_explanations"])
def get_counterfactual_explanations():
    try:
        with open("counterfactual_explanations.json", "r") as file:
            data = json.load(file)
            counterfactual_explanations = [
                CounterfactualExplanation(**data)
            ]
            return counterfactual_explanations
    except FileNotFoundError:
        return {"error": "File not found"}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}