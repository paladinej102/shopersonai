const express = require('express');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
const port = process.env.PORT;

app.use(express.json());

app.get('/', function (req, res) {
  res.send({ message: 'ChatGPT API Server is running' });
});

app.listen(port, function () {
  console.log(`Server running on port ${port} in node`);
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { answer } = req.body;
    
    const content = `
      You are a fashion quiz tagger.

      Based on the user’s single free-text answer to a style quiz question, return the most appropriate tags from the following predefined tag lists:

      Style Tags (choose 1–2 max):
      - Minimal & Modern
      - Romantic & Feminine
      - Bold & Trend-Driven
      - Relaxed & Effortless
      - Eclectic & Individualistic

      Fitting Tags (choose 1–2 max):
      - Tailored
      - Flowy
      - Oversized
      - Relaxed
      - Form-Fitting

      Activity Tags (choose 1–3 max):
      - Work / Office
      - Fitness / Active
      - Event / Night Out
      - Lounge / At Home
      - Travel / On-the-Go
      - Weekend Casual
      - Date / Romantic
      - Eclectic

      Return only the JSON output (no code blocks, no explanations). Do not wrap it in markdown or backticks.

      {
        "style_tags": [...],
        "fitting_tags": [...],
        "activity_tags": [...]
      }

      Here's the user's answer:
      "${answer}"
    `;

    const messages = [{ role: "user", content }];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });

    const responseText = completion.choices[0].message.content;

    let tags;
    try {
      tags = JSON.parse(responseText);
    } catch (err) {
      console.error("Failed to parse JSON:", responseText);
      return res.status(500).json({ error: "Invalid JSON returned from OpenAI" });
    }

    res.json({
      tags,
      usage: completion.usage
    });
    
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to get response from ChatGPT' });
  }
});
