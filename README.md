---
title: Potato Disease Classification Using CNN
sdk: docker
app_port: 7860
---

# Potato-Disease-Classification-Using-CNN

A CNN-based potato leaf disease classification project with a **FastAPI backend** and a **React frontend**.

## 🔗 Live Demo
- **App:** https://nb1907-potato-disease-classification-using-cnn.hf.space/
- **API Docs (Swagger):** https://nb1907-potato-disease-classification-using-cnn.hf.space/docs

---

## Local Setup

### 1) Python (Backend)

#### Prerequisites
- Python 3.11+ recommended

#### Create & activate virtual environment (recommended)

**Windows (PowerShell)**
```bash
python -m venv .venv
.\.venv\Scripts\activate
```

**macOS/Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### Install backend dependencies
From the project root:
```bash
pip install --upgrade pip
pip install -r api/requirements.txt
```

#### Run the backend
```bash
cd api
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend URLs:
- Swagger: http://127.0.0.1:8000/docs
- Predict endpoint: `POST http://127.0.0.1:8000/predict`

> If your API accepts image uploads, ensure `python-multipart` is installed:
```bash
pip install python-multipart
```

---

### 2) React (Frontend)

#### Prerequisites
- Node.js + npm

#### Install dependencies
```bash
cd frontend
npm install
```

#### Setup environment file
Copy `.env.example` to `.env`:

**Windows**
```bash
copy .env.example .env
```

**macOS/Linux**
```bash
cp .env.example .env
```

Set the API URL inside `frontend/.env`:
```env
REACT_APP_API_URL=http://127.0.0.1:8000/predict
```

#### Run the frontend
```bash
npm start
```

Frontend will run at:
- http://localhost:3000

---

## Training the Model (Optional)

1. Download dataset from Kaggle: https://www.kaggle.com/arjuntejaswi/plant-village  
2. Keep only folders related to Potatoes.
3. Run Jupyter Notebook:

```bash
cd Training
jupyter notebook
```

4. Open your notebook (example: `model.ipynb`).
5. Update the dataset path inside the notebook.
6. Run all cells to train the model.
7. Save the trained model inside:
   - `saved_models/1.keras` (or update the path in `api/main.py`)

---

## Deployment (Hugging Face Spaces)

This project is deployed as a **Docker Space** on Hugging Face:
- https://nb1907-potato-disease-classification-using-cnn.hf.space/

On Spaces, the frontend and backend run on the same domain, so the UI can call `/predict` without CORS issues.

---

## Common Issues

### 1) 404 when predicting
Make sure the frontend calls:
- `http://127.0.0.1:8000/predict` (local)
Not:
- `http://127.0.0.1:8000/`

### 2) Model not found
Ensure the model exists at:
- `saved_models/1.keras`
and the path in `api/main.py` matches the file location.