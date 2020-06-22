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

  // get user info from user id
  const getUserInfo = function(userId) {
    try {
      return webClient.users.info({
        token: process.env.SLACK_TOKEN,
        user: userId
      });
    } catch (error) {
      console.error(error);
    }
  };

  const splitEventDetails = async function(event) {
    console.log('\x1b[34m%s\x1b[0m', '30: event');
    console.log('\x1b[34m%s\x1b[0m', event);
    const task = {
      description: '',
      assignedBy: null,
      recipients: []
    };

    task.assignedBy = await getUserInfo(event.user);

    // split event text into an array
    const textArray = event.text.split(' ');

    let userArray = [];

    for (let i = 0; i < textArray.length; i++) {
      if (textArray[i].startsWith('<@')) {
        const endsWithIndex = textArray[i].indexOf('>');
        const id = textArray[i].slice(2, endsWithIndex); // remove '<@' & '>'
        const user = await getUserInfo(id);

        // if not bot user, add the user to the user array
        if (!user.user.is_bot) {
          userArray.push(user);
        }

        // remove the user, at it's index, from the text array
        textArray.splice(i, 1);
        i -= 1;
      }
    }

    task.description = textArray.join(' ');
    // if no recipients are specified, assign it to the assigner
    task.recipients = userArray.length > 0 ? userArray : [task.assignedBy];

    return await task;
  };

  slackEvents.on('message', async event => {
    if (event.channel_type === 'im') console.log('yes, im');

    const task = await splitEventDetails(event);

    const taskAssignedBy = await task.assignedBy.user;
    const taskRecipients = await task.recipients;
    const taskDescription = await task.description;

    // U015W8Q9FJQ - @ajilityj
    // U015ECT5T4N - @aj
    // U015M56GGDQ - bot

    const messageJsonBlock = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@${taskAssignedBy.name} assigned the task: "${taskDescription}" to you. Have you completed it?`
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
        ...{ users: taskRecipients[0].user.id, token: process.env.SLACK_TOKEN } 
        //taskRecipients.map(t => t.id).split(' ').join(',')
      };
      await webClient.conversations.open(mentionResponseBlock);   
    } catch (e) {
      // (TODO: test this)
      console.error(JSON.stringify(e));
    }
  });

  /*
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
  */

  // (TODO: test this)
  // Handle errors (see `errorCodes` export)
  slackEvents.on('error', console.error);

  // Start basic HTTP server; listening on path '/slack/events' by default
  slackEvents.start(port).then(() => {
    console.log('\x1b[36m%s\x1b[0m', `Bot is listening on port ${port}`);
  });
})();
