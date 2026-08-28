# ai/__init__.py
# ==============
# AI module namespace.
#
# Sub-modules are reserved for incremental implementation in later steps:
#
#   ai/stt/         — Speech-to-Text (e.g., OpenAI Whisper / Google STT)
#   ai/ocr/         — Optical Character Recognition (e.g., pytesseract)
#   ai/classifier/  — Scam classification model (e.g., scikit-learn, ONNX)
#   ai/shap/        — Explainability layer (SHAP values for classifier)
#   ai/embeddings/  — Semantic vector embeddings (e.g., sentence-transformers)
#   ai/llm/         — LLM reasoning layer (e.g., Google Gemini 2.5 Flash)
#
# Do NOT implement any logic here until the corresponding step is authorised.
