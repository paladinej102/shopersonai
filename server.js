const express = require('express');
require('@shopify/shopify-api/adapters/node');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
const { shopifyApi, LATEST_API_VERSION, Session } = require('@shopify/shopify-api');

dotenv.config();
const port = process.env.PORT;
app.use(express.json());
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
}));

const shopify = shopifyApi({
  apiKey: process.env.API_KEY,
  apiSecretKey: process.env.SECRET_KEY,
  adminApiAccessToken: process.env.ADMIN_ACCESS_TOKEN,
  scopes: process.env.SCOPE.split(','),
  hostName: process.env.HOST,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true
});
const session = new Session({
  id: `online_${process.env.STORE_URL}`,
  shop: process.env.STORE_URL, // <-- must be a valid shop domain
  isOnline: true,
  accessToken: process.env.ADMIN_ACCESS_TOKEN,
  apiVersion: LATEST_API_VERSION,
  scope: process.env.SCOPE,
  state: 'production',
});
const client = new shopify.clients.Graphql({ session });

const query = `mutation updateCustomerMetafields($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          metafields(first: 3) {
            edges {
              node {
                namespace
                key
                type
                value
              }
            }
          }
        }
        userErrors {
          message
          field
        }
      }
    }`;

app.get('/', function (req, res) {
  res.send({ message: 'ChatGPT API Server is running' });
});

app.post('/api/chat', async (req, res) => {
  if (req.headers['x-api-key'] !== process.env.KEY) {
    return res.status(401).send('Invalid API Key!');
  }
  try {
    const { question, answer } = req.body;

    const content = `
  This is a question: "${question}".
  You are a fashion quiz tagger.
  Based on the user's single free-text answer to a style quiz question, return the most appropriate tags from the following predefined tag lists and, only if the question is about gender, also guess the user's gender based on the answer:

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

  Gender (choose 1 if applicable):
  - Male
  - Female

  If the question is similar to "What is your gender?", return the JSON output in this format:
  {
    "style_tags": [...],
    "fitting_tags": [...],
    "activity_tags": [...],
    "gender": "..."
  }

  If the question is anything else, return the JSON output in this format:
  {
    "style_tags": [...],
    "fitting_tags": [...],
    "activity_tags": [...]
  }

  Return only the JSON (no code blocks, no explanations, no markdown formatting).

  Here's the user's answer: "${answer}"
`;


    const messages = [{ role: "user", content }];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
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

app.put('/api/customer-metafields', async (req, res) => {
  // Validate API key
  if (req.headers['x-api-key'] !== process.env.KEY) {
    console.log('API Key validation failed');
    return res.status(401).send('Invalid API Key!');
  }

  try {
    const { customerId, metafields } = req.body;
    const result = await saveMetafields(customerId, metafields);
    res.send(result);
  } catch (error) {
    console.error('Error updating customer metafields:', error);
    res.status(500).json({ error: 'Failed to update customer metafields' });
  }
});

const saveMetafields = async (customerId, metafields) => {
  const metafieldsData = [];
  for (const key in metafields) {
    if (key == 'gender') {
      metafieldsData.push({
        "namespace": "custom",
        "key": key,
        "type": "single_line_text_field",
        "value": metafields[key]
      });
    } else {
      metafieldsData.push({
        "namespace": "persona",
        "key": key,
        "type": "list.single_line_text_field",
        "value": JSON.stringify(metafields[key])
      });
    }
  }
  let variables = {
    "input": {
      id: `gid://shopify/Customer/${customerId}`,
      metafields: metafieldsData
    }
  }

  const response = await client.request(query, { variables });
  return response;
}

app.listen(port, function () {
  console.log(`Server running on port ${port} in node`);
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

