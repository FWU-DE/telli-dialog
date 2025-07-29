import { dumpBucketContent } from './dump_bucket_content';

const ENV_NAME = 'local';

dumpBucketContent(`./export/${ENV_NAME}`).then(() => {
  console.log(`Bucket content dumped for ${ENV_NAME}`);
});
