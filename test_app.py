import os
import json
from PIL import Image
from ai_agent import XRayAnalysisAgent, MEDICAL_DISCLAIMER, ensure_upload_dir

def test_upload_directory_replaces_conflicting_file(tmp_path):
    upload_dir = tmp_path / "uploads"
    upload_dir.write_text("not a directory")

    from ai_agent import ensure_upload_dir

    resolved_path = ensure_upload_dir(str(upload_dir))
    assert resolved_path == str(upload_dir)
    assert upload_dir.is_dir(), "Uploads path should be restored as a directory."


def test_pipeline():
    print("=== Running Autonomous Pipeline Tests ===")
    
    # 1. Test upload directory setup
    upload_dir = "uploads"
    ensure_upload_dir(upload_dir)
    assert os.path.exists(upload_dir), "Uploads directory creation failed!"
    assert os.path.isdir(upload_dir), "Uploads path is not a directory!"
    print("✓ Uploads directory verified.")

    # 2. Generate dummy image for verification
    dummy_img_path = os.path.join(upload_dir, "test_xray.png")
    img = Image.new("RGB", (256, 256), color="gray")
    img.save(dummy_img_path)
    assert os.path.exists(dummy_img_path), "Dummy image creation failed!"
    print("✓ Test X-Ray image generated.")

    # 3. Instantiate Agent
    agent = XRayAnalysisAgent()
    print("✓ Agent instantiated.")

    # 4. Test Structured Vision Analysis
    analysis = agent.analyze_xray(dummy_img_path)
    assert isinstance(analysis, dict), "Analysis result must be a dictionary!"
    assert "disclaimer" in analysis, "Analysis result missing safety disclaimer!"
    assert MEDICAL_DISCLAIMER in analysis["disclaimer"], "Disclaimer content mismatch!"
    print("✓ Vision analysis agent pipeline output structure verified.")

    # 5. Test Chat Follow-up
    chat_response = agent.chat_followup(
        chat_history=[],
        user_message="Is there a fracture in this image?",
        image_analysis=analysis
    )
    assert isinstance(chat_response, str), "Chat response must be a string!"
    assert MEDICAL_DISCLAIMER in chat_response, "Chat response missing mandatory disclaimer!"
    print("✓ Chat response and safety validator verified.")

    # Cleanup test artifact
    if os.path.exists(dummy_img_path):
        os.remove(dummy_img_path)

    print("\n✅ ALL SYSTEM INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    test_pipeline()