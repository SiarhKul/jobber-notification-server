import { Client } from '@elastic/elasticsearch';
import { ClusterHealthHealthResponseBody } from '@elastic/elasticsearch/lib/api/types';
import { config } from '@notifications/config';
import { winstonLogger } from '@SiarhKul/jobber-shared';
import { Logger } from 'winston';

const log: Logger = winstonLogger(
	`${config.ELASTIC_SEARCH_URL}`,
	'notificationElasticSearchServer',
	'debug'
);

const elasticSearchClient = new Client({
	node: `${config.ELASTIC_SEARCH_URL}`
});

export async function checkConnection(): Promise<void> {
	let isConnected = false;

	while (!isConnected) {
		try {
			const health: ClusterHealthHealthResponseBody= await elasticSearchClient.cluster.health({});
			
      log.info(`Notification Elasticsearch health status-${health.status}`);
			
      isConnected = true;
		} catch (error) {
			log.error('Notification Elasticsearch connection failed. Retrying in 5 seconds.', error);
			
      await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}
}