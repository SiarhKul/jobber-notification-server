import { IEmailLocals, winstonLogger } from '@SiarhKul/jobber-shared';
import { Channel, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { config } from '@notifications/config';
import { createConnection } from '@notifications/queues/connection';
import { sendEmail } from './mail.transport';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'emailConsumer', 'debug');

export const exchangeName = 'jobber-email-notification';
export const routingKey = 'auth-email';
export const queueName = 'auth-email-queue';

async function consumeAuthEmailMessages(channel?: Channel): Promise<void> {
  try {
    const activeChannel = channel ?? ((await createConnection()) as Channel);

    await activeChannel.assertExchange(exchangeName, 'direct');
    await activeChannel.assertQueue(queueName, { durable: true, autoDelete: false });
    await activeChannel.bindQueue(queueName, exchangeName, routingKey);

    await activeChannel.consume(queueName, async (msg: ConsumeMessage | null) => {
      if (!msg) {
        return;
      }

      const { receiverEmail, username, verifyLink, resetLink, template } = JSON.parse(
        msg.content.toString()
      );

      const locals: IEmailLocals = {
        appLink: `${config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/Kyp2m0t/cover.png',
        username,
        verifyLink,
        resetLink
      };

      await sendEmail(template, receiverEmail, locals);

      activeChannel.ack(msg);
    });
  } catch (error) {
    log.log(
      'error',
      'NotificationService EmailConsumer consumeAuthEmailMessages() method error:',
      error
    );
  }
}
//========================================================
export const orderExchangeName = 'jobber-order-notification';
export const orderRoutingKey = 'order-email';
export const orderQueueName = 'order-email-queue';

async function consumeOrderEmailMessages(channel?: Channel): Promise<void> {
  try {
    const activeChannel = channel ?? ((await createConnection()) as Channel);

    await activeChannel.assertExchange(orderExchangeName, 'direct');

    const orderQueue = await activeChannel.assertQueue(orderQueueName, {
      durable: true,
      autoDelete: false
    });

    await activeChannel.bindQueue(orderQueue.queue, orderExchangeName, orderRoutingKey);

    await activeChannel.consume(orderQueue.queue, async (msg: ConsumeMessage | null) => {
      if (!msg) {
        return;
      }

      const {
        receiverEmail,
        username,
        template,
        sender,
        offerLink,
        amount,
        buyerUsername,
        sellerUsername,
        title,
        description,
        deliveryDays,
        orderId,
        orderDue,
        requirements,
        orderUrl,
        originalDate,
        newDate,
        reason,
        subject,
        header,
        type,
        message,
        serviceFee,
        total
      } = JSON.parse(msg.content.toString());

      const locals: IEmailLocals = {
        appLink: `${config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/Kyp2m0t/cover.png',
        username,
        sender,
        offerLink,
        amount,
        buyerUsername,
        sellerUsername,
        title,
        description,
        deliveryDays,
        orderId,
        orderDue,
        requirements,
        orderUrl,
        originalDate,
        newDate,
        reason,
        subject,
        header,
        type,
        message,
        serviceFee,
        total
      };

      if (template === 'orderPlaced') {
        await sendEmail('orderPlaced', receiverEmail, locals);
        await sendEmail('orderReceipt', receiverEmail, locals);
      } else {
        await sendEmail(template, receiverEmail, locals);
      }

      console.log(JSON.parse(msg.content.toString()));

      activeChannel.ack(msg);
    });
  } catch (error) {
    log.log(
      'error',
      'NotificationService EmailConsumer consumeOrderEmailMessages() method error:',
      error
    );
  }
}

export { consumeAuthEmailMessages, consumeOrderEmailMessages };
