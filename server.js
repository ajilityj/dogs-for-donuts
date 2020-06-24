(function() {
  'use strict';

  require('dotenv').config();

  // Environment variables
  const config = {
    accessToken: process.env.SLACK_ACCESS_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    port: process.env.PORT || 3000
  };

  // Slack requirements
  const { WebClient } = require('@slack/web-api');
  const { createEventAdapter } = require('@slack/events-api');
  const { createMessageAdapter } = require('@slack/interactive-messages');
  const webClient = new WebClient(config.accessToken);
  const slackEvents = createEventAdapter(config.signingSecret);
  const slackInteractions = createMessageAdapter(config.signingSecret);

  // App requirements
  const express = require('express');
  const bodyParser = require('body-parser');

  // Dev requirements
  const signature = require('./verifySignature');
  const api = require('./api');
  const payloads = require('./payloads');

  // start App
  const app = express();

  // initiate task
  const task = {
    assignedBy: null,
    recipients: [],
    description: '',
    status: 'New'
  };

  // parse application/x-www-form-urlencoded && application/json
  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };

  // use body-parser's `verify` callback to verify signature
  app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(bodyParser.json({ verify: rawBodyBuffer }));

  // setup server middleware
  app.use('/actions', slackInteractions.expressMiddleware());
  app.use('/events', slackInteractions.expressMiddleware());

  // endpoint to receive slash command from Slack
  app.post('/command', async (req, res) => {

    // verify Slack signing secret
    if (!signature.isVerified(req)) {
      return res.status(404).send('Slack Verification Error');
    }

    try {
      // send user a response in current channel
      res.send('Processing request -- will begin fetching shortly...');

      // get details for specified task
      await getTaskDetails(req.body);

      // send notification directly to each recipient
      for (let recipient of task.recipients) {
        sendAssignmentNotification(recipient);
      }

      // send confirmation message for assigner
      sendAssignmentConfirmation(task.assignedBy);

    } catch (e) {
      console.error(e);
    }
  });

  // process button interactions within Slack notifications
  slackInteractions.action({ type: 'button' }, (payload, respond) => {
    try {
      // get status from button value
      task.status = payload.actions[0].value;

      // replace original message for button user
      respond({
        text: `You responded, "${task.status}", to the task, "${task.description}", assigned by ${task.assignedBy.real_name}`,
        replace_original: true
      });

      // send status notification to assigner
      return sendStatusNotification(payload.user);

    } catch (e) {
      console.error(e);
    }
  });

  // send status notification to assigner
  const sendStatusNotification = async updatedBy => {
    try {
      // get channel based on assigner's id
      const channel = await api.callAPIMethod('conversations.open', {
        users: task.assignedBy.id
      });

      // set status message for assigner
      const message = payloads.task_status_notification({
        channel_id: channel.channel.id,
        description: task.description,
        recipients: task.recipients.map(r => r.name),
        updatedBy: updatedBy.name,
        status: task.status
      });

      // post status notification directly to assigner
      return await api.callAPIMethod('chat.postMessage', message);

    } catch (e) {
      console.error(e);
    }
  };

  // send assignment notification to recipient
  const sendAssignmentNotification = async recipient => {
    try {
      // get channel based on recipient's id
      const channel = await api.callAPIMethod('conversations.open', {
        users: recipient.id
      });

      // set notification message for specified recipient
      const message = payloads.task_assignment_notification({
        channel_id: channel.channel.id,
        description: task.description,
        recipients: task.recipients.map(r => r.name),
        assignedBy: task.assignedBy
      });

      // post notification directly to recipient
      return await api.callAPIMethod('chat.postMessage', message);

    } catch (e) {
      console.error(e);
    }
  };

  // send confirmation notification to assigner
  const sendAssignmentConfirmation = async () => {
    try {
      // get channel based on assigner's id
      const channel = await api.callAPIMethod(
        'conversations.open',
        {
          users: task.assignedBy.id
        }
      );

      // set confirmation message for assigner
      const message = payloads.task_assignment_confirmation({
        channel_id: channel.channel.id,
        description: task.description,
        recipients: task.recipients.map(r => r.name)
      });

      // post confirmation notification directly to assigner
      return await api.callAPIMethod('chat.postMessage', message);

    } catch (e) {
      console.error(e);
    }
  };

  // get user info from user id
  const getUserInfo = async (userId) => {
    try {
      return await webClient.users.info({
        token: config.accessToken,
        user: userId
      });
    } catch (e) {
      console.error(e);
    }
  };

  // split slash command req.body into task details
  const getTaskDetails = async (taskText) => {
    try {
      // get user info for assigner
      task.assignedBy = await getUserInfo(taskText.user_id).then(
        user => user.user
      );

      // split task text into an array
      const taskTextArray = taskText.text.split(' ');

      // loop through array, saving tagged, non-bot users
      const userArray = [];
      for (let i = 0; i < taskTextArray.length; i++) {
        // accounting for deprecated syntax: <@W123|bronte>
        if (taskTextArray[i].startsWith('<@')) {
          const endsWithIndex =
            taskTextArray[i].indexOf('|') > -1
              ? taskTextArray[i].indexOf('|')
              : taskTextArray[i].indexOf('>');

          // remove '<@' & '>'
          const userId = taskTextArray[i].slice(2, endsWithIndex);

          // get user info from user id
          const user = await getUserInfo(userId);

          // if not bot user, add the user to the user array
          if (!user.user.is_bot) userArray.push(user.user);

          // remove the user, at it's index, from the text array
          taskTextArray.splice(i, 1);

          // account for splice and forthcoming increment
          i -= 1;
        }
      }

      // set description with remaining text within array
      task.description = taskTextArray.join(' ');

      // if no recipients are specified, assign it to the assigner
      task.recipients = userArray.length > 0 ? userArray : [task.assignedBy];

      return;

    } catch (e) {
      console.error(e);
    }
  };

  // set server to listen on configured port
  app.listen(config.port, () => {
    console.log(
      '\x1b[34m%s\x1b[0m',
      `Express server listening on port ${config.port}...`
    );
  });
})();
