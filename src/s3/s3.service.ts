import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private s3: AWS.S3;

  constructor() {
    // Configure AWS S3 from environment variables
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'AKIA5QELDK32OFK7YBRL';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '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';
    const region = process.env.AWS_REGION || 'ap-south-1';

    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region,
    });

    this.s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      region,
      signatureVersion: 'v4',
    });
    
    console.log('S3 Service initialized:', {
      region,
      accessKeyId: accessKeyId.substring(0, 10) + '...',
      bucket: 'indianpgmanagement'
    });
  }

  async uploadFile(uploadData: {
    key: string;
    contentType: string;
    fileData: string;
    isPublic: boolean;
    bucket: string;
  }): Promise<AWS.S3.ManagedUpload.SendData> {
    const { key, contentType, fileData, isPublic, bucket } = uploadData;

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // ACL removed - bucket doesn't support ACLs, uses default permissions
    };

    console.log('Uploading to S3:', { bucket, key, contentType, size: buffer.length });

    return this.s3.upload(params).promise();
  }

  async deleteFile(deleteData: {
    key: string;
    bucket: string;
  }): Promise<AWS.S3.DeleteObjectOutput> {
    const { key, bucket } = deleteData;

    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: bucket,
      Key: key,
    };

    console.log('Deleting from S3:', { bucket, key });

    return this.s3.deleteObject(params).promise();
  }

  async deleteMultipleFiles(deleteData: {
    keys: string[];
    bucket: string;
  }): Promise<AWS.S3.DeleteObjectsOutput> {
    const { keys, bucket } = deleteData;

    const params: AWS.S3.DeleteObjectsRequest = {
      Bucket: bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
      },
    };

    console.log('Bulk deleting from S3:', { bucket, keys });

    return this.s3.deleteObjects(params).promise();
  }

  async fileExists(query: {
    key: string;
    bucket: string;
  }): Promise<boolean> {
    const { key, bucket } = query;

    const params: AWS.S3.HeadObjectRequest = {
      Bucket: bucket,
      Key: key,
    };

    try {
      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}
