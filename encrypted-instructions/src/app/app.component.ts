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
    if(file?.type != 'text/plain'){
      this.errorFound = true;
      this.errorMessage = 'El tipo de archivo es invalido';
      return;
    }
    

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
    this.response = cleanCode.includes(lines[1]) ? cleanCode.includes(lines[2]) ? this.twoCodesInLine() : 'SI\nNO' : cleanCode.includes(lines[2]) ? 'NO\nSI' : 'NO\nNO';
    if(!this.errorFound){
      this.downloadTxtFile('codigo_encriptado');
    }
  }

  twoCodesInLine() {
    this.errorFound = true;
    this.errorMessage = 'No puede tener dos instrucciones el mensaje.'
    return 'Error';
  }

  validateSecretCode(m1: number, m2: number, n: number, line: string[]) {
    //we can check also if the line is same lenght as m1, m2 and n
    let pattern = /^[a-zA-Z0-9]+$/;
    let instructionPattern = /(.)\1+/g;
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
    let p1: any[] = [];
    let p2: any[] = [];
    let lines = text.trim().split("\n");
    let rounds = parseInt(lines[0]);
    if(this.validatePlayersConditions(rounds,lines)) {
      this.errorFound = true;
      return;
    }
    await Promise.all(lines.slice(1, rounds + 1).map(async (line) => {
        let player = line.split(' ').map(Number);
        let difference = Math.abs(player[0] - player[1]);
        if(difference % 1 != 0) {
          this.errorFound = true;
          this.errorMessage = 'Existe un número que no es entero.';
        }
        if(player[0] > player[1]) {
          p1.push({text: `1 ${difference}`, dif: difference})
         } else {
          p2.push({text: `2 ${difference}`, dif: difference})
        }
        if(difference == 0) {
          this.errorFound = true;
          this.errorMessage = 'Una o más rondas tienen de ventaja 0.'
        }
    }));

    const resultWithMaxDifference = this.chooseWinner(p1, p2);
    if (!resultWithMaxDifference) {
      this.errorMessage = 'No existe empate';
      this.errorFound = true;
      return;
    }
    if(resultWithMaxDifference[0].dif % 1 != 0) {
      this.errorFound = true;
      this.errorMessage = 'La mayor ventaja no es entero.';
      return;
    }
    this.response = resultWithMaxDifference[0].text
    /* const resultWithMaxDifference = results.reduce((maxResult, currentResult) => {
      return currentResult.dif > maxResult.dif ? currentResult : maxResult;
    });
    this.response = resultWithMaxDifference.text; */
    this.downloadTxtFile('mejor_jugador');
  }
  //this function is for selecting the best player, in case there is a tie
  chooseWinner(player1: any[], player2: any[]) {
    player1.sort((a,b) => {return b.dif - a.dif});
    player2.sort((a,b) => {return b.dif - a.dif});
    let chosenArray = null;
    let i = 0;
    if(player1[0].dif == player2[0].dif) {
      this.errorMessage = 'Las ventajas más grandes son iguales, por lo que el ganador se escogerá con las subsecuentes.';
      this.errorFound = true;
    }
    while (i < player1.length && i < player2.length && !chosenArray) {
      if (player1[i].dif > player2[i].dif) {
          chosenArray = player1;
      } else if (player2[i].dif > player1[i].dif) {
          chosenArray = player2;
      }
      i++;
    }
    return chosenArray;
  }

  validatePlayersConditions(rounds: number,lines: string[]) {
    if(rounds>=10001) {
      this.errorMessage = 'Son mas de 10,000 rondas';
      return true;
    }
    if(rounds<=0) {
      this.errorMessage = 'El número de rondas es incorrecto';
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
