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
        switch (responseData?.result?.intent?.displayName) {
          case 'track.order - context: ongoing-tracking':
            // Handle track.order response
            const orderData = responseData.order;
            console.log('Order Data:', orderData);
            const foodItems = orderData.items.map((item) => item.stringValue);
            const foodItemsString = foodItems.join(',');
            // Perform actions based on orderData
            this.actionProvider.handleAction(
              `Here is the Food items ${foodItemsString}`
            );
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
