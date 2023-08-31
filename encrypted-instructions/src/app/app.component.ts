import { Component } from '@angular/core';
import { FileReaderService } from './file-reader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'encrypted-instructions';
  response = '';
  constructor( private fileReaderService: FileReaderService) {}

  async onFileInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        let content = await this.fileReaderService.readTextFile(file);
        this.separateStringLines(content);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  }

  separateStringLines(text: string) {
    let lines = text.split("\n");
    let [M1, M2, N] = lines[0].split(' ').map(Number);
    let cleanCode = lines[3].replace(/(.)\1+/g, '$1');
    this.response = cleanCode.includes(lines[1]) ? 'SI\n' : 'NO\n';
    this.response = cleanCode.includes(lines[2]) ? this.response + 'SI' : this.response + 'NO\n';
  }
}
