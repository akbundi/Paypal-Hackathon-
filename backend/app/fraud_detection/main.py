"""
FastAPI Application for AI-Powered Scam Detection Engine.
Exposes fraud analysis endpoints returning risk scores (0-100), indicators, and recommendations.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from .models import (
    InvoiceRequest,
    FraudAnalysisResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse
)
from .analyzer import ScamDetectionEngine

app = FastAPI(
    title="AI-Powered Scam Detection Engine",
    description=(
        "Production-grade scam and fraud detection API for invoices and transactions. "
        "Leverages GPT-OSS-120B for invoice understanding & multilingual explainability (English, Hindi, Marathi), "
        "selectively invokes GPT-OSS-Safeguard-120B for deep scam classification, "
        "and executes Python rules engines for amount anomaly detection and risk scoring."
    ),
    version="1.0.0"
)

# Enable CORS for web and client integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = ScamDetectionEngine()


@app.get("/", tags=["General"])
def root_info():
    """Service overview and API documentation references."""
    return {
        "service": "AI-Powered Scam Detection Engine",
        "version": "1.0.0",
        "docs_url": "/docs",
        "supported_languages": ["en (English)", "hi (Hindi - हिंदी)", "mr (Marathi - मराठी)"],
        "endpoints": {
            "analyze": "POST /api/v1/analyze",
            "batch_analyze": "POST /api/v1/analyze/batch",
            "supported_languages": "GET /api/v1/languages",
            "health": "GET /api/v1/health"
        }
    }


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    """Engine health and model availability status."""
    return {
        "status": "HEALTHY",
        "version": "1.0.0",
        "components": {
            "invoice_understanding": "GPT-OSS-120B (Active)",
            "scam_language_safeguard": "GPT-OSS-Safeguard-120B (Selective Mode)",
            "amount_anomaly_engine": "Python (Active)",
            "merchant_mismatch_engine": "Python + GPT-OSS-120B (Active)",
            "risk_scoring_engine": "Python Rules Engine (0-100 Active)",
            "multilingual_explainability": "English, Hindi, Marathi (Active)"
        }
    }


@app.get("/api/v1/languages", tags=["Localization"])
def get_supported_languages():
    """Returns supported languages for fraud explanations and recommendations."""
    return {
        "languages": [
            {
                "code": "en",
                "name": "English",
                "native_name": "English",
                "description": "Standard English explanations and security recommendations."
            },
            {
                "code": "hi",
                "name": "Hindi",
                "native_name": "हिंदी",
                "description": "स्वाभाविक हिंदी स्पष्टीकरण एवं सुरक्षा मार्गदर्शन (Devanagari)."
            },
            {
                "code": "mr",
                "name": "Marathi",
                "native_name": "मराठी",
                "description": "नैसर्गिक मराठी स्पष्टीकरण आणि सुरक्षा सूचना (Devanagari)."
            }
        ]
    }


@app.post(
    "/api/v1/analyze",
    response_model=FraudAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Scam Detection"]
)
def analyze_invoice(request: InvoiceRequest):
    """
    Analyze an invoice for fraud, fake urgency, amount anomalies, and merchant mismatches.
    Returns risk score (0-100), risk indicators, selective safeguard report, and explanations.
    """
    try:
        response = engine.analyze_invoice(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing invoice: {str(e)}"
        )


@app.post(
    "/api/v1/analyze/batch",
    response_model=BatchAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Scam Detection"]
)
def batch_analyze_invoices(request: BatchAnalysisRequest):
    """
    Analyze multiple invoices concurrently in batch mode.
    """
    results: List[FraudAnalysisResponse] = []
    high_risk_count = 0

    for inv in request.invoices:
        res = engine.analyze_invoice(inv)
        results.append(res)
        if res.risk_level in ["HIGH", "CRITICAL"]:
            high_risk_count += 1

    return BatchAnalysisResponse(
        results=results,
        total_processed=len(results),
        high_risk_count=high_risk_count
    )

