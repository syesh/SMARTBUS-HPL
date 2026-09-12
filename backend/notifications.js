const { Expo } = require('expo-server-sdk');
let expo = new Expo();

/**
 * Sends push notifications to a list of Expo push tokens.
 * @param {Array} tokens - Array of push tokens.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {Object} data - Additional data payload.
 */
async function sendPushNotifications(tokens, title, body, data = {}) {
  let messages = [];
  for (let pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = {
  sendPushNotifications
};
