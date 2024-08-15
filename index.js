const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// replace the value below with the Telegram token you receive from @BotFather
const token = '7316436267:AAFpJ_NtWBuNE0WNhVjzOrXtYDZWXzULqGA';
//const webAppUrl = 'https://udteam.ru';
const webAppUrl = 'https://udteam.netlify.app';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
const app = express();

app.use(express.json());
app.use(cors());

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Магазин UDT', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Сделать заказ на сайте UDTeam', web_app: {url: webAppUrl}}]
                ]
            }

        });
        await bot.sendMessage(chatId, 'Внизу кнопка для заполнения формы', {
            reply_markup: {
                keyboard: [
                    [{text: 'Заполнить форму', web_app: {url: webAppUrl + '/form'}}]
                ]
            }

        })
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data)

            await bot.sendMessage(chatId,'Спасибо за обратную связь!');
            await bot.sendMessage(chatId,'Ваша страна: ' + data?.country);
            await bot.sendMessage(chatId,'Улица: ' + data?.street);

            setTimeout(async () => {
                await bot.sendMessage(chatId,'Интересующую вас информацию вы получите в этом чате');
            }, 1000)
        } catch (e) {
            console.log(e);
        }
    }

    // send a message to the chat acknowledging receipt of their message
    //bot.sendMessage(chatId, 'Received your message');
});

app.post('/web-data', async (req, res) => {
    const {queryId, products, totalPrice} = req.body;
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {message_text: 'Вы приобрели товар на сумму ' + totalPrice}
        });
        return res.status(200).json({})
    } catch (e) {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Неудачная покупка',
            input_message_content: {message_text: 'Покупка не удалась'}
        });
        return res.status(500).json({})
    }

})

const PORT = 8000;

app.listen(PORT, () => console.log('Server started on port ' + PORT))