import path from 'path';
import stream from 'stream';
import {Firestore} from '@google-cloud/firestore';
import {Storage} from '@google-cloud/storage';

interface TranslationServiceDeps {
  firestore: Firestore;
  storage: Storage;
  translateDocumentsGCSBucket: string;
}

interface CreateTranslationJobArgs {
  targetLanguageCode: string;
  fileName: string;
  data: Buffer;
}

enum TranslationJobStatus {
  InProgress = 'InProgress',
  Done = 'Done',
}

interface TranslationJob {
  id: string;
  status: TranslationJobStatus;
  targetLanguageCode: string;
  fileName: string;
  translatedFileName: string;
  translatedFileUrl: string | undefined;
}

class TranslationService {
  private readonly firestore: Firestore;
  private readonly storage: Storage;
  private readonly translateDocumentsGCSBucket: string;

  private translationJobsCollection = 'translation-jobs';

  constructor(deps: TranslationServiceDeps) {
    this.firestore = deps.firestore;
    this.storage = deps.storage;
    this.translateDocumentsGCSBucket = deps.translateDocumentsGCSBucket;
  }

  async createTranslationJob(
    createTranslationJobArgs: CreateTranslationJobArgs
  ): Promise<TranslationJob> {
    const parsedFileName = path.parse(createTranslationJobArgs.fileName);

    const translatedFileName = `${parsedFileName.name}.${createTranslationJobArgs.targetLanguageCode}${parsedFileName.ext}`;

    console.log('creating translation job...', createTranslationJobArgs);

    const translationJobDocumentData = {
      status: TranslationJobStatus.InProgress,
      targetLanguageCode: createTranslationJobArgs.targetLanguageCode,
      fileName: createTranslationJobArgs.fileName,
      translatedFileName,
      translatedFileUrl: undefined,
    };

    const translationJobDocRef = await this.firestore
      .collection(this.translationJobsCollection)
      .add(translationJobDocumentData);

    console.log('translation job document created!', translationJobDocRef.id);

    const gcsBucket = this.storage.bucket(this.translateDocumentsGCSBucket);

    const gcsFileName = `${translationJobDocRef.id}.${parsedFileName.ext}`;

    const gcsFile = gcsBucket.file(gcsFileName);

    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(createTranslationJobArgs.data);
    passthroughStream.end();

    passthroughStream.pipe(gcsFile.createWriteStream()).on('finish', () => {
      // The file upload is complete
    });

    console.log(`${gcsFile.name} uploaded to ${gcsBucket.name}!`);

    return {
      id: translationJobDocRef.id,
      ...translationJobDocumentData,
    };
  }

  async getTranslationJob(
    translationJobId: string
  ): Promise<TranslationJob | undefined> {
    const translationJobDoc = await this.firestore
      .doc(`${this.translationJobsCollection}/${translationJobId}`)
      .get();

    const translationJobDocData = translationJobDoc.data();

    if (!translationJobDocData) {
      return;
    }

    return {
      id: translationJobDoc.id,
      status: translationJobDocData.status,
      targetLanguageCode: translationJobDocData.targetLanguageCode,
      fileName: translationJobDocData.fileName,
      translatedFileName: translationJobDocData.translatedFileName,
      translatedFileUrl: translationJobDocData.translatedFileUrl,
    };
  }
}

export {TranslationService};
