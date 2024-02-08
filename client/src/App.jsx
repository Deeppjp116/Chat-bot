import 'react-chatbot-kit/build/main.css';
import './App.css';
import Config from './chatBot/config';
import ActionProvider from './chatBot/ActionProvider';
import MessageParser from './chatBot/MessageProvider';

import Chatbot from 'react-chatbot-kit';

function App() {
  return (
    <>
      <div className='container'>
        <div className='App'>
          <Chatbot
            className='App'
            config={Config}
            actionProvider={ActionProvider}
            messageParser={MessageParser}
          />
        </div>
      </div>
    </>
  );
}

export default App;
