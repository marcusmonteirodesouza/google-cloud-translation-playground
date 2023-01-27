import {TranslationJobStatus} from './translation-job-status';

interface TranslationJob {
  id: string;
  status: TranslationJobStatus;
  targetLanguageCode: string;
  fileName: string;
  translatedFileName: string;
}

export {TranslationJob};
