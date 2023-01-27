import { ApiError } from '../errors';
import { config } from '../../config';
import { TranslationJob } from './translation-job';
import { SupportedLanguage } from './supported-language';

class TranslationsService {
  #apiBaseUrl;

  constructor(apiBaseUrl) {
    this.#apiBaseUrl = apiBaseUrl;
  }

  async getSupportedLanguages() {
    const url = `${this.#apiBaseUrl}/supported-languages`;

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return data.map(
        (supportedLanguage) =>
          new SupportedLanguage(
            supportedLanguage['languageCode'],
            supportedLanguage['displayName']
          )
      );
    } else {
      const errorResponse = await response.json();
      throw new ApiError(errorResponse.message);
    }
  }

  async createTranslationJob(file, targetLanguageCode) {
    const url = `${this.#apiBaseUrl}/translation-jobs`;

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
        data['id'],
        data['status'],
        data['targetLanguageCode'],
        data['fileName'],
        data['translatedFileName']
      );
    } else {
      const errorResponse = await response.json();
      throw new ApiError(errorResponse.message);
    }
  }

  async getTranslationJob(translationJobId) {
    const url = `${this.#apiBaseUrl}/translation-jobs/${translationJobId}`;

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return new TranslationJob(
        data['id'],
        data['status'],
        data['targetLanguageCode'],
        data['fileName'],
        data['translatedFileName']
      );
    } else {
      const errorResponse = await response.json();
      throw new ApiError(errorResponse.message);
    }
  }
}

const translationsService = new TranslationsService(config.apiBaseUrl);

export { translationsService };
