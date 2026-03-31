import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from api import routes

app = FastAPI(title="FairHire AI - Bias Auditing Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

# Cloud Run / Unified Hosting Static Mount
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.isdir(frontend_dist):
    # Mount the assets specifically
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    # Catch-all for React Router SPA
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Do not intercept API requests
        if full_path.startswith("api/"):
            from starlette.responses import JSONResponse
            return JSONResponse({"detail": "Not Found API Route"}, status_code=404)
            
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        
        return {"error": "Frontend build not found. Run npm run build."}

if __name__ == "__main__":
    import uvicorn
    # Use PORT env variable supplied by Cloud Run, fallback to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
