// Import required modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { SessionsClient } = require('@google-cloud/dialogflow');
const path = require('path');
const mongoose = require('mongoose');

const Order = require('./shemas/Order');

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
  // try {
  //   const newUser = new User({
  //     username: 'john_doe',
  //     email: 'john@example.com',
  //     password: 'secretpassword',
  //   });
  //   // Save the new user to the database
  //   const user = await newUser.save();
  //   console.log('User created:', user);
  // } catch (error) {
  //   console.error('Error creating user:', error);
  // }
};

// Run the function to create a default user when the server starts
createDefaultUser();

let temporaryOrder = {
  items: [],
  quantities: [],
};

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

    // Log the result after sending the response to avoid potential issues with async behavior
    // console.log(result.intent.displayName);
    const intention = result.intent.displayName;
    const foodItemValues =
      result?.parameters?.fields['food-item']?.listValue?.values;
    const quntityOfItems =
      result?.parameters?.fields?.number?.listValue?.values;

    const orderID = requestData;

    switch (intention) {
      case 'order.add - context: ongoing-order':
        // Save items and quantities temporarily
        temporaryOrder.items = [
          ...temporaryOrder.items,
          ...(foodItemValues || []),
        ];
        temporaryOrder.quantities = [
          ...temporaryOrder.quantities,
          ...(quntityOfItems || []),
        ];
        console.log('Orders Added in the basket ');
        break;

      case 'order.complete - context: ongoing-order':
        // Save the order in the database
        try {
          const newOrder = new Order({
            items: temporaryOrder.items,
            quantity: temporaryOrder.quantities,
          });
          const savedOrder = await newOrder.save();
          console.log('Order has been saved:', savedOrder);

          // Clear the temporary order after saving in the database
          temporaryOrder = {
            items: [],
            quantities: [],
          };
        } catch (error) {
          console.error('Error saving order:', error);
        }
        break;

      case 'order.remove - context: ongoing-order':
        try {
          // Check if specific item and quantity to remove are provided
          if (foodItemValues) {
            // Find and remove the specified item and quantity from the temporary order
            console.log(foodItemValues);
            const updatedItems = temporaryOrder.items.filter((item, index) => {
              console.log('here is the items for remove', item.stringValue);
              return !foodItemValues.stringValue.includes(item.stringValue);
            });

            temporaryOrder.items = updatedItems;
            console.log(
              'Specific item and quantity removed from the order:',
              temporaryOrder
            );
          } else {
            console.log('No specific item and quantity provided for removal.');
          }
          break;
        } catch (error) {
          console.error('Error removing specific item and quantity:', error);
        }

      case 'track.order - context: ongoing-tracking':
        try {
          console.log('Track Order ID');
          const order = await Order.findById(orderID);
          if (!order) {
            console.log('Order not found');
            return res.status(404).send({ error: 'Order not found' });
          }

          console.log('Found Order:', order);
          res.status(200).send(order); // Send the response directly
        } catch (error) {
          console.error('Error processing track order request:', error);
          res.status(error.statusCode || 500).send({ error: error.message });
          if (!res.headersSent) {
            res.status(500).send({ error: 'Internal Server Error' });
          } else {
            console.error(
              'Headers already sent. Unable to send error response.'
            );
          }
        }
        break; // Add this break statement to exit the switch block

      default:
        res.status(200).send(result);
        break;
    }
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
