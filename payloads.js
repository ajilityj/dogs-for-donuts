module.exports = {
  task_confirmation_notification: context => {
    return {
      channel: context.channel_id,
      text: 'TASK CONFIRMATION',
      blocks: JSON.stringify([
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*_TASK CONFIRMATION_*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Description:_ ${context.description}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Assigned To:_ ${context.recipients.map(r => `@${r}`)}`
          }
        },
        {
          type: 'divider'
        }
      ])
    };
  },
  task_assigned_notification: context => {
    return {
      channel: context.channel_id,
      text: 'ACTION REQUIRED: TASK STATUS',
      blocks: JSON.stringify([
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*_ACTION REQUIRED: TASK STATUS_*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Description:_ ${context.description}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Assigned To:_ ${context.recipients.map(r => `@${r}`)}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Assigned By:_ @${context.assignedBy.name}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Please reply with your latest status:*`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: ':thumbsup:  Complete',
                emoji: true
              },
              action_id: 'complete_button',
              value: 'Complete'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: ':point_up:  In Progress',
                emoji: true
              },
              action_id: 'inProgress_button',
              value: 'In Progress'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: ':fist:  Pending',
                emoji: true
              },
              action_id: 'blocked_button',
              value: 'Pending'
            }
          ]
        },
        {
          type: 'divider'
        }
      ])
    };
  },
  task_update_notification: context => {
    return {
      channel: context.channel_id,
      text: 'TASK UPDATE',
      blocks: JSON.stringify([
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*_TASK UPDATE_*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Description:_ ${context.description}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Assigned To:_ ${context.recipients.map(r => `@${r}`)}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Updated By:_ @${context.updatedBy}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*_Status:_ ${context.status}*`
          }
        },
        {
          type: 'divider'
        }
      ])
    };
  }
};
