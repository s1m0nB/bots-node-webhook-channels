const OracleBot = require('@oracle/bots-node-sdk');
const TelegramBot = require('node-telegram-bot-api');
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;

module.exports = (app) => {
  const logger = console;
  // initialize the application with OracleBot
  OracleBot.init(app, {
    logger,
  });

  // Telegram bot - webhook config
  const telegramToken = 'ADD_YOUR_TELGRAM_BOT_TOKEN';
  const telegramURL = 'YOUR_TELEGRAM_WEBHOOK_URL';
  const bot = new TelegramBot(telegramToken);
  bot.setWebHook( telegramURL );
  // variable to store chatId
  var chatId;
  
  // add webhook integration
  const webhook = new WebhookClient({
    channel: {
      url: 'ORACLE_CHANNEL_URL',
      secret: 'ORACLE_CHANNEL_SECRET',
    }
  });
  const MessageModel = webhook.MessageModel();
  // Add webhook event handlers 
  webhook
    .on(WebhookEvent.MESSAGE_RECEIVED, message => {
      logger.info('Message from bot:', message);
      // TODO: implement send to client...
      var cards = [];
      var keyboard = [];
      if ( Array.isArray(message.messagePayload.actions) ) {
        for (var i = 0; i < message.messagePayload.actions.length; i++) {
            // keyboard
            keyboard.push({ "text": message.messagePayload.actions[i].label});
        }
      }
      if ( Array.isArray(message.messagePayload.cards) ) {
        for (var i = 0; i < message.messagePayload.cards.length; i++) {
            // cards
            cards.push({ "text": message.messagePayload.cards[i].title});
        }
      }
      var text = ""+message.messagePayload.text;      
      if (keyboard.length > 0 ){
        var opts = {"reply_markup": { "keyboard": [keyboard], resize_keyboard: true, one_time_keyboard: true } };
        bot.sendMessage(chatId, text, opts);
      }
      else if (cards.length > 0 ){
        var opts = {"reply_markup": { "inline_keyboard": [cards] } };
        bot.sendMessage(chatId, text, opts);
      } else {
        //var opts = {"reply_markup": { "keyboard": [[]] } };
        bot.sendMessage(chatId, text);
      }
    });

  // Telegram - Listen for any kind of message. There are different kinds of messages.
  bot.on('message', (msg) => {
    // set chatId variable for use in sendMessage()
    chatId = msg.chat.id;
    const message = {
      userId: msg.chat.username,
      messagePayload: MessageModel.textConversationMessage(msg.text)
    };
    // send to bot webhook channel
    webhook.send(message);
  });

  // Create endpoint for bot webhook channel configurtion (Outgoing URI)
  app.post('/bot/message', webhook.receiver());
  // Create endpoint for telegram webhook
  app.post('/bot/telegram', (req, res) => {bot.processUpdate(req.body); res.sendStatus(200); });

}
