from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf
from pathlib import Path
from fastapi.staticfiles import StaticFiles
import os
from fastapi.responses import JSONResponse


app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = (BASE_DIR / ".." / "saved_models" / "1.keras").resolve()

MODEL = tf.keras.models.load_model(str(MODEL_PATH))

CLASS_NAMES = ["Early Blight", "Late Blight", "Healthy"]
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.80"))

# ---------------------------
# Plant/Leaf "Gate" Settings
# ---------------------------
# NOTE: For ImageNet models, 0.80 is usually too strict.
# Recommended: start with 0.30 - 0.45 and tune.
PLANT_THRESHOLD = float(os.getenv("PLANT_THRESHOLD", "0.35"))
PLANT_MODEL = tf.keras.applications.MobileNetV2(weights="imagenet")

# Keywords that indicate "plant-like" classes in ImageNet labels
PLANT_KEYWORDS = {
    "plant", "leaf", "tree", "flower", "fruit", "vegetable", "mushroom",
    "corn", "cabbage", "broccoli", "lettuce", "spinach", "artichoke",
    "banana", "strawberry", "orange", "lemon", "pineapple", "pomegranate",
    "fig", "jackfruit", "grape", "acorn", "hay", "rapeseed", "wheat",
    "buckwheat", "moss", "fungus", "lichen", "herb"
}


def read_file_as_image(data) -> np.ndarray:
    # Force RGB (handles PNG alpha / grayscale safely)
    img = Image.open(BytesIO(data)).convert("RGB")
    return np.array(img)


def plant_confidence(img_rgb: np.ndarray, top_k: int = 50):
    """
    Uses ImageNet pretrained MobileNetV2 to estimate if the input looks like plant/leaf.
    Instead of using max(prob), we SUM plant-like probabilities in top_k predictions.
    Returns:
      plant_score: float in [0, 1]
      topk: list of (label, prob)
    """
    x = tf.convert_to_tensor(img_rgb)
    x = tf.image.resize(x, (224, 224))
    x = tf.cast(x, tf.float32)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
    x = tf.expand_dims(x, 0)

    preds = PLANT_MODEL(x, training=False).numpy()
    topk = tf.keras.applications.mobilenet_v2.decode_predictions(preds, top=top_k)[0]

    plant_score = 0.0
    topk_clean = []

    for _, label, prob in topk:
        label_l = label.lower().replace("_", " ")
        p = float(prob)
        topk_clean.append((label_l, p))

        if any(k in label_l for k in PLANT_KEYWORDS):
            plant_score += p

    # clamp just in case floating sum goes slightly above 1
    plant_score = float(min(1.0, plant_score))
    return plant_score, topk_clean


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image = read_file_as_image(await file.read())

    # 1) Gate: reject non-plant images
    plant_score, topk = plant_confidence(image, top_k=50)

    if plant_score < PLANT_THRESHOLD:
        return JSONResponse(
            status_code=200,
            content={
                "accepted": False,
                "class": None,
                "confidence": None,
                "plant_confidence": plant_score,
                "message": (
                    f"Invalid image. Please upload a plant/leaf image (potato leaf preferred). "
                    f"Plant confidence: {plant_score*100:.2f}%."
                ),
                # Optional debug: comment this out if you don't want it
                "topk_imagenet": topk[:10]
            }
        )

    # 2) Run disease model
    img_batch = np.expand_dims(image, 0)
    preds = MODEL.predict(img_batch)
    confidence = float(np.max(preds[0]))
    predicted_idx = int(np.argmax(preds[0]))
    predicted_class = CLASS_NAMES[predicted_idx]

    # 3) Disease confidence gate
    if confidence < CONF_THRESHOLD:
        return JSONResponse(
            status_code=200,
            content={
                "accepted": False,
                "class": None,
                "confidence": confidence,
                "plant_confidence": plant_score,
                "message": (
                    f"Low confidence ({confidence*100:.2f}%). "
                    "Please upload a clear potato leaf image (good lighting, leaf in focus)."
                )
            }
        )

    return {
        "accepted": True,
        "class": predicted_class,
        "confidence": confidence,
        "plant_confidence": plant_score
    }


FRONTEND_BUILD_DIR = (BASE_DIR / ".." / "frontend" / "build").resolve()
if FRONTEND_BUILD_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_BUILD_DIR), html=True), name="frontend")


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)