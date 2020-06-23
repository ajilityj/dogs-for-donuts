module.exports = {
  notification: context => {
    return {
      channel: context.channel_id,
      text: 'Task for you!',
      blocks: JSON.stringify([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Task for you!*'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description*\n${context.description}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `The task listed above was assigned to you by @${context.assignedBy.name}. Have you completed it?`
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
      ])
    };
  },
  confirmation: context => {
    return {
      channel: context.channel_id,
      text: 'Task created!',
      blocks: JSON.stringify([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*_Confirmation of Task Creation_*'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Description:_ ${context.description}\n_Assigned To:_ @${context.recipients.name}`
          }
        }
      ])
    };
  },
  temp: context => {
    return {
      channel: context.channel_id,
      text: 'Task Status Update',
      blocks: JSON.stringify([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*_Task Status Update_*'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Description:_ ${context.description}\n_Assigned To:_ @${context.recipients.name}\n_Complete:_ ${context.status}`
          }
        }
      ])
    };
  }
};
