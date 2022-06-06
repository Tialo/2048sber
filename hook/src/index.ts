import { Dialute, SberRequest } from 'dialute';

const textToCommand = (texts: string[]) => {
  let text = texts.join(' ');
  text = text.toLocaleLowerCase();
  let down = ['низ'], up = ['верх'], left = ['лево'], right = ['право'];
  let helps = [
      'справка', 'помог', 'помощи', 'как игр', 'научи', 'почему', 'что делать', 'что умеешь', 'навык', 'правила',
      'помощь'
  ];
  let greets = ['привет', 'здравствуй', 'здарова', 'здорова', 'хай', 'хеллоу'];
  let restarts = ['заново', 'новая игра', 'с начала', 'перезап', 'снова', 'по новой'];
  let close = ['закр'];
  for (let dir of down){
    if (text.includes(dir)) return {type: 'dir', dir: 'вниз'};
  }
  for (let dir of up){
    if (text.includes(dir)) return {type: 'dir', dir: 'вверх'};
  }
  for (let dir of left){
    if (text.includes(dir)) return {type: 'dir', dir: 'влево'};
  }
  for (let dir of right){
    if (text.includes(dir)) return {type: 'dir', dir: 'вправо'};
  }
  for (let help of helps){
    if (text.includes(help)) return {type: 'help'};
  }
  for (let greet of greets){
    if (text.includes(greet)) return {type: 'greet'};
  }
  for (let restart of restarts){
    if (text.includes(restart)) return {type: 'restart'};
  }
  for (let cls of close){
    if (text.includes(cls)) return {type: 'close'};
  }
  return {type: 'fail'};
}

function* script(r: SberRequest) {
  const rsp = r.buildRsp();
  let movePhrases = ['Двигаю', 'Сдвигаю', 'Перемещаю', 'Переношу'];
  let maleFailPhrases = ['Я пока не выучил эту команду', 'Расшифровка этого займет несколько часов',
    'Над этим мне нужно подумать', 'Разработчики работают над добавлением этой команды',
    'Скоро я пойму, что это значит'];
  let femaleFailPhrases = ['Я пока не выучила эту команду', 'Расшифровка этого займет несколько часов',
    'Над этим мне нужно подумать', 'Разработчики работают над добавлением этой команды',
    'Скоро я пойму, что это значит'];
  let officialGreets = ['Здравствуйте'];
  let unOfficialGreets = ['Привет', 'Привет-привет', 'Салют'];
  let { gender, appeal } = r.body.payload.character;

  let phrase;
  if (appeal === 'official') {
    let phraseIndex = Math.floor(Math.random() * officialGreets.length);
    phrase = officialGreets[phraseIndex];
  }else {
    let phraseIndex = Math.floor(Math.random() * unOfficialGreets.length);
    phrase = unOfficialGreets[phraseIndex];
  }
  phrase += `, в этой игре ${(appeal === 'official' ? 'вам' : 'тебе')} нужно перемещать клетки, чтобы набрать число` +
      ' две тысячи сорок восемь'
  rsp.msg = phrase;
  rsp.data = {type: 'init'};
  yield rsp;

  while (true) {
    if (r.type === 'SERVER_ACTION' && r.act?.action_id === 'help') {
      rsp.msg = 'Две тысячи сорок восемь - это головоломка, в которой нужно соединять одинаковые числа,' +
          ' перемещая их влево, вправо, вверх или вниз.' +
          ' После каждого хода на поле в случайном месте появляется либо двойка, либо четверка.' +
          ' Чтобы выиграть нужно, чтобы одно из чисел стало равным двум тысячам сорока восьми';
      rsp.data = {type: 'help'}
    } else if (r.type === 'MESSAGE_TO_SKILL'){
	  let texts = r.nlu.texts;
      let command = textToCommand(texts);
      if (command.type === 'dir'){
        let { dir } = command;
        let phraseIndex = Math.floor(Math.random() * movePhrases.length);
        rsp.msg = movePhrases[phraseIndex] + ' ' + dir;
        rsp.data = {type: 'direction', dir: dir};
      }else if (command.type === 'fail') {
        if (gender == 'male') {
          let phraseIndex = Math.floor(Math.random() * maleFailPhrases.length);
          phrase = maleFailPhrases[phraseIndex];
        }else{
          let phraseIndex = Math.floor(Math.random() * femaleFailPhrases.length);
          phrase = femaleFailPhrases[phraseIndex];
        }
        rsp.msg = phrase;
        rsp.data = command;
      }else if (command.type === 'help') {
        rsp.msg = 'Две тысячи сорок восемь - это головоломка, в которой нужно соединять одинаковые числа,' +
            ' перемещая их влево, вправо, вверх или вниз.' +
            ' После каждого хода на поле в случайном месте появляется либо двойка, либо четверка.' +
            ' Чтобы выиграть нужно, чтобы одно из чисел стало равным двум тысячам сорока восьми';
        rsp.data = command;
      }else if (command.type === 'greet') {
        if (appeal === 'official') {
          let phraseIndex = Math.floor(Math.random() * officialGreets.length);
          phrase = officialGreets[phraseIndex];
        }else {
          let phraseIndex = Math.floor(Math.random() * unOfficialGreets.length);
          phrase = unOfficialGreets[phraseIndex];
        }
        rsp.msg = phrase;
        rsp.data = command;
      }else if (command.type === 'restart'){
        rsp.msg = '';
        rsp.data = command;
      }else if (command.type === 'close'){
        rsp.msg = '';
        rsp.data = command;
      }
    }else{
      rsp.msg = '';
      rsp.data = {};
    }
    yield rsp;
  }
}

Dialute
  .fromEntrypoint(script as GeneratorFunction)
  .start();
