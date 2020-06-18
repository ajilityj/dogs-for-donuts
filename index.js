(function() {
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

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
  let teamList = fetchUsers().then(data => data.members);

  // get username of member requesting action
  const getUserName = async function(user) {
    let userName = '';

    try {
      for (let member of Object.values(await teamList)) {
        if (member.id === user) {
          userName = member.name;
          break;
        }
      }
    } catch (error) {
      console.error(error);
    }

    return userName;
  }

  // provide response on request
  slackEvents.on('app_mention', async event => {
    const taskRequester = await getUserName(event.user);
    // remove @donut-feeder from text [<@U015M56GGDQ> ]
    const taskText = event.text.slice(15);

    const messageJsonBlock = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@${taskRequester} assigned you the task: ${taskText}. Have you completed it?`
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
      console.log('Message sent: ', res.ts);
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
