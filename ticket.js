const api = require('./api');
const payloads = require('./payloads');

/*
 *  Send task status via
 *  chat.postMessage to the initial assigner
 */
const sendStatus = async (task, updatedBy) => {
  // open a DM channel for that user
  const channel = await api.callAPIMethod('conversations.open', {
    users: task.assignedBy.id
  })

  const message = payloads.task_update_notification({
    channel_id: channel.channel.id,
    description: task.description,
    recipients: task.recipients.map(r => r.name),
    updatedBy: updatedBy.name,
    status: task.status
  });

  return await api.callAPIMethod('chat.postMessage', message)
};

module.exports = { sendStatus };
