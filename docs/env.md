# Environment Variables

The application requires specific environment variables to run. These should be defined in a `.env` file in the project root.

## Core Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `LOCAL_PORT` | Port for the local development server | No | `3000` |

## AI Configuration (OpenAI)

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API Key (sk-...) | **Yes** |

## Firebase Admin SDK (Database Access)

These values are obtained from the Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key.

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_FIREBASE_PROJECT_ID` | The Firebase Project ID (e.g., `second-brain-123`) | **Yes** |
| `APP_FIREBASE_CLIENT_EMAIL` | Service Account Email (e.g., `firebase-adminsdk-...!...`) | **Yes** |
| `APP_FIREBASE_PRIVATE_KEY` | Private Key string (starts with `-----BEGIN PRIVATE KEY-----`). **Must handle newlines correctly.** | **Yes** |

*> **Note**: When using `.env`, you can paste the private key with actual newlines or `\n` characters depending on your parser. The app expects a standard string.*
