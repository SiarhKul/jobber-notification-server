import { Channel, ConsumeMessage } from 'amqplib';
import { config } from '@notifications/config';
import {
  consumeAuthEmailMessages,
  exchangeName,
  queueName,
  routingKey
} from '@notifications/queues/email.consumer';
import { sendEmail } from '@notifications/queues/mail.transport';

jest.mock('@notifications/queues/connection');
jest.mock('@notifications/queues/mail.transport');
jest.mock('@SiarhKul/jobber-shared', () => ({
  winstonLogger: jest.fn(() => ({ log: jest.fn() }))
}));

describe('consumeAuthEmailMessages', () => {
  const sendEmailMock = jest.mocked(sendEmail);
  const channel = {
    assertExchange: jest.fn().mockResolvedValue({ exchange: exchangeName }),
    assertQueue: jest
      .fn()
      .mockResolvedValue({ queue: queueName, messageCount: 0, consumerCount: 0 }),
    bindQueue: jest.fn().mockResolvedValue({}),
    consume: jest.fn().mockResolvedValue({ consumerTag: 'auth-email-consumer' }),
    ack: jest.fn()
  } as unknown as jest.Mocked<Channel>;

  beforeEach(() => {
    jest.clearAllMocks();
    sendEmailMock.mockResolvedValue(undefined);
  });

  it('configures the auth-email queue, sends the email, and acknowledges the message', async () => {
    await consumeAuthEmailMessages(channel);

    expect(channel.assertExchange).toHaveBeenCalledWith(exchangeName, 'direct');
    expect(channel.assertQueue).toHaveBeenCalledWith(queueName, {
      durable: true,
      autoDelete: false
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(queueName, exchangeName, routingKey);

    const messageHandler = channel.consume.mock.calls[0][1];
    const message = {
      content: Buffer.from(
        JSON.stringify({
          receiverEmail: 'buyer@example.com',
          username: 'buyer',
          verifyLink: 'https://jobber.test/verify',
          resetLink: 'https://jobber.test/reset',
          template: 'verifyEmail'
        })
      )
    } as ConsumeMessage;

    await messageHandler(message);

    expect(sendEmailMock).toHaveBeenCalledWith('verifyEmail', 'buyer@example.com', {
      appLink: config.CLIENT_URL,
      appIcon: 'https://i.ibb.co/Kyp2m0t/cover.png',
      username: 'buyer',
      verifyLink: 'https://jobber.test/verify',
      resetLink: 'https://jobber.test/reset'
    });
    expect(channel.ack).toHaveBeenCalledWith(message);
  });
});
