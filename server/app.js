// Import required modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { SessionsClient } = require('@google-cloud/dialogflow');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./shemas/User');

// Create an Express application
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());

// Set the port for the server
const PORT = 9999;

// Set the path for Google Cloud credentials
const credentialsPath = path.join(
  __dirname,
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

// Create a Dialogflow SessionsClient instance
const sessionClient = new SessionsClient({ keyFilename: credentialsPath });

// Determine the MongoDB connection URI based on the environment
const dbURI =
  process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI
    : 'mongodb://localhost:27017/chatbot';

// Connect to MongoDB
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

// MongoDB connection setup
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Function to create a default user in MongoDB
const createDefaultUser = async () => {
  try {
    const newUser = new User({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'secretpassword',
    });

    // Save the new user to the database
    const user = await newUser.save();
    console.log('User created:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

// Run the function to create a default user when the server starts
createDefaultUser();

// Define a route for handling POST requests
app.post('/', async (req, res) => {
  try {
    // Extract text data from the request body
    const requestData = req.body?.text;

    // Validate that text data is present
    if (!requestData) {
      return res
        .status(400)
        .send({ error: 'Text is required in the request body.' });
    }

    // Define Dialogflow project and session identifiers
    const projectId = 'deno-chatbot-grfc';
    const sessionId = 'your-unique-session-id';

    // Call the detectIntent function to interact with Dialogflow
    const result = await detectIntent(projectId, sessionId, requestData);

    // Send the result back as the response
    res.send(result);

    // Log the result after sending the response to avoid potential issues with async behavior
    console.log(result);
  } catch (error) {
    // Handle errors and send an appropriate response
    console.error('Error processing request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

// Function to interact with Dialogflow and detect user intent
async function detectIntent(projectId, sessionId, requestData) {
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: requestData,
        languageCode: 'en-US',
      },
    },
  };

  // Send the request to Dialogflow and await the response
  const responses = await sessionClient.detectIntent(request);

  // Return the detected intent from the response
  return responses[0].queryResult;
}
