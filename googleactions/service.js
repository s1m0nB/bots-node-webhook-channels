const OracleBot = require('@oracle/bots-node-sdk');
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;
//Self Hosted Express Server
const bodyParser = require('body-parser')
const { dialogflow } = require('actions-on-google');
const assistant = dialogflow();

// start service object
module.exports = (app) => {
  const logger = console;
  // initialize the application with OracleBot
  OracleBot.init(app, {
    logger,
  });

  // add webhook integration to Oracle Cloud
  const webhook = new WebhookClient({
    channel: {
      url: 'ORACLE_CHANNEL_URL',
      secret: 'ORACLE_CHANNEL_SECRET'
    }
  });
  // Add webhook event handlers (optional)
  webhook
    .on(WebhookEvent.ERROR, err => logger.error('Error:', err.message))
    .on(WebhookEvent.MESSAGE_SENT, message => logger.info('Message to chatbot:', message))
    .on(WebhookEvent.MESSAGE_RECEIVED, message => logger.info('Message from chatbot:', message))

  // setup google action default intents
  assistant.intent('Default Fallback Intent', (conv) => {
    logger.info('Got query : ', conv.query);
    // async must have promise in here
    const promise = new Promise(function (resolve, reject) {
      //send message
    // TODO get userInfo
      const MessageModel = webhook.MessageModel();
      const message = {
        userId: 'anonymous',
        messagePayload: MessageModel.textConversationMessage(conv.query)
      };
      webhook.send(message);
      // wait for post callback
      webhook.on(WebhookEvent.MESSAGE_RECEIVED, message => {
        resolve(message);
      });
    })
      .then(function (result) {
        // TODO add multiple response types, this is only text
          conv.ask(result.messagePayload.text);
        })
    // return Promise
    return promise;
  })
  
  // Create endpoint for Oracle Chatbot webhook channel configurtion (Outgoing URI)
  app.post('/bot/message', webhook.receiver());

  // Webhook for google with use the google parser and assistant 
  app.use('/bot/action',bodyParser.json(),assistant);
  app.post('/bot/action', assistant );
}
