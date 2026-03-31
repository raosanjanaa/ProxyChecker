from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import io

from core.pipeline import DataUnderstandingEngine, BiasLocalizationEngine, BiasCorrectionEngine, CounterfactualValidator
from ai.explainer import ExplanationEngine

router = APIRouter(prefix="/api")

# In-memory storage of the current auditing session
session_state = {
    "raw_df": None,
    "target_col": "selected",
    "understanding": None,
    "localization": None,
    "correction": None,
    "counterfactuals": None,
    "corrected_df": None
}

class ColumnConfig(BaseModel):
    target_column: str = "selected"

@router.get("/")
def root():
    return {"status": "FairHire AI Backend Running"}

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
        session_state["raw_df"] = df
        
        # 1. Start Data Understanding
        engine = DataUnderstandingEngine(df, target_column=session_state["target_col"])
        stats = engine.analyze()
        session_state["understanding"] = stats
        
        return {
            "filename": file.filename,
            "understanding": stats,
            "preview": df.head(5).to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

@router.get("/bias-localization")
def bias_localization():
    df = session_state.get("raw_df")
    stats = session_state.get("understanding")
    if df is None or stats is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded yet.")
    
    sensitive_cols = stats.get("sensitive_detected", [])
    if not sensitive_cols:
        return {"message": "No sensitive columns detected automatically.", "disparate_impact": [], "correlations": []}
        
    engine = BiasLocalizationEngine(df, target_col=session_state["target_col"], sensitive_cols=sensitive_cols)
    di_metrics = engine.calculate_disparate_impact()
    correlations = engine.correlate_with_outcome()
    
    session_state["localization"] = {
        "disparate_impact": di_metrics,
        "correlations": correlations
    }
    
    return session_state["localization"]

@router.get("/bias-correction")
def bias_correction():
    df = session_state.get("raw_df")
    stats = session_state.get("understanding")
    if df is None or stats is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded yet.")
        
    sensitive_cols = stats.get("sensitive_detected", [])
    cat_cols = [c for c in stats.get("categorical", []) if c not in sensitive_cols] 
    # ^ Basic proxy removal strategy: exclude sensitive columns from training explicitly
    num_cols = stats.get("numerical", [])
    
    engine = BiasCorrectionEngine(df, session_state["target_col"], sensitive_cols, cat_cols, num_cols)
    
    thresholds, corrected_preds, adjustments = engine.apply_fairness_constraints(strategy="demographic_parity")
    corrected_text_df, text_deltas = engine.apply_textual_neutralization()
    
    # Store corrected state
    session_state["correction"] = adjustments
    corrected_df = corrected_text_df.copy()
    corrected_df[session_state["target_col"]] = corrected_preds
    session_state["corrected_df"] = corrected_df
    
    # Run Counterfactuals
    cf_validator = CounterfactualValidator(df, engine.model, session_state["target_col"], sensitive_cols)
    cf_cases = cf_validator.validate()
    session_state["counterfactuals"] = cf_cases
    
    return {
        "adjustments": adjustments,
        "thresholds": thresholds,
        "cf_count": len(cf_cases),
        "text_deltas": text_deltas[:50], # Send a sample of text changes
        "dropped_features": sensitive_cols
    }

@router.get("/reconstructed-decisions")
def reconstructed_decisions():
    cdf = session_state.get("corrected_df")
    odf = session_state.get("raw_df")
    if cdf is None:
        raise HTTPException(status_code=400, detail="No corrections applied yet.")
        
    # Find deltas
    target = session_state["target_col"]
    changed_df = cdf[cdf[target] != odf[target]]
    
    affected_candidates = []
    for idx in changed_df.head(50).index:
        affected_candidates.append({
            "candidate_id": str(cdf.loc[idx, "candidate_id"]),
            "original_decision": int(odf.loc[idx, target]),
            "new_decision": int(cdf.loc[idx, target])
        })
    
    return {
        "total_records": len(cdf),
        "total_changed": len(changed_df),
        "newly_selected": int((cdf[target] > odf[target]).sum()),
        "newly_rejected": int((cdf[target] < odf[target]).sum()),
        "affected_candidates": affected_candidates
    }

@router.get("/candidate-analysis/{candidate_id}")
def candidate_analysis(candidate_id: str):
    odf = session_state.get("raw_df")
    cdf = session_state.get("corrected_df")
    cfs = session_state.get("counterfactuals", [])
    
    if odf is None or cdf is None:
        raise HTTPException(status_code=400, detail="Data not ready.")
        
    orig_row = odf[odf['candidate_id'] == candidate_id]
    if orig_row.empty:
        raise HTTPException(status_code=404, detail="Candidate not found.")
        
    idx = orig_row.index[0]
    
    # Check if they were a counterfactual
    cf_data = next((c for c in cfs if c["row_index"] == idx), None)
    
    return {
        "original": orig_row.to_dict(orient="records")[0],
        "corrected": cdf.loc[idx].to_dict(),
        "is_counterfactual": cf_data is not None,
        "counterfactual_details": cf_data
    }

@router.get("/ai-explanation")
def ai_explanation():
    loc = session_state.get("localization")
    corr = session_state.get("correction")
    
    if not loc or not corr:
        raise HTTPException(status_code=400, detail="Must run localization and correction first.")
        
    explainer = ExplanationEngine()
    req_data = {
        "bias_metrics": loc.get("disparate_impact", []),
        "correction_strategy": corr
    }
    explanation = explainer.generate_explanation(req_data)
    
    return {"explanation": explanation}

@router.get("/download-sanitized-csv")
def download_sanitized_csv():
    cdf = session_state.get("corrected_df")
    if cdf is None:
        raise HTTPException(status_code=400, detail="No sanitized data available.")
        
    csv_str = cdf.to_csv(index=False)
    return PlainTextResponse(content=csv_str, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=proxyshield_sanitized_data.csv"})

@router.get("/download-audit-report")
def download_audit_report():
    loc = session_state.get("localization")
    corr = session_state.get("correction")
    if not loc or not corr:
        raise HTTPException(status_code=400, detail="Must run localization and correction first.")
        
    explainer = ExplanationEngine()
    req_data = {
        "bias_metrics": loc.get("disparate_impact", []),
        "correction_strategy": corr
    }
    explanation = explainer.generate_explanation(req_data)
    
    report = f"PROXYSHIELD - AUTONOMOUS AI AUDIT REPORT\n========================================\n\n{explanation}\n\n---\nReport automatically generated by ProxyShield AI Auditing Engine."
    
    return PlainTextResponse(content=report, media_type="text/plain", headers={"Content-Disposition": "attachment; filename=proxyshield_audit_report.txt"})
