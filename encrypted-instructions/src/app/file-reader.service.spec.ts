import { TestBed } from '@angular/core/testing';

import { FileReaderService } from './file-reader.service';

describe('FileReaderService', () => {
  let service: FileReaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileReaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should read a text file', async () => {
    const fileContent = '11 15 38\nCeseAlFuego\nCorranACubierto\nXXcaaamakkCCessseAAllFueeegooDLLKmmNNN';
    const mockFile = new File([fileContent], 'mock.txt');
    const result = await service.readTextFile(mockFile);
    expect(result).toBe(fileContent);
  });
});
