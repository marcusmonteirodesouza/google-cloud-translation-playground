import path from 'path';
import {pipeline} from 'stream/promises';
import stream from 'stream';
import {Firestore} from '@google-cloud/firestore';
import {Storage} from '@google-cloud/storage';
import {TranslationServiceClient} from '@google-cloud/translate';
import {TranslationJob} from './translation-job';
import {TranslationJobStatus} from './translation-job-status';
import {NotFoundError} from '../errors';

interface TranslationsServiceDeps {
  firestore: Firestore;
  storage: Storage;
  translationServiceClient: TranslationServiceClient;
  translateDocumentsGCSBucket: string;
  translatedDocumentsGCSBucket: string;
}

interface CreateTranslationJobArgs {
  targetLanguageCode: string;
  fileName: string;
  data: Buffer;
}

class TranslationsService {
  private readonly firestore: Firestore;
  private readonly storage: Storage;
  private readonly translationServiceClient: TranslationServiceClient;
  private readonly translateDocumentsGCSBucket: string;
  private readonly translatedDocumentsGCSBucket: string;

  private translationJobsCollection = 'translation-jobs';

  constructor(deps: TranslationsServiceDeps) {
    this.firestore = deps.firestore;
    this.storage = deps.storage;
    this.translationServiceClient = deps.translationServiceClient;
    this.translateDocumentsGCSBucket = deps.translateDocumentsGCSBucket;
    this.translatedDocumentsGCSBucket = deps.translatedDocumentsGCSBucket;
  }

  async getSupportedLanguages(displayLanguageCode: string) {
    const projectId = await this.translationServiceClient.getProjectId();

    const [supportedLanguages] =
      await this.translationServiceClient.getSupportedLanguages({
        parent: this.translationServiceClient.locationPath(projectId, 'global'),
        displayLanguageCode,
      });

    return supportedLanguages.languages
      ?.filter(language => language.supportTarget)
      .map(language => {
        return {
          languageCode: language.languageCode,
          displayName: language.displayName,
        };
      });
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
    };

    const translationJobDocRef = await this.firestore
      .collection(this.translationJobsCollection)
      .add(translationJobDocumentData);

    console.log('translation job document created!', translationJobDocRef.id);

    const gcsBucket = this.storage.bucket(this.translateDocumentsGCSBucket);

    const gcsFileName = `${translationJobDocRef.id}${parsedFileName.ext}`;

    const gcsFile = gcsBucket.file(gcsFileName);

    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(createTranslationJobArgs.data);
    passthroughStream.end();

    await pipeline(passthroughStream, gcsFile.createWriteStream());

    console.log(`${gcsFile.name} uploaded to ${gcsBucket.name}!`);

    return {
      id: translationJobDocRef.id,
      ...translationJobDocumentData,
    };
  }

  async getTranslationJob(
    translationJobId: string
  ): Promise<TranslationJob | undefined> {
    const translationJobDoc = await this.getTranslationJobDoc(
      translationJobId
    ).get();

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
    };
  }

  getTranslationJobDoc(translationJobId: string) {
    return this.firestore.doc(
      `${this.translationJobsCollection}/${translationJobId}`
    );
  }

  async getTranslatedFile(translationJobId: string) {
    const translationJob = await this.getTranslationJob(translationJobId);

    if (!translationJob) {
      throw new NotFoundError(`translation job ${translationJobId} not found`);
    }

    if (translationJob.status !== TranslationJobStatus.Done) {
      throw new RangeError(
        `translation ${translationJobId} can only be downloaded after it is ${TranslationJobStatus.Done}`
      );
    }

    const parsedFileName = path.parse(translationJob.fileName);

    const gcsBucketTranslatedFileName = `${translationJobId}${parsedFileName.ext}`;

    const [file] = await this.storage
      .bucket(this.translatedDocumentsGCSBucket)
      .file(gcsBucketTranslatedFileName)
      .get();

    if (!(await file.exists())) {
      throw new NotFoundError('file does not exist');
    }

    return {
      file,
      translatedFileName: translationJob.translatedFileName,
    };
  }
}

export {TranslationsService};
