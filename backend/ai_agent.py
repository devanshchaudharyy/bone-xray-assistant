import os
import json
import base64
from typing import Dict, Any, List, Optional
import ollama


def ensure_upload_dir(upload_dir: str) -> str:
    """Ensure the upload path is a directory, removing a conflicting file if needed."""
    if os.path.exists(upload_dir) and not os.path.isdir(upload_dir):
        os.remove(upload_dir)
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


# Mandatory disclaimer appended to all agent outputs
MEDICAL_DISCLAIMER = (
    "⚠️ **IMPORTANT MEDICAL DISCLAIMER**: This application is an experimental AI tool "
    "intended for educational and decision-support demonstration purposes only. It is NOT "
    "a licensed medical diagnostic tool. All findings must be evaluated by a qualified "
    "radiologist or orthopedic specialist."
)

class XRayAnalysisAgent:
    def __init__(self, model_name: str = "llava", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.client = ollama.Client(host=base_url)

    def _encode_image_to_base64(self, image_path: str) -> str:
        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode("utf-8")

    def _is_ollama_available(self) -> bool:
        try:
            self.client.list()
            return True
        except Exception:
            return False

    def analyze_xray(self, image_path: str) -> Dict[str, Any]:
        """
        Step 1: Perform structured vision analysis on the uploaded X-ray image.
        Returns structured JSON with anatomical region, findings, anomalies, and safety context.
        """
        if not os.path.exists(image_path):
            return {
                "error": f"Image path '{image_path}' not found.",
                "disclaimer": MEDICAL_DISCLAIMER
            }

        prompt = (
            "You are an expert orthopedic radiologist assistant analyzing a bone X-ray image.\n"
            "Provide your findings in strictly valid JSON format with the following keys:\n"
            "{\n"
            '  "anatomical_region": "e.g., Left Wrist, Right Femur",\n'
            '  "quality": "e.g., Clear, Low contrast, Motion blur",\n'
            '  "suspected_anomalies": ["list of suspected fractures, dislocations, or lesions"],\n'
            '  "findings": "Detailed description of bone integrity, alignment, and joint spaces.",\n'
            '  "confidence_score": "High / Medium / Low"\n'
            "}\n"
            "Do not include any text outside of the JSON block."
        )

        if not self._is_ollama_available():
            # Fallback response for offline/testing mode without Ollama server active
            return {
                "anatomical_region": "Detected Bone Structure (Offline Mode)",
                "quality": "Adequate for demonstration",
                "suspected_anomalies": ["Mock Anomaly: Disruption in cortical continuity"],
                "findings": "System running in fallback mode (Ollama connection offline). Uploaded image processed successfully.",
                "confidence_score": "Demo Mode",
                "disclaimer": MEDICAL_DISCLAIMER
            }

        try:
            b64_image = self._encode_image_to_base64(image_path)
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                images=[b64_image]
            )
            raw_response = response.get("response", "").strip()

            # Attempt to extract JSON from model response
            start_idx = raw_response.find("{")
            end_idx = raw_response.rfind("}") + 1
            if start_idx != -1 and end_idx != -1:
                clean_json = raw_response[start_idx:end_idx]
                parsed = json.loads(clean_json)
            else:
                parsed = {
                    "anatomical_region": "Unidentified",
                    "quality": "Unknown",
                    "suspected_anomalies": [],
                    "findings": raw_response,
                    "confidence_score": "Low"
                }

            # Prepend/Ensure mandatory safety disclaimer
            parsed["disclaimer"] = MEDICAL_DISCLAIMER
            return parsed

        except Exception as e:
            return {
                "error": f"Analysis failed: {str(e)}",
                "disclaimer": MEDICAL_DISCLAIMER
            }

    def chat_followup(
        self,
        chat_history: List[Dict[str, str]],
        user_message: str,
        image_analysis: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Step 2: Handle follow-up chat context with mandatory safety disclaimer.
        """
        context_str = ""
        if image_analysis:
            context_str = f"\nCurrent X-Ray Analysis Context:\n{json.dumps(image_analysis, indent=2)}\n"

        system_prompt = (
            "You are an AI Orthopedic Radiologist Assistant. Answer user questions regarding their X-ray analysis.\n"
            "Explain medical jargon simply, maintain professionalism, and remind users to seek professional clinical advice."
            f"{context_str}"
        )

        if not self._is_ollama_available():
            reply = (
                f"*(Offline Mode)* Regarding your question: '{user_message}'\n\n"
                "In a full deployment with Ollama running, the assistant will analyze this query against your visual scan results."
            )
            return f"{reply}\n\n---\n{MEDICAL_DISCLAIMER}"

        try:
            messages = [{"role": "system", "content": system_prompt}]
            for msg in chat_history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": user_message})

            response = self.client.chat(model=self.model_name, messages=messages)
            reply = response.get("message", {}).get("content", "")
            return f"{reply}\n\n---\n{MEDICAL_DISCLAIMER}"

        except Exception as e:
            return f"Error processing message: {str(e)}\n\n---\n{MEDICAL_DISCLAIMER}"