import path from 'path';
import stream from 'stream';
import {Firestore} from '@google-cloud/firestore';
import {Storage} from '@google-cloud/storage';

interface TranslationServiceArgs {
  firestore: Firestore;
  storage: Storage;
  translateDocumentsGCSBucket: string;
}

interface CreateTranslationJobArgs {
  targetLanguageCode: string;
  fileName: string;
  data: Buffer;
}

class TranslationService {
  private readonly firestore: Firestore;
  private readonly storage: Storage;
  private readonly translateDocumentsGCSBucket: string;

  private translationJobsCollection = 'translation-jobs';

  constructor(args: TranslationServiceArgs) {
    this.firestore = args.firestore;
    this.storage = args.storage;
    this.translateDocumentsGCSBucket = args.translateDocumentsGCSBucket;
  }

  async createTranslationJob(
    createTranslationJobArgs: CreateTranslationJobArgs
  ) {
    const parsedFileName = path.parse(createTranslationJobArgs.fileName);

    const translatedFileName = `${parsedFileName.name}.${createTranslationJobArgs.targetLanguageCode}${parsedFileName.ext}`;

    console.log('creating translation job', createTranslationJobArgs);

    const translationJobDocRef = await this.firestore
      .collection(this.translationJobsCollection)
      .add({
        targetLanguageCode: createTranslationJobArgs.targetLanguageCode,
        fileName: createTranslationJobArgs.fileName,
        translatedFileName,
      });

    console.log('translation job created!', translationJobDocRef.id);

    const gcsBucket = this.storage.bucket(this.translateDocumentsGCSBucket);

    const gcsFile = gcsBucket.file(translationJobDocRef.id);

    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(createTranslationJobArgs.data);
    passthroughStream.end();

    passthroughStream.pipe(gcsFile.createWriteStream()).on('finish', () => {
      // The file upload is complete
    });

    console.log(`${gcsFile.name} uploaded to ${gcsBucket.name}!`);

    return translationJobDocRef.id;
  }
}

export {TranslationService};
