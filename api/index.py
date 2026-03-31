import sys
import os

# Append backend to path so we can resolve its imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the FastAPI application instance
from main import app
