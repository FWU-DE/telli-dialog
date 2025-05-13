import { dumpBucketContent } from './dump_bucket_content';

const ENV_NAME = 'prod';

dumpBucketContent(`./export/${ENV_NAME}`).then(() => {
  console.log(`Bucket content dumped for ${ENV_NAME}`);
});
