# ChatGPT Node.js Backend

A Node.js backend that interacts with OpenAI's ChatGPT API, featuring a robust environment management system.

## Environment Management System

This project uses a comprehensive environment variable management system that includes:

- **Validation**: Ensures all required variables are present and valid
- **Type Conversion**: Automatically converts values to the correct type (string, number, boolean)
- **Default Values**: Provides sensible defaults for optional variables
- **Environment-Specific Configuration**: Supports different configurations for development, testing, and production

### Environment Files

The system supports the following environment files:

- `.env`: Default environment file for all environments
- `.env.development`: Used when NODE_ENV is set to 'development'
- `.env.production`: Used when NODE_ENV is set to 'production'
- `.env.test`: Used when NODE_ENV is set to 'test'

### Required Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

### Optional Environment Variables

- `PORT`: The port to run the server on (default: 3000)
- `NODE_ENV`: The current environment (default: 'development')

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your environment variables
   ```
   PORT=3000
   NODE_ENV=development
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Running the Server

Start the server in development mode with:
```
npm run dev
```

Start the server in production mode with:
```
NODE_ENV=production npm start
```

## API Endpoints

### Check Server Status
- **URL:** `/`
- **Method:** `GET`
- **Response:** `{ "message": "ChatGPT API Server is running" }`

### Chat with ChatGPT
- **URL:** `/api/chat`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Hello, how are you?" }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "reply": {
      "role": "assistant",
      "content": "I'm doing well, thank you for asking! How can I help you today?"
    },
    "usage": {
      "prompt_tokens": 23,
      "completion_tokens": 16,
      "total_tokens": 39
    }
  }
  ```

## Testing the API

Use the included test client to make a test request:
```
node testClient.js
``` 