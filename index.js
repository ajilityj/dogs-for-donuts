(function() {
  'use strict';
  
  require('dotenv').config();

  const { WebClient } = require('@slack/web-api');
  const { createEventAdapter } = require('@slack/events-api');
  const { createMessageAdapter } = require('@slack/interactive-messages');

  const webClient = new WebClient(process.env.SLACK_TOKEN);
  const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
  const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);

  const port = process.env.PORT || 3000;

  // fetch all workspace users
  const fetchUsers = async function() {
    try {
      return await webClient.users.list({
        token: process.env.SLACK_TOKEN
      });
    } catch (error) {
      console.error(error);
    }
  };
  let userList = fetchUsers().then(data => data.members);

  // get username from user id
  const getUserName = async function(userId) {
    let userName = '';

    try {
      for (let user of Object.values(await userList)) {
        if (user.id === userId) {
          userName = user.name;
          break;
        }
      }
    } catch (error) {
      console.error(error);
    }

    return userName;
  }

  const processTask = function(event) {
    const task = {
      description: event.text,
      assigner: {id: event.user, name: getUserName(event.user)},
      recipient: {id: event.user, name: getUserName(event.user)}
    };
    
    const splitTaskText = task.description.split(' ');

    for (let i = 0; i < splitTaskText.length; i++) {
      if (splitTaskText[i].startsWith('<@')) {
        task.recipient.id = splitTaskText[i].slice(2, -1);
        task.recipient.name = getUserName(task.recipient.id);
        splitTaskText.splice(i, 1);
        task.description = splitTaskText.join(' ');
        break;
      }
    }

    return task;
  };
    
  slackEvents.on('app_mention', async event => {
    const { description, assigner, recipient } = processTask(event);

    const messageJsonBlock = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@${await assigner.name} assigned you, @${await recipient.name}, the task: ${description}. Have you completed it?`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              style: 'primary',
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Yes',
                emoji: true
              },
              action_id: 'yes_button',
              value: 'yes'
            },
            {
              style: 'danger',
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'No',
                emoji: true
              },
              action_id: 'no_button',
              value: 'no'
            }
          ]
        }
      ]
    };

    try {
      const mentionResponseBlock = {
        ...messageJsonBlock,
        ...{ channel: event.channel }
      };
      const res = await webClient.chat.postMessage(mentionResponseBlock);
    } catch (e) {
      console.error(JSON.stringify(e));
    }
  });

  slackInteractions.action({ actionId: 'yes_button' }, async payload => {
    console.log('yes button');
    try {
      console.log('button click received', payload);
    } catch (e) {
      console.log('y?');
      console.error(JSON.stringify(e));
    }

    return {
      text: 'Processing...'
    };
  });

  // Handle errors (see `errorCodes` export)
  slackEvents.on('error', console.error);

  // Start a basic HTTP server
  slackEvents.start(port).then(() => {
    // Listening on path '/slack/events' by default
    console.log('\x1b[36m%s\x1b[0m', `Bot is listening on port ${port}`);
  });
})();
