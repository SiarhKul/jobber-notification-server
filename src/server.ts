import { winstonLogger } from '@SiarhKul/jobber-shared';
import 'express-async-errors';

import * as http from 'http';
import type { Application } from 'express';
import { Logger } from 'winston';
import { config } from '@notifications/config';
import { healthRoute } from './routes';
import { checkConnection } from './elasticsearch';
import { createConnection } from './queues/connection';
import { Channel } from 'amqplib';
import {
  consumeAuthEmailMessages,
  consumeOrderEmailMessages
  // exchangeName,
  // orderExchangeName,
  // orderRoutingKey,
  // routingKey
} from './queues/email.consumer';

const SERVER_PORT = 4001;

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationApp', 'debug');

export function start(app: Application): void {
  startServer(app);
  app.use('', healthRoute());
  startQueues();
  startElasticSearch();
}

function startServer(app: Application): void {
  try {
    const httpServer: http.Server = new http.Server(app);

    log.info(`Worker with process id of ${process.pid} on notification server has started`);

    httpServer.listen(SERVER_PORT, () => {
      log.info(`Notification server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.log('error', 'NotificationService startServer() method:', error);
  }
}

async function startQueues(): Promise<void> {
  log.info('Notification queues started');

  const emailChanel: Channel = (await createConnection()) as Channel;
  await consumeAuthEmailMessages(emailChanel);
  await consumeOrderEmailMessages(emailChanel);

  //publishing auth
  // const messageDetails = {
  //   receiverEmail: `${config.SENDER_EMAIL}`,
  //   verifyLink: `${config.CLIENT_URL}/confirm_email?v_token=123234whqhqhewhqhqe`,
  //   template: 'verifyEmail'
  // };

  // await emailChanel.assertExchange(exchangeName, 'direct');
  // const message = JSON.stringify(messageDetails);
  // emailChanel.publish(exchangeName, routingKey, Buffer.from(message));

  //publishing order
  // await emailChanel.assertExchange(orderExchangeName, 'direct');
  // const message2 = JSON.stringify({ name: 'jobber', service: 'order notification service' });
  // emailChanel.publish(orderExchangeName, orderRoutingKey, Buffer.from(message2));
}

function startElasticSearch(): void {
  checkConnection();
  log.info('Notification elastic search started');
}
