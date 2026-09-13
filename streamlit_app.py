"""Run the tortoise date invitation on Streamlit Community Cloud."""

from base64 import b64encode
from pathlib import Path

import streamlit as st


FRONTEND = Path(__file__).resolve().parent / "frontend"


def invitation_html() -> str:
    """Bundle trusted local assets so the iframe has no relative URL requests."""
    document = (FRONTEND / "index.html").read_text(encoding="utf-8")
    css = (FRONTEND / "styles.css").read_text(encoding="utf-8")
    javascript = (FRONTEND / "app.js").read_text(encoding="utf-8")
    image = b64encode((FRONTEND / "tortoise-couple-cartoon.png").read_bytes()).decode("ascii")

    # Let Streamlit measure the document's content instead of making its height
    # depend on the iframe viewport. This also follows changing screen heights.
    css += "\nbody, main { min-height: 0 !important; }\n"
    document = document.replace(
        '<link rel="stylesheet" href="styles.css">', f"<style>{css}</style>"
    )
    document = document.replace('<script src="app.js" defer></script>', "")
    document = document.replace(
        'src="tortoise-couple-cartoon.png"', f'src="data:image/png;base64,{image}"'
    )
    # Inline scripts must run after the DOM exists; defer only applies to src.
    return document.replace("</body>", f"<script>{javascript}</script>\n</body>")


st.set_page_config(
    page_title="可以跟小烏龜約會嗎？！",
    page_icon="🐢",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.html("""
<style>
  [data-testid="stAppViewContainer"] { background: #f7f6f4; }
  [data-testid="stHeader"] { background: transparent; }
  [data-testid="stMainBlockContainer"] {
    max-width: none;
    padding: 0;
  }
  [data-testid="stVerticalBlock"] { gap: 0; }
</style>
""")

st.iframe(invitation_html(), width="stretch", height="content", tab_index=0)
