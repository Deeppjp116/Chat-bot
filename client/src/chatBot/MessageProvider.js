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
        console.log('Data resived');
        const responseData = response.data;
        console.log(responseData.fulfillmentText);
        if (responseData && responseData.fulfillmentText) {
          // Call an appropriate method in ActionProvider based on the response
          this.actionProvider.handleAction(responseData.fulfillmentText);
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }
}

export default MessageParser;
