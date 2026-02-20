#!/usr/bin/env bash
# Build script for Render deployment
# Render runs this during the build phase

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Checking for ML model files ==="
MODEL_DIR="./models"

if [ ! -f "$MODEL_DIR/content_based_enhanced.pkl" ] || [ ! -f "$MODEL_DIR/collaborative_model.pkl" ]; then
    echo "Models not found. Training models..."
    
    # Train the models (they need DB connection)
    echo "Training content-based enhanced model..."
    python src/models/train_enhanced.py || echo "WARNING: Content model training failed (may need data)"
    
    echo "Training collaborative model..."
    python src/models/train_collaborative.py || echo "WARNING: Collaborative model training failed (may need data)"
    
    echo "Model training complete."
else
    echo "Models already exist. Skipping training."
fi

echo "=== Build complete ==="
