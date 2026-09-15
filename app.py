import os
import uuid
import streamlit as st
from PIL import Image
from dotenv import load_dotenv
from ai_agent import XRayAnalysisAgent, MEDICAL_DISCLAIMER

# Load environment configuration
load_dotenv()
OLLAMA_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llava")
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Page configuration
st.set_page_config(
    page_title="RadVision AI | Orthopedic Diagnostic Suite",
    page_icon="🦴",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Advanced UI/UX Custom Styling (Obsidian Medical Theme)
st.markdown("""
<style>
    /* Dark Obsidian Core Background */
    .stApp {
        background: #090D16 !important;
        color: #E2E8F0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Clean layout container padding without header clipping */
    .block-container {
        padding-top: 1.5rem !important;
        padding-bottom: 2rem !important;
        max-width: 96% !important;
    }

    /* Custom Header Component */
    .hero-header {
        background: linear-gradient(135deg, #111827 0%, #1E293B 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 1.25rem 1.75rem;
        margin-bottom: 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.6);
    }
    
    .brand-title {
        font-size: 1.6rem;
        font-weight: 800;
        color: #FFFFFF;
        letter-spacing: -0.02em;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .brand-badge {
        background: linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%);
        color: #FFFFFF;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.25rem 0.65rem;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Safety Disclaimer Banner */
    .disclaimer-box {
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.25);
        border-radius: 12px;
        padding: 0.85rem 1.25rem;
        color: #FBBF24;
        font-size: 0.82rem;
        margin-bottom: 1.5rem;
        line-height: 1.4;
    }

    /* Glassmorphic Cards */
    .glass-card {
        background: rgba(17, 24, 39, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 1.1rem;
        backdrop-filter: blur(12px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        margin-bottom: 0.75rem;
    }

    .card-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #64748B;
        letter-spacing: 0.05em;
        margin-bottom: 0.35rem;
    }

    .card-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #F8FAFC;
    }

    /* Status Badges */
    .anomaly-pill {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #FCA5A5;
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.4rem 0.85rem;
        border-radius: 8px;
        display: inline-block;
        margin: 0.25rem 0.25rem 0.25rem 0;
    }

    .normal-pill {
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #86EFAC;
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.4rem 0.85rem;
        border-radius: 8px;
        display: inline-block;
    }

    /* Sidebar Clean Styling */
    section[data-testid="stSidebar"] {
        background-color: #0D131F !important;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }
</style>
""", unsafe_allow_html=True)

# Initialize Vision Agent
agent = XRayAnalysisAgent(model_name=OLLAMA_MODEL, base_url=OLLAMA_URL)
is_ollama_active = agent._is_ollama_available()

# Session State Persistence
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "analysis_result" not in st.session_state:
    st.session_state.analysis_result = None

# Top Navigation Bar (Static Flow Header)
st.markdown("""
<div class="hero-header">
    <div class="brand-title">
        🦴 RadVision AI <span class="brand-badge">Orthopedic Suite</span>
    </div>
    <div style="font-size: 0.85rem; color: #94A3B8;">
        Local Multimodal AI Vision Workspace
    </div>
</div>
""", unsafe_allow_html=True)

# Safety Medical Disclaimer Banner
st.markdown(f'<div class="disclaimer-box">{MEDICAL_DISCLAIMER}</div>', unsafe_allow_html=True)

# Sidebar Controls
with st.sidebar:
    st.markdown("### 📥 Import Radiograph")
    uploaded_file = st.file_uploader(
        "Upload PNG / JPEG Orthopedic Scan",
        type=["png", "jpg", "jpeg"]
    )

    if uploaded_file is not None:
        file_ext = os.path.splitext(uploaded_file.name)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        saved_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(saved_path, "wb") as f:
            f.write(uploaded_file.getbuffer())

        st.image(saved_path, caption="Active Scan", use_container_width=True)

        if st.button("🚀 Run Vision Pipeline", type="primary", use_container_width=True):
            with st.spinner("Analyzing cortical integrity..."):
                analysis = agent.analyze_xray(saved_path)
                st.session_state.analysis_result = analysis
                st.toast("Analysis complete!", icon="✅")

    st.markdown("---")
    st.markdown("### 🔌 System Diagnostics")
    
    if is_ollama_active:
        st.success("Ollama Engine: Active (Live AI)")
    else:
        st.error("Ollama Engine: Offline (Fallback Mode)")

    st.caption(f"Target Vision Model: `{OLLAMA_MODEL}`")

# Workspace Grid: 2 Equal Columns
col1, col2 = st.columns([1.05, 0.95], gap="large")

with col1:
    st.markdown("### 📊 Vision Analytics")
    
    if st.session_state.analysis_result:
        res = st.session_state.analysis_result
        
        if "error" in res:
            st.error(res["error"])
        else:
            # 3-Metric Metric Row
            m1, m2, m3 = st.columns(3)
            with m1:
                st.markdown(f'''
                <div class="glass-card">
                    <div class="card-label">Anatomical Region</div>
                    <div class="card-value">{res.get('anatomical_region', 'Unknown')}</div>
                </div>
                ''', unsafe_allow_html=True)
            with m2:
                st.markdown(f'''
                <div class="glass-card">
                    <div class="card-label">Scan Quality</div>
                    <div class="card-value">{res.get('quality', 'N/A')}</div>
                </div>
                ''', unsafe_allow_html=True)
            with m3:
                st.markdown(f'''
                <div class="glass-card">
                    <div class="card-value" style="font-size: 1.1rem; padding-top: 0.2rem;">{res.get('confidence_score', 'N/A')}</div>
                    <div class="card-label">Confidence</div>
                </div>
                ''', unsafe_allow_html=True)

            st.markdown("<br>", unsafe_allow_html=True)
            
            # Indications & Abnormalities
            st.markdown("**Identified Indications:**")
            anomalies = res.get("suspected_anomalies", [])
            if anomalies:
                badge_html = "".join([f'<span class="anomaly-pill">🚨 {item}</span>' for item in anomalies])
                st.markdown(badge_html, unsafe_allow_html=True)
            else:
                st.markdown('<span class="normal-pill">✓ No acute structural fractures detected</span>', unsafe_allow_html=True)

            st.markdown("<br>", unsafe_allow_html=True)
            
            # Findings Narrative
            st.markdown("**Radiology Summary Narrative:**")
            st.info(res.get("findings", "No diagnostic text generated."))
    else:
        st.info("👈 Upload an X-ray scan from the left sidebar and click **Run Vision Pipeline** to view findings.")

with col2:
    st.markdown("### 💬 Clinical AI Assistant")
    
    # Scrollable Chat Container (450px viewport lock)
    chat_box = st.container(height=450)
    
    with chat_box:
        if not st.session_state.chat_history:
            st.caption("Ask clinical questions regarding bone structure, fracture types, or joint alignment based on this scan.")
            
        for msg in st.session_state.chat_history:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])

    # Chat Input Box
    if user_query := st.chat_input("Ask a clinical follow-up question..."):
        st.session_state.chat_history.append({"role": "user", "content": user_query})
        
        with chat_box:
            with st.chat_message("user"):
                st.markdown(user_query)

            with st.chat_message("assistant"):
                with st.spinner("Analyzing context..."):
                    reply = agent.chat_followup(
                        chat_history=st.session_state.chat_history[:-1],
                        user_message=user_query,
                        image_analysis=st.session_state.analysis_result
                    )
                    st.markdown(reply)
                    st.session_state.chat_history.append({"role": "assistant", "content": reply})