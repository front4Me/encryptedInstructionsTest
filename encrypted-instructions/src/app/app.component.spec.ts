import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { FileReaderService } from './file-reader.service';

describe('AppComponent', () => {
  const fileServiceStub = {
    readTextFile(file: any) {
      return '11 15 38\nCeseAlFuego\nCorranACubierto\nXXcaaamakkCCessseAAllFueeegooDLLKmmNNN'
    }
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      teardown: { destroyAfterEach: true },
      declarations: [
        AppComponent
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {porvide: FileReaderService, useValue: fileServiceStub}
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'encrypted-instructions'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('encrypted-instructions');
  });

  it('should handle text input change correctly', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const fileContent = '11 15 38\nCeseAlFuego\nCorranACubierto\nXXcaaamakkCCessseAAllFueeegooDLLKmmNNN';
    app.separateStringLines(fileContent);
    expect(app.response).toContain('SI\n');
  });

  it('should handle number correctly', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const fileContent = '5\n140 82\n89 134\n90 110\n112 106\n88 90';
    await app.processGameData(fileContent);
    expect(app.response).toBe('1 58');
  });
});
