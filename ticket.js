const api = require('./api');
const payloads = require('./payloads');

/*
 *  Send task status via
 *  chat.postMessage to the user who initially created it
 */
const sendStatus = async (task, status) => {
  // open a DM channel for that user
  const channel = await api.callAPIMethod('conversations.open', {
    users: task.assignedBy.id
  })

  const message = payloads.temp({
    channel_id: channel.channel.id,
    description: task.description,
    recipients: task.recipients,
    status: status
  });

  return await api.callAPIMethod('chat.postMessage', message)
};

module.exports = { sendStatus };
