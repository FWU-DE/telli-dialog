import { Counter, metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('telli.webscraper.version', '0.1.0');

let crawl4aiSuccessCounter: Counter | undefined;
let readabilitySuccessCounter: Counter | undefined;
let webScraperFailedCounter: Counter | undefined;

function getCrawl4aiSuccessCounter() {
  if (!crawl4aiSuccessCounter) {
    crawl4aiSuccessCounter = meter.createCounter('telli_crawl4ai_success', {
      description: 'Counts the number of times the crawl4ai is successful.',
    });
  }
  return crawl4aiSuccessCounter;
}
function getReadabilitySuccessCounter() {
  if (!readabilitySuccessCounter) {
    readabilitySuccessCounter = meter.createCounter('telli_readability_success', {
      description: 'Counts the number of times the readability is successful.',
    });
  }
  return readabilitySuccessCounter;
}

function getWebScraperFailedCounter() {
  if (!webScraperFailedCounter) {
    webScraperFailedCounter = meter.createCounter('telli_webscraper_failed', {
      description: 'Counts the number of times crawl4ai and readability have failed.',
    });
  }
  return webScraperFailedCounter;
}

export function incrementCrawl4aiSuccessCounter() {
  getCrawl4aiSuccessCounter().add(1);
}

export function incrementReadabilitySuccessCounter() {
  getReadabilitySuccessCounter().add(1);
}

export function incrementWebScraperFailedCounter() {
  getWebScraperFailedCounter().add(1);
}
