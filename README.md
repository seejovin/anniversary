# 小烏龜的約會邀請 🐢🌸

A Streamlit version of your date invitation, including the cute tortoise couple, flowers, single-line first question, dodging and shrinking No button, rapidly growing Yes button, and gentle screen transitions.

## Publish on Streamlit Community Cloud

1. Extract this ZIP. Upload the **contents** of `tortoise-date-streamlit` to a GitHub repository such as `tortoise-date`. Keep the `frontend` and `.streamlit` folders intact. `streamlit_app.py` and `requirements.txt` should be at the repository root.
2. Open [Streamlit Community Cloud](https://share.streamlit.io/) and sign in with the account linked to that GitHub repository.
3. Select **Create app**, then **Yup, I have an app**. Choose your repository and branch (usually `main`), and enter `streamlit_app.py` as the main file path. Use Python 3.12 in Advanced settings if a version choice is shown.
4. Choose an available app URL and select **Deploy**. No app secrets or API keys are needed.
5. When the app is running, open its Share settings and allow public viewing if you want anyone with the link to use it. Share the resulting `https://….streamlit.app` address.

See Streamlit's [official deployment instructions](https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/deploy).

## Run locally

With Python 3.12 installed, run these commands from this folder:

```sh
python -m venv .venv
```

Activate the environment (`source .venv/bin/activate` on macOS/Linux, or `.venv\Scripts\Activate.ps1` in Windows PowerShell), then run:

```sh
python -m pip install -r requirements.txt
python -m streamlit run streamlit_app.py
```

## Files and behavior

- `streamlit_app.py` wraps the original page in Streamlit's `st.iframe`, embedding the local CSS, JavaScript, and tortoise image.
- `frontend/index.html` contains the text and screens.
- `frontend/styles.css` controls the design, sizing, and transition timing.
- `frontend/app.js` handles the playful buttons, date/time selection, food choices, and confirmation.
- `frontend/tortoise-couple-cartoon.png` is the accepted tortoise illustration.
- `.streamlit/config.toml` sets the matching light theme.

Selections stay in the visitor's current page and reset when it reloads. Completing the invitation does not send a notification, save a response to a server, or create a calendar event. A visitor can share a screenshot of the final plan.

The JavaScript runs inside the iframe, preserving the original interactions. Screen height adjusts with the content. The frontend comes from the accepted site, with two small iframe adaptations: height-only resizing does not reset the No button, and screen changes bring the invitation back into view in the outer page.

Streamlit is pinned to 1.63.0 because the app uses its supported [`st.iframe`](https://docs.streamlit.io/develop/api-reference/text/st.iframe) API.
