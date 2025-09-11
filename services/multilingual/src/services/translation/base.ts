import { TranslationRequest } from '../../types';

export abstract class TranslationProvider {
  abstract translate(request: TranslationRequest): Promise<string>;
  abstract translateBatch(requests: TranslationRequest[]): Promise<string[]>;
  abstract isAvailable(): boolean;
  abstract getName(): string;
}