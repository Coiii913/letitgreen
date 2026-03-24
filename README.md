#LetItGreen
Project Directory Structure
server/: Backend code (Entry point: server/index.js)

client/: Frontend React + Vite code

package.json: Root scripts, supports concurrent startup

eng.traineddata: OCR training data (one copy is sufficient)

Quick Start
Install Dependencies

Bash
npm install
cd client && npm install
Configure Environment Variables

Bash
copy .env.example .env
# Edit .env: Provide MONGO_URI and DEEPSEEK_API_KEY
Development Mode (Run frontend and backend concurrently)

Bash
npm run dev
Production Mode

Bash
npm run build
npm start
FAQs
If the frontend runs concurrently from http://localhost:5173, the backend API at /api should be accessible as usual.

To serve the static frontend directly from the backend: Run npm run build first, then npm start.

If the application fails to run, check if the MONGO_URI is reachable and ensure the DEEPSEEK_API_KEY is valid and active.
