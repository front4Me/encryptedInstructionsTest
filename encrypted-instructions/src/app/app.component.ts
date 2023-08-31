import { Component, ElementRef, ViewChild } from '@angular/core';
import { findIndex } from 'rxjs';
import { FileReaderService } from './file-reader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'encrypted-instructions';
  response = '';
  @ViewChild('file1') file1!: ElementRef;
  @ViewChild('file2') file2!: ElementRef;
  constructor( private fileReaderService: FileReaderService) {}

  async onFileInputChange(event: Event, type: string = 'instruction') {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        let content = await this.fileReaderService.readTextFile(file);
        if(type === 'instruction')
          this.separateStringLines(content);
        if(type === 'player')
          this.processGameData(content);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  }

  separateStringLines(text: string) {
    let lines = text.split("\n");
    let cleanCode = lines[3].replace(/(.)\1+/g, '$1');
    //could use this to compare lenght, don't need them at the moment...
    // let [M1, M2, N] = lines[0].split(' ').map(Number);

    this.response = cleanCode.includes(lines[1]) ? 'SI\n' : 'NO\n';
    this.response = cleanCode.includes(lines[2]) ? this.response + 'SI' : this.response + 'NO\n';
  }

  async processGameData(text: string) {
    let results: string[] = [];
    let dif: number[] = [];
    let lines = text.trim().split("\n");
    let rounds = parseInt(lines[0]);

    await Promise.all(lines.slice(1, rounds + 1).map(async (line) => {
        let player = line.split(' ').map(Number);
        let winner = player[0] > player[1] ? 1 : 2;
        let difference = Math.abs(player[0] - player[1]);
        results.push(`${winner} ${difference}`);
        dif.push(difference);
    }));
    
    this.response = results[dif.indexOf(Math.max(...dif))];
  }

  resetContent() {
    this.response = '';
    this.file1.nativeElement.value = null;
    this.file2.nativeElement.value = null;
  }
}
