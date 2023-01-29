import { ApiError } from '../errors';
import { TranslationJob } from './translation-job';
import { SupportedLanguage } from './supported-language';

class TranslationsService {
  async getSupportedLanguages() {
    const url = '/api/v1/supported-languages';

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return data.map(
        (supportedLanguage) =>
          new SupportedLanguage(
            supportedLanguage.languageCode,
            supportedLanguage.displayName
          )
      );
    } else {
      const errorResponse = await response.json();
      throw new ApiError(errorResponse.message);
    }
  }

  async createTranslationJob(file, targetLanguageCode) {
    const url = '/api/v1/translation-jobs';

    const formData = new FormData();

    formData.append('file', file);
    formData.append('targetLanguageCode', targetLanguageCode);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return new TranslationJob(
        data.id,
        data.status,
        data.targetLanguageCode,
        data.fileName,
        data.translatedFileName
      );
    } else {
      const errorResponse = await response.json();
      throw new ApiError(errorResponse.message);
    }
  }
}

const translationsService = new TranslationsService();

export { translationsService };
