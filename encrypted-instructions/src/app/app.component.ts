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
  errorFound = false;
  errorMessage = '';
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
    if(this.errorFound){
      this.errorFound = false;
      this.errorMessage = '';
    }
    let lines = text.split("\n");
    let cleanCode = lines[3].replace(/(.)\1+/g, '$1');
    let [M1, M2, N] = lines[0].split(' ').map(Number);
    if(this.validateSecretCode(M1,M2,N,lines)) {
      this.errorFound = true;
      return;
    }
    this.response = cleanCode.includes(lines[1]) ? 'SI\nNO' : cleanCode.includes(lines[2]) ? 'NO\nSI' : 'NO\nNO';
    this.downloadTxtFile('codigo_encriptado');
  }

  validateSecretCode(m1: number, m2: number, n: number, line: string[]) {
    //we can check also if the line is same lenght as m1, m2 and n
    let pattern = /^[a-zA-Z0-9]+$/;
    let instructionPattern = /(.)\1+/g
    console.log(line[1].length);
    
    if(m1 <= 1 || m1 >= 51) {
      this.errorMessage = 'La instrucción 1 tiene que estar entre 2 y 50 caracteres';
      return true;
    }
    else if(m1 != line[1].length) {
      this.errorMessage = 'm1 y la segunda línea no coinciden';
      return true;
    }
    else if(instructionPattern.test(line[1])){
      this.errorMessage = 'La instrucción 1 tiene letras consecutivas iguales';
      return true;
    }
    else if(m2 <= 1 || m2 >= 51) {
      this.errorMessage = 'La instrucción 2 tiene que estar entre 2 y 50 caracteres';
      return true;
    }
    else if(m2 != line[2].length) {
      this.errorMessage = 'm2 y la tercera línea no coinciden';
      return true;
    }
    else if(instructionPattern.test(line[2])){
      this.errorMessage = 'La instrucción 2 tiene letras consecutivas iguales';
      return true;
    }
    else if(n <= 2 || n >= 5001) {
      this.errorMessage = 'El mensaje tiene que estar entre 3 y 5000 caracteres';
      return true;
    }
    else if(n != line[3].length) {
      this.errorMessage = 'n y la cuarta línea no coinciden';
      return true;
    }
    else if(!pattern.test(line[3])){
      this.errorMessage = 'El mensaje tiene que ser letras o números';
      return true;
    }
    return false;
  }

  async processGameData(text: string) {
    let results: any[] = [];
    let lines = text.trim().split("\n");
    let rounds = parseInt(lines[0]);
    if(this.validatePlayersConditions(rounds,lines)) {
      this.errorFound = true;
      return;
    }
    await Promise.all(lines.slice(1, rounds + 1).map(async (line) => {
        let player = line.split(' ').map(Number);
        let winner = player[0] > player[1] ? 1 : 2;
        let difference = Math.abs(player[0] - player[1]);
        results.push({text: `${winner} ${difference}`, dif: difference});
    }));
    const resultWithMaxDifference = results.reduce((maxResult, currentResult) => {
      return currentResult.dif > maxResult.dif ? currentResult : maxResult;
  });
    this.response = resultWithMaxDifference.text;
    this.downloadTxtFile('mejor_jugador');
  }

  validatePlayersConditions(rounds: number,lines: string[]) {
    if(rounds>=10001) {
      this.errorMessage = 'Son mas de 10,000 rondas';
      return true;
    }
    if(rounds!=(lines.length-1)) {
      this.errorMessage = 'No coinciden las rondas con las lineas del archivo';
      return true;
    }
    return false;
  }

  resetContent() {
    this.response = '';
    this.file1.nativeElement.value = null;
    this.file2.nativeElement.value = null;
    this.errorFound = false;
    this.errorMessage = '';
  }

  downloadTxtFile(type: string) {
    const blob = new Blob([this.response], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
  
    anchor.href = url;
    anchor.download = `resultado_${type}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
  
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  }
}
