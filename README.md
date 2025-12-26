---
title: Potato Disease Classification Using CNN
sdk: docker
app_port: 7860
---

# Potato-Disease-Classification-Using-CNN

A CNN-based potato leaf disease classification project with a **FastAPI backend** and a **React frontend**.

---

## Setup for Python

### 1) Install Python
Install Python 3.11+ (recommended)  
Setup instructions: https://wiki.python.org/moin/BeginnersGuide

### 2) Create and activate a virtual environment (recommended)
From the project root:

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

### 3) Install Python packages
> Note: This repo currently contains `api/requirements.txt`.  
> If you don’t have a `Training/requirements.txt` file, you can skip training dependencies.

```bash
pip install --upgrade pip
pip install -r api/requirements.txt
```

If your API uses image upload, ensure this is installed:
```bash
pip install python-multipart
```

---

## Setup for ReactJS

### 1) Install Node.js + npm
- Node.js: https://nodejs.org/en/download/package-manager/
- npm: https://www.npmjs.com/get-npm

### 2) Install dependencies
```bash
cd frontend
npm install
```

### 3) Setup environment file
Copy `.env.example` to `.env`:
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Update the API URL inside `frontend/.env`:
```env
REACT_APP_API_URL=http://127.0.0.1:8000
```

---

## Training the Model (Optional)

1. Download dataset from Kaggle: https://www.kaggle.com/arjuntejaswi/plant-village  
2. Only keep folders related to Potatoes.
3. Run Jupyter Notebook:

```bash
cd Training
jupyter notebook
```

4. Open your notebook (example: `model.ipynb`).
5. Update dataset path in the notebook.
6. Run all cells to train the model.
7. Save the trained model inside `saved_models/` (example: `saved_models/1.keras`).

---

## Using FastAPI (Backend)

### 1) Start the backend
From the project root:

```bash
cd api
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2) Verify the backend
Open Swagger UI:
- http://127.0.0.1:8000/docs

Your prediction endpoint:
- `POST http://127.0.0.1:8000/predict`

> If you are running the frontend at `http://localhost:3000`, ensure CORS is enabled in the API.

---

## Running the Frontend

### 1) Start the frontend
From the project root:

```bash
cd frontend
npm start
```

Frontend will run on:
- http://localhost:3000

### 2) Predict from UI
Upload a potato leaf image → it calls:
- `POST /predict` on the FastAPI server and displays the label + confidence.

---

## Common Issues

### 1) 404 on prediction
Make sure frontend is calling:
- `http://127.0.0.1:8000/predict`
(not just `http://127.0.0.1:8000/`)

### 2) CORS / Network Error in browser
Enable CORS in `api/main.py` and allow:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Then restart backend.

### 3) Model not found
Ensure the model exists at:
- `saved_models/1.keras`

If you changed the model name/location, update the path in `api/main.py`.