const path = require('path');
const { pipeline } = require('stream/promises');
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
  #textTranslationContentTypes = ['text/plain', 'text/html'];

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
   * @param {string} fileName
   */
  async executeTranslationJob(fileName, contentType) {
    const parsedFileName = path.parse(fileName);

    const translationJobId = parsedFileName.name;

    const translationJobDocRef = this.#firestore.doc(
      `${this.#translationJobsCollection}/${translationJobId}`
    );

    const translationJobDocData = (await translationJobDocRef.get()).data();

    if (!translationJobDocData) {
      throw new NotFoundError(`translation job ${translationJobId} not found`);
    }

    let translatedDocumentStream;

    if (this.#textTranslationContentTypes.includes(contentType)) {
      translatedDocumentStream = await this.#translateText(
        fileName,
        contentType,
        translationJobDocData.targetLanguageCode
      );
    } else {
      translatedDocumentStream = await this.#translateDocument(
        fileName,
        translationJobDocData.targetLanguageCode
      );
    }

    await this.#uploadFile(fileName, translatedDocumentStream);

    await this.updateTranslationJobStatus('Done');
  }

  async updateTranslationJobStatus(translationJobId, status) {
    const translationJobDocRef = this.#firestore.doc(
      `${this.#translationJobsCollection}/${translationJobId}`
    );

    await translationJobDocRef.update({
      status,
    });
  }

  async #translateText(fileName, contentType, targetLanguageCode) {
    const projectId = await this.#translationServiceClient.getProjectId();

    const contents = await this.#downloadFileContents(fileName);

    const sourceLanguageCode = await this.#detectLanguage(contents);

    const [translateTextResponse] =
      await this.#translationServiceClient.translateText({
        parent: this.#translationServiceClient.locationPath(
          projectId,
          'global'
        ),
        contents: [contents],
        mimeType: contentType,
        sourceLanguageCode,
        targetLanguageCode,
      });

    const translatedText = translateTextResponse.translations[0].translatedText;

    return new TextEncoder().encode(translatedText);
  }

  async #translateDocument(fileName, targetLanguageCode) {
    const projectId = await this.#translationServiceClient.getProjectId();

    const contents = await this.#downloadFileContents(fileName);

    const sourceLanguageCode = await this.#detectLanguage(contents);

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

    return translateDocumentResponse.documentTranslation.byteStreamOutputs[0];
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

  async #downloadFileContents(fileName) {
    const content = (
      await this.#storage
        .bucket(this.#translateDocumentsGCSBucket)
        .file(fileName)
        .download()
    ).toString();

    return content;
  }

  async #uploadFile(translatedFileName, translatedDocumentStream) {
    const translatedDocumentFile = this.#storage
      .bucket(this.#translatedDocumentsGCSBucket)
      .file(translatedFileName);

    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(translatedDocumentStream);
    passthroughStream.end();

    await pipeline(
      passthroughStream,
      translatedDocumentFile.createWriteStream()
    );
  }
}

module.exports = { TranslationsService };
