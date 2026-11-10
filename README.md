# AI Flower

Find out what type of AI flower you are. Fifteen topics explore AI's benefits, harms and expected changes. Seven petals show your views by issue, including where you agree with both a benefit and a harm statement. The result includes a 3D flower with a stem and a downloadable flower card.

All scoring and rendering run in your browser. Responses stay in the current tab. This form has no response collection, account system, analytics, external fonts or server dependencies.

## Publish with GitHub Pages

1. Create a public repository named `ai-flower`.
2. Upload all the files inside this folder to the repository's top level. `index.html` must be at the top level, not inside another folder. Commit to `main`.
3. Open Settings → Pages. Under Build and deployment, choose Deploy from a branch, select `main` and `/ (root)`, then Save.
4. GitHub builds and publishes the site. The Pages settings show its live URL, normally `https://YOUR-USERNAME.github.io/ai-flower/`.

Later commits to `main` automatically update the site. The original `ai-compass` repository is separate.

## Files

- `index.html`: homepage and application entry point.
- `app.mjs`: questionnaire, results, controls and answer review.
- `data.mjs`: question text and response formats.
- `scoring.mjs`: benefit, harm, change and both/and calculations.
- `snowflake.mjs`: flower geometry, WebGL and software rendering.
- `flower-card.mjs`: descriptive summaries and PNG/SVG card exports.
- `styles.css` and `snowflake.css`: appearance and responsive layouts.
- `scoring.html` and `scoring.md`: scoring, interpretation and research basis.
- `questions.html` and `questions.md`: complete questionnaire.
- `offline.html`: a self-contained downloadable copy of the experience.

The flower's shape describes answers; it is not a validated personality assessment. See the research basis and limits in the scoring explanation.

Inspired by the original AI Compass: https://bambamramfan.github.io/ai-compass/
