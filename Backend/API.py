from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import uuid
from datetime import datetime
import couchdb

app = FastAPI(root_path="/api")

# hinzufügen von CORS Middleware , um Anfragen von jeder Quelle zu erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  #Erlaubt Zugriffe von allen Domänen
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

class RandId(BaseModel):
    id: uuid.UUID

class ClickEvent(BaseModel):
    user_id: uuid.UUID
    group: str
    questionButton: str
    timestamp: datetime
    #end: datetime
    #advice: str
    #click_time: int

couch = couchdb.Server('http://admin:password@couchdb:5984/')
db = couch['click_events'] if 'click_events' in couch else couch.create('click_events')

@app.get("/test", response_model=TestAPI, tags=['test_api'])
def test_api():
    dict_test = {'test': 'Hallo Controller, hier ist XAI'}
    return(dict_test)

@app.get("/id", response_model = RandId)
def create_id():
    id = uuid.uuid4()
    dict_id = {'id': id}
    return dict_id

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

@app.post("/clicks", status_code=201)
def save_click_event(click_event: ClickEvent):
    try:
        click_event_doc = {
            "user_id": str(click_event.user_id),
            "group": click_event.group,
            "questionButton": click_event.questionButton,
            "timestamp": click_event.timestamp.isoformat(),
            #"end": click_event.end.isoformat(),
            #"advice": click_event.advice,
            #"click_time": click_event.click_time
        }
        db.save(click_event_doc)
        return {"message": "Click event saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
