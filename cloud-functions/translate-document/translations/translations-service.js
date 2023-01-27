const stream = require('stream');
const { Firestore } = require('@google-cloud/firestore'); // eslint-disable-line no-unused-vars
const { Storage } = require('@google-cloud/storage'); // eslint-disable-line no-unused-vars
const { TranslationServiceClient } = require('@google-cloud/translate').v3beta1; // eslint-disable-line no-unused-vars
const { NotFoundError } = require('../errors');

class TranslationsService {
  #firestore;
  #storage;
  #translationServiceClient;
  #translateDocumentsGCSBucket;
  #translatedDocumentsGCSBucket;
  #translationJobsCollection = 'translation-jobs';

  /**
   * Creates a TranslationJobService instance
   * @param {Firestore} firestore
   * @param {Storage} storage
   * @param {TranslationServiceClient} translationServiceClient
   * @param {string} translateDocumentsGCSBucket
   * @param {string} translatedDocumentsGCSBucket
   */
  constructor(
    firestore,
    storage,
    translationServiceClient,
    translateDocumentsGCSBucket,
    translatedDocumentsGCSBucket
  ) {
    this.#firestore = firestore;
    this.#storage = storage;
    this.#translationServiceClient = translationServiceClient;
    this.#translateDocumentsGCSBucket = translateDocumentsGCSBucket;
    this.#translatedDocumentsGCSBucket = translatedDocumentsGCSBucket;
  }

  /**
   * Executes a Translation Job.
   * @param {string} translationJobId
   */
  async executeTranslationJob(translationJobId) {
    const translationJobDocRef = this.#firestore.doc(
      `${this.#translationJobsCollection}/${translationJobId}`
    );

    const translationJobDocData = (await translationJobDocRef.get()).data();

    if (!translationJobDocData) {
      throw new NotFoundError(`translation job ${translationJobId} not found`);
    }

    await this.translateAndUploadFile(
      translationJobDocData.fileName,
      translationJobDocData.translatedFileName,
      translationJobDocData.targetLanguageCode
    );

    await translationJobDocRef.update({
      status: 'Done',
    });
  }

  async translateAndUploadFile(
    fileName,
    translatedFileName,
    targetLanguageCode
  ) {
    const projectId = await this.#translationServiceClient.getProjectId();

    const content = (
      await this.#storage
        .bucket(this.#translateDocumentsGCSBucket)
        .file(fileName)
        .download()
    ).toString();

    const sourceLanguageCode = await this.#detectLanguage(content);

    const [translateDocumentResponse] =
      await this.#translationServiceClient.translateDocument({
        parent: this.#translationServiceClient.locationPath(
          projectId,
          'global'
        ),
        documentInputConfig: {
          gcsSource: {
            inputUri: `gs://${this.#translateDocumentsGCSBucket}/${fileName}`,
          },
        },
        sourceLanguageCode,
        targetLanguageCode,
      });

    const translatedDocumentFile = this.#storage(
      this.#translatedDocumentsGCSBucket
    ).file(translatedFileName);

    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(
      translateDocumentResponse.documentTranslation.byteStreamOutputs[0]
    );
    passthroughStream.end();

    passthroughStream
      .pipe(translatedDocumentFile.createWriteStream())
      .on('finish', () => {
        // The file upload is complete
      });
  }

  async #detectLanguage(content) {
    const projectId = await this.#translationServiceClient.getProjectId();

    // See https://cloud.google.com/translate/quotas#content
    const detectLanguageContentSize = 5000;

    const [detectLanguageResponse] =
      await this.#translationServiceClient.detectLanguage({
        parent: `projects/${projectId}`,
        content: content.substring(0, detectLanguageContentSize),
      });

    const languageCode = detectLanguageResponse.languages.reduce(
      (prev, current) => (prev.confidence > current.confidence ? prev : current)
    )['languageCode'];

    return languageCode;
  }
}

module.exports = { TranslationsService };
