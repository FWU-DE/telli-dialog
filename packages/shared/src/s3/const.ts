/**
 * In OTC a maximum of 1000 objects can be deleted with a single request.
 * https://docs.otc.t-systems.com/object-storage-service/s3api/operations_on_objects/delete_multiple_objects.html
 */
export const S3_DELETE_OBJECTS_MAX = 1000;

export const ONE_DAY = 24 * 3600;
export const SEVEN_DAYS = 7 * ONE_DAY;
