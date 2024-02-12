import axios from 'axios';

class MessageParser {
  constructor(actionProvider, state) {
    this.actionProvider = actionProvider;
    this.state = state;
  }

  parse(message) {
    console.log('clicked');
    axios
      .post('http://localhost:9999/', { text: message })
      .then((response) => {
        console.log(response.data);
        console.log('Data received');
        const responseData = response.data;

        // Check the type of response and handle accordingly
        switch (responseData?.intent?.displayName) {
          case 'track.order - context: ongoing-tracking':
            // Handle track.order response
            const orderData = responseData.order;
            console.log('Order Data:', orderData);
            // Perform actions based on orderData
            break;
          default:
            // Handle other types of responses
            if (responseData && responseData.fulfillmentText) {
              // Call an appropriate method in ActionProvider based on the response
              this.actionProvider.handleAction(responseData.fulfillmentText);
            }
            break;
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }
}

export default MessageParser;
