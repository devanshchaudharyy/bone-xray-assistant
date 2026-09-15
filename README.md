# Bone X-Ray Assistant

Local Streamlit application for educational X-ray review with an optional Ollama
vision model. When Ollama is unavailable, the app remains usable in offline
fallback mode.

## Requirements

- Python 3.9 or newer
- Ollama is optional; install it and run `ollama pull llava` for real model
  analysis

## Setup on Windows

Open PowerShell in this project folder and run:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m streamlit run app.py
```

Open the URL printed by Streamlit, normally
`http://localhost:8501`. Do not use the deleted `venv` folder; `.venv` is the
single project environment.

## Optional Ollama setup

```powershell
ollama pull llava
```

Without Ollama, the application uses its built-in offline demonstration
response. Configuration can be provided through a `.env` file based on
`.env.example`.

## Verification

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

The test suite verifies upload-directory handling and the offline analysis/chat
pipeline. Uploaded images are stored in `uploads`.

## Safety

This is an experimental educational tool, not a medical diagnostic device.
Findings must be reviewed by a qualified radiologist or orthopedic specialist.
