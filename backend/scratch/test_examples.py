import os
import sys
from fastapi.testclient import TestClient

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

from main import app
from ai.classifier.model_loader import load_classifier

load_classifier()
client = TestClient(app)

print("=== 1. SCAM EXAMPLE ===")
scam_res = client.post("/api/analyze", json={"text": "Your KYC will expire today. Share your OTP immediately."})
print("HTTP Status:", scam_res.status_code)
d1 = scam_res.json()
print("Prediction:", d1["prediction"])
print("Confidence:", d1["confidence"])
print("Risk Score:", d1["risk_score"])
print("Risk Level:", d1["risk_level"])
print("Fraud Type:", d1["fraud_type"])
print("Model:", d1["model"])
print("Senior Explanation:", d1["explanation"]["senior"]["message"])

print("\n=== 2. SAFE EXAMPLE ===")
safe_res = client.post("/api/analyze", json={"text": "Your electricity bill of Rs 540 is due tomorrow. Pay on the official app."})
print("HTTP Status:", safe_res.status_code)
d2 = safe_res.json()
print("Prediction:", d2["prediction"])
print("Confidence:", d2["confidence"])
print("Risk Score:", d2["risk_score"])
print("Risk Level:", d2["risk_level"])
print("Fraud Type:", d2["fraud_type"])
print("Model:", d2["model"])
print("Senior Explanation:", d2["explanation"]["senior"]["message"])
