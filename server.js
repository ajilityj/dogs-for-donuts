(function() {
  'use strict';

  require('dotenv').config();

  const config = {
    accessToken: process.env.SLACK_ACCESS_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    port: process.env.PORT || 3000
  };

  const { WebClient } = require('@slack/web-api');
  const { createEventAdapter } = require('@slack/events-api');
  const { createMessageAdapter } = require('@slack/interactive-messages');

  const webClient = new WebClient(config.accessToken);
  const slackEvents = createEventAdapter(config.signingSecret);
  const slackInteractions = createMessageAdapter(config.signingSecret);

  const express = require('express');
  const bodyParser = require('body-parser');
  const ticket = require('./ticket');
  const signature = require('./verifySignature');
  const api = require('./api');
  const payloads = require('./payloads');
  
  const app = express();

  const task = {
    assignedBy: null,
    recipients: [],
    description: '',
    status: 'Pending'
  };

  /*
   * Parse application/x-www-form-urlencoded && application/json
   * Use body-parser's `verify` callback to export a parsed raw body
   * that you need to use to verify the signature
   */
  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };
  app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(bodyParser.json({ verify: rawBodyBuffer }));

  app.use('/actions', slackInteractions.expressMiddleware());
  app.use('/events', slackInteractions.expressMiddleware());

  /*
   * Endpoint to receive /task slash command from Slack.
   * Checks verification token and sends appropriate notifications.
   */
  app.post('/command', async (req, res) => {
    // verify the signing secret
    if (!signature.isVerified(req)) {
      // verification token mismatch
      return res.status(404).send('Slack Verification Error');
    }

    res.send('Processing request -- task confirmation to be sent shortly.');

    const taskDetails = await splitEventDetails(req.body);
    task.assignedBy = await taskDetails.assignedBy.user;
    task.recipients = await taskDetails.recipients;
    task.description = await taskDetails.description;

    try {
      // send task notification directly to each recipient specified
      for (let recipient of task.recipients) {
        const notificationChannel = await api.callAPIMethod(
          'conversations.open',
          {
            users: recipient.user.id
          }
        );

        const notificationMessage = payloads.recipient_notification({
          channel_id: notificationChannel.channel.id,
          description: task.description,
          recipients: task.recipients.map(r => r.user.name),
          assignedBy: task.assignedBy
        });

        await api.callAPIMethod('chat.postMessage', notificationMessage);
      }

      // send task confirmation to assigner
      const confirmationChannel = await api.callAPIMethod(
        'conversations.open',
        {
          users: task.assignedBy.id
        }
      );

      const confirmationMessage = payloads.assigner_confirmation({
        channel_id: confirmationChannel.channel.id,
        description: task.description,
        recipients: task.recipients.map(r => r.user.name)
      });

      await api.callAPIMethod('chat.postMessage', confirmationMessage);

    } catch (e) {
      console.error(JSON.stringify(e));
    }
  });

  slackInteractions.action({ type: 'button' }, (payload, respond) => {

    const updatedBy = payload.user;

    task.status = payload.actions[0].value;

    // replace original message for assignee
    respond({
      text: `You marked the task, ${task.description}, as ${task.status}.`,
      replace_original: true
    });

    // send new status message to assigner
    ticket.sendStatus(task, updatedBy);

    // Return a replacement message
    return { text: 'Processing...' };
  });

  // get user info from user id
  const getUserInfo = async function(userId) {
    try {
      return await webClient.users.info({
        token: config.accessToken,
        user: userId
      });
    } catch (error) {
      console.error(error);
    }
  };

  const splitEventDetails = async function(event) {
    const taskDetails = {
      description: '',
      assignedBy: null,
      recipients: []
    };

    taskDetails.assignedBy = await getUserInfo(event.user_id);

    // split event text into an array
    const textArray = event.text.split(' ');

    let userArray = [];

    for (let i = 0; i < textArray.length; i++) {
      if (textArray[i].startsWith('<@')) {
        // <@U015W8Q9FJQ|ajilityj>
        const endsWithIndex =
          textArray[i].indexOf('|') > -1
            ? textArray[i].indexOf('|')
            : textArray[i].indexOf('>');

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

    taskDetails.description = textArray.join(' ');
    // if no recipients are specified, assign it to the assigner
    taskDetails.recipients =
      userArray.length > 0 ? userArray : [taskDetails.assignedBy];

    return await taskDetails;
  };

  app.listen(config.port || 3000, () => {
    console.log(
      '\x1b[36m%s\x1b[0m',
      `Express server listening on port ${config.port}...`
    );
  });
})();
