#!/bin/bash
# Goodly backend start script for Render
cd backend
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
