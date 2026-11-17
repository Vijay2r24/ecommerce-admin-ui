# Node.js LLM AI Service (Groq & Google Gemini)

This is the Node.js backend service that runs LLMs (**Groq** and **Google Gemini**) and connects to your Ecommerce store data using session token authentication.

## Features
- **Token Authenticated**: Accepts `Authorization: Bearer <token>` and `tenant-domain` headers from the frontend.
- **Dual LLM Architecture (Node.js)**:
  - ⚡ **Groq**: Ultra-fast LLM inference using models like `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`.
  - ✨ **Google Gemini**: Rich reasoning using `gemini-1.5-flash` or `gemini-1.5-pro`.
- **Live Real-Time Store Context**: Queries store APIs (`/getAllUsers`, `/getAllOrders`, `/getTotalRevenue`, etc.) using the user's session token so LLMs always have live store context.
- **Secure Server-Side Execution**: All LLM API keys remain safely on the Node.js backend and are never exposed to browser clients.

---

## Quick Start

### 1. Install Dependencies
```bash
npm run server:install
```
*(or `cd server && npm install`)*

### 2. Configure Environment
Edit `server/.env`:
```env
PORT=5005
ECOMMERCE_API_BASE_URL=https://ecommerce-qa-be.admin.b2yinfy.com/api/admin
DEFAULT_TENANT_DOMAIN=ecommerce-qa.admin.b2yinfy.com

# Groq (Ultra-fast Llama 3.3 / 3.1): https://console.groq.com/keys
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Google Gemini: https://aistudio.google.com/
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-flash

# Default selection: "auto", "groq", or "gemini"
PREFERRED_LLM_PROVIDER=auto
```

### 3. Start Server
From project root:
```bash
npm run server
```
The service starts on `http://localhost:5005`.

---

## API Endpoints
- `GET /health`: Health check and configured model status.
- `GET /api/models`: List of available LLM models.
- `POST /api/chat`:
  - **Headers**:
    - `Authorization: Bearer <user_session_token>`
    - `tenant-domain: <domain>`
  - **Body**:
    ```json
    {
      "message": "Aaryen Sk user details i want",
      "provider": "auto",
      "conversationHistory": []
    }
    ```
  - **Response**:
    ```json
    {
      "status": "SUCCESS",
      "data": {
        "reply": "👤 User Profile: Aaryen Sk...",
        "model": "Groq (llama-3.3-70b-versatile)",
        "provider": "groq"
      }
    }
    ```
