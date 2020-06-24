module.exports = {
  task_assignment_confirmation: context => {
    return {
      channel: context.channel_id,
      text: 'TASK CONFIRMATION',
      blocks: JSON.stringify([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*TASK CONFIRMATION*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\n>_${context.description}_\n\nAssignee(s):${context.recipients.map(r => ` @${r}`)}`
          }
        },
        {
          type: 'divider'
        }
      ])
    };
  },
  task_assignment_notification: context => {
    return {
      channel: context.channel_id,
      text: 'ACTION REQUIRED: TASK STATUS',
      blocks: JSON.stringify([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*ACTION REQUIRED: TASK STATUS*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\n>_${context.description}_\n\nAssigner: @${context.assignedBy.name}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Please reply with your latest status:*\n`
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
  task_status_notification: context => {
    return {
      channel: context.channel_id,
      text: 'TASK STATUS UPDATE',
      blocks: JSON.stringify([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*TASK STATUS UPDATE*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\n>_${context.description}_`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\n*Status: ${context.status}*`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Updated By: @${context.updatedBy}`
          }
        },
        {
          type: 'divider'
        }
      ])
    };
  }
};
