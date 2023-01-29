class TranslationJob {
  constructor(id, status, targetLanguageCode, fileName, translatedFileName) {
    this.id = id;
    this.status = status;
    this.targetLanguageCode = targetLanguageCode;
    this.fileName = fileName;
    this.translatedFileName = translatedFileName;
  }
}

export { TranslationJob };
