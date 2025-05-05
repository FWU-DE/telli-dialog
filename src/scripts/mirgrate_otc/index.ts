import { dumpBucketContent } from "./dump_bucket_content";


dumpBucketContent('./export/staging').then(() => {
  console.log('Bucket content dumped');
});
