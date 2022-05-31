<script lang="ts">
  import { onMount } from 'svelte';
  import {
    createSmartappDebugger, createAssistant
  } from '@sberdevices/assistant-client';
  import { setTheme } from './themes';
  import { logger } from "./utils";
  import { fade } from 'svelte/transition';

  import Help from './Help.svelte';
  let helpIsAsked = false;
  let gameIsOver = false;
  let gameIsWon = false;
  let gameWasWon = false;
  let assistant;
  
  let token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZjAwMTM4ZmI0M2JiOTI0MGM5ZDQ2ZDViZDQ3ZDdkM2YxYmQ3NWFjYTRiOTk5OWU4ZGE1YjExN2Y4ZmJkNzYyOTQzMjQiLCJhdWQiOiJWUFMiLCJleHAiOjE2NTQwODY4NzksImlhdCI6MTY1NDAwMDQ2OSwiaXNzIjoiS0VZTUFTVEVSIiwidHlwZSI6IkJlYXJlciIsImp0aSI6ImFiMjg0YmY2LTBlZGItNDRjMC04ZWJjLTg1MzI1MGMxZWE3ZSIsInNpZCI6ImZjNTY3Y2IxLWI1ZjgtNGQ1NC04MjM5LTc0NTc2YjFiZDgyNyJ9.J5IihjXkWHzp7gWx8SLm52o77ivII6HsvwnEDSR8_su_GG82Nd6yxRrgSKIVqiTR-vrM9TLHO5q85Xxdp-x-XdZgyaYA1ZQjP1CB7uLz2pnfvNTgkCg24n41aerpXmOUFiHvEfREC5hfi-SNiL-ejJCe1RYR0MKihSdGu3TFJ6SNtRmXoKdPIeyFqeqXZbKOlEGkH_-2uFn32CbJBmgHkz2GWvCJ4slnA-GINLlTBES7d2eja31-zWL7_IUrAg3hrQxUx7Y4xSUNUjLGEaAflTzEJuUpmX6HAiiG9ebxco_J9Zpzsgs1ubGSypn-fn_LsNlSp3bq2iLHa1sbaN0f32EVMjelAtwGH7CYw6sfLQZAFFIBXKn-LZTTK9JL5U5RudKxCQnr-569Y3vXcKcWLn7hnAIk8cmunPPwUxT9WWehU4lXEg6q0th9KKUUNPMjLxixqzyWeI8UOoNan6rW-__rbDYu_biFfuIgX4bUnxngZrCYVtXTzE8eHex-3CVwlJfQoThSI9C6BQooxqm-SNfRlzlYFB4sQWvHajogJkjMefMMu_kyfBCmbfwWffnJ7zebRGkpu_6K4Euf1nYPfAqmjYjrQmo6QOMmfWqbB5w0QnJeGqyzOBu7__WDwlZpz7vD7M5jSLl_TxtIs3wgdBPhxDYS9xgJmyS0GYVkuN8";

  // Set the name of your SmartApp for activation
  let initPhrase = 'запусти 2048';
  let character = 'eva'; // default, before sber client gets state
  $: setTheme(character);
  let xTouchCoordinate, yTouchCoordinate;

  onMount(() => {
    function getState() {
      return {}
    }

    const init = () => {
      if (process.env.NODE_ENV === 'production') {
        return createAssistant({getState});
      }
      return createSmartappDebugger({
        token,
        initPhrase,
        getState
      });
    };
    assistant = init();

    assistant.on('start', () => {
      logger.log('SmartApp started');
    });

    assistant.on('data', event => {
      // Set your action or data hooks
      if (!event.type) {
        // Use invariants to prevent errors on Sber Portal
        return;
      }
      // FIXME Add event handler for closing the app and use "assistant.close()" inside it;

      if (event.type === 'character') {
        character = event.character.id;
      }

      if (event.type === 'smart_app_data') {
        if (event.smart_app_data.type === 'direction') {
          let dir = event.smart_app_data.dir;
          makeMove(dir);
        }else if (event.smart_app_data.type === 'help') {
          helpIsAsked = true;
        }else if (event.smart_app_data.type === 'restart') {
          reset();
        }
      }

      if (event.type === 'navigation') {
        let word = event.navigation.command;
        let dir = wordToDir(word);
        makeMove(dir);
      }
    });
  });

  let game = {
    score: 0,
    best: 0,
  };

  let numbers = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  const reset = () => {
    if (gameWasWon) gameIsWon = gameWasWon = false;
    if (gameIsOver) gameIsOver = false;
    numbers = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    game.best = Math.max(game.best, game.score);
    game.score = 0;
    add_number_to_random_place();
    add_number_to_random_place();
  };

  const add_number_to_random_place = () => {
    let zeroPos = [];
    for (let i = 0; i < 4; ++i){
      for (let j = 0; j < 4; ++j){
        if (numbers[i][j] == 0) zeroPos.push([i, j]);
      }
    }

    if (zeroPos.length === 0) return;
    let rand = Math.floor(Math.random() * Math.floor(zeroPos.length));
    let ind_pair = zeroPos[rand];
    let x = ind_pair[0], y = ind_pair[1];

    numbers[x][y] = (Math.random() > 0.5 ? 2 : 4);
	// let dxdy = [[0, 1], [1, 0], [0, -1], [-1, 0]];
	// for (let i = 0; i < 4; ++i){
	// 	let dx = dxdy[i][0], dy = dxdy[i][1];
	// 	let new_x = x + dx, new_y = y + dy;
	// 	if (new_x >= 0 && new_x < 4 && new_y >= 0 && new_y < 4 && numbers[new_x][new_y] !== 0) {
	// 		numbers[x][y] = numbers[new_x][new_y];
	// 		return;
	// 	}
	// }
    // numbers[x][y] = 2;
  };

  add_number_to_random_place();
  add_number_to_random_place();

  const checkGameIsOver = (arr) => {
    let dxdy = [[-1, 0], [1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < 4; ++i){
      for (let j = 0; j < 4; ++j){
        if (arr[i][j] === 0) return false;
        for (let k = 0; k < 4; ++k){
          let dx, dy;
          [dx, dy] = dxdy[k];
          let i_next = i + dx, j_next = j + dy
          if (i_next >= 0 && i_next < 4 && j_next >= 0 && j_next < 4 && arr[i_next][j_next] === arr[i][j]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const makeArrayCopy = (arr) => {
    let arrCopy = [];
    for (let i of arr) arrCopy.push(i);
    return arrCopy;
  }

  const makeMatrixCopy = (matr) => {
    let matrCopy = [];
    for (let i = 0; i < matr.length; ++i){
      matrCopy.push([]);
      for (let j of matr[i]){
        matrCopy[i].push(j);
      }
    }
    return matrCopy
  };

  const slideArray = (arr) => {
    let score_diff = 0;
    let arr_copy = makeArrayCopy(arr);
    let no_zeroes_array = arr_copy.filter(el => el !== 0);
    for (let i = 0; i < no_zeroes_array.length - 1; ++i){
      if (no_zeroes_array[i] === no_zeroes_array[i + 1]){
        no_zeroes_array[i] *= 2;
        if (no_zeroes_array[i] === 2048 && !gameWasWon) gameIsWon = gameWasWon = true;
        no_zeroes_array[i + 1] = 0;
        score_diff += no_zeroes_array[i];
      }
    }
    while (no_zeroes_array.length < 4) no_zeroes_array.push(0);
    return [no_zeroes_array, score_diff];
  }

  const moveUp = () => {
    let new_score = 0;
    let number_copy = makeMatrixCopy(numbers);
    for (let c = 0; c < 4; ++c){
      let arr = [], score_diff;
      for (let r = 0; r < 4; ++r) arr.push(number_copy[r][c]);
      [arr, score_diff] = slideArray(arr);
      new_score += score_diff;
      for (let r = 0; r < 4; ++r) number_copy[r][c] = arr[r];
    }
    return [number_copy, new_score];
  };

  const moveDown = () => {
    let new_score = 0;
    let number_copy = makeMatrixCopy(numbers);
    for (let c = 0; c < 4; ++c){
      let arr = [], score_diff;
      for (let r = 0; r < 4; ++r) arr.push(number_copy[3 - r][c]);
      [arr, score_diff] = slideArray(arr);
      new_score += score_diff;
      for (let r = 0; r < 4; ++r) number_copy[3 - r][c] = arr[r];
    }
    return [number_copy, new_score];
  };

  const moveRight = () => {
    let new_score = 0;
    let number_copy = makeMatrixCopy(numbers);
    for (let r = 0; r < 4; ++r){
      let arr = [], score_diff;
      for (let c = 0; c < 4; ++c) arr.push(number_copy[r][3 - c]);
      [arr, score_diff] = slideArray(arr);
      new_score += score_diff;
      for (let c = 0; c < 4; ++c) number_copy[r][3 - c] = arr[c];
    }
    return [number_copy, new_score];
  };

  const moveLeft = () => {
    let new_score = 0;
    let number_copy = makeMatrixCopy(numbers);
    for (let r = 0; r < 4; ++r){
      let arr = [], score_diff;
      for (let c = 0; c < 4; ++c) arr.push(number_copy[r][c]);
      [arr, score_diff] = slideArray(arr);
      new_score += score_diff;
      for (let c = 0; c < 4; ++c) number_copy[r][c] = arr[c];
    }
    return [number_copy, new_score];
  };

  const makeMove = (dir) => {
    let number_copy, new_score;
    if (dir === 'влево'){
      [number_copy, new_score] = moveLeft();
    }else if (dir === 'вправо'){
      [number_copy, new_score] = moveRight();
    }else if (dir === 'вверх'){
      [number_copy, new_score] = moveUp();
    }else if (dir === 'вниз'){
      [number_copy, new_score] = moveDown();
    }
    if (JSON.stringify(number_copy) !== JSON.stringify(numbers)) {
      game.score += new_score;
      numbers = number_copy;
      add_number_to_random_place();
    }
    if (checkGameIsOver(numbers)) {
      gameIsOver = true;
      game.best = Math.max(game.best, game.score);
    }
  };

  const keyPress = (e) => {
    let dir, keyCode = e.keyCode;
    if (keyCode < 37 || keyCode > 40) {
      return;
    }else if (keyCode === 37){
      dir = 'влево';
    }else if (keyCode === 38){
      dir = 'вверх';
    }else if (keyCode === 39){
      dir = 'вправо';
    }else if (keyCode === 40){
      dir = 'вниз';
    }
    makeMove(dir);
  };

  const wordToDir = (word) => {
    if (word === 'влево' || word === 'LEFT') return 'влево';
    else if (word === 'вправо' || word === 'RIGHT') return 'вправо';
    else if (word === 'вверх' || word === 'UP') return 'вверх';
    else if (word === 'вниз' || word === 'DOWN') return 'вниз';
  };

  const handleTouchStart = (event) => {
    xTouchCoordinate = event.changedTouches[0].clientX;
    yTouchCoordinate = event.changedTouches[0].clientY;
  };

  const handleTouchEnd = (event) => {
    let xTouchDiff = event.changedTouches[0].clientX - xTouchCoordinate;
    let yTouchDiff = event.changedTouches[0].clientY - yTouchCoordinate;
    if (Math.abs(xTouchDiff) + Math.abs(yTouchDiff) < 40) return;
    if (Math.abs(xTouchDiff) > Math.abs(yTouchDiff)){
      if (xTouchDiff > 0) makeMove('вправо');
      else makeMove('влево');
    }else{
      if (yTouchDiff > 0) makeMove('вниз');
      else makeMove('вверх');
    }
  };
</script>

<style>
  html,
  body {
    margin: 0;
    padding: 0;
    background: #faf8ef;
    color: #776e65;
    font-family: clear sans, helvetica neue, Arial, sans-serif;
    font-size: 18px
  }

  body {
    margin: 80px 0;
  }

  .container {
    width: 500px;
    margin: 0 auto;
  }

  .game-container {
    margin-left: 8px;
    position: relative;
    padding: 15px 0px 15px 15px;
    cursor: default;
    touch-action: none;
    background: #f4f4f49e;
    border-radius: 6px;
    width: 485px;
    height: 500px;
    box-sizing: border-box
  }

  .game-container .game-message {
    display: none;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(238, 228, 218, .5);
    z-index: 100;
    text-align: center;
  }

  .game-container .game-message p {
    font-size: 60px;
    font-weight: 700;
    height: 70px;
    line-height: 60px;
    margin-top: 200px
  }

  .game-container .game-message .lower {
    display: block;
    margin-top: 67px;
  }

  .game-container .game-message a {
    display: inline-block;
    background: #8f7a66;
    border-radius: 3px;
    padding: 0 20px;
    text-decoration: none;
    color: #f9f6f2;
    height: 40px;
    line-height: 42px;
    margin-left: 9px;
    cursor: pointer;
  }

  .game-container .game-message a.keep-playing-button {
    display: none
  }

  .game-container .game-message.game-won {
    background: rgba(30, 158, 55, .4);
    color: #f9f6f2
  }

  .game-container .game-message.game-won a.keep-playing-button {
    margin-left: -20px;
    display: inline-block;
    background: #416849;
  }


  .game-container .game-message.game-over a.retry-button {
    display: inline-block;
    background: #416849;
  }

  .game-container .game-message.game-won,
  .game-container .game-message.game-over {
    display: block
  }

  .grid-container {
    z-index: 1;
  }

  .grid-row {
    margin-bottom: 15px;
  }

  .grid-row:last-child {
    margin-bottom: 0;
  }

  .grid-row:after {
    content: "";
    display: block;
    clear: both
  }

  .tile {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    width: 102px;
    height: 102px;
    margin-right: 15px;
    float: left;
    border-radius: 3px;
    background-color: rgba(238, 228, 218, 0.35);
    display: grid;
    place-items: center;
    font-weight: bold;
    font-size: 25px;
  }

  .two {
    background-color: #777777;
    font-size: 45px;
  }
  .four {
    background-color: #595756;
    font-size: 45px;
  }
  .eight {
    background-color: #d4d700;
    font-size: 45px;
  }
  .sixteen {
    background-color: #80b918;
    font-size: 45px;
  }
  .thirtytwo {
    background-color: #2b863f;
    font-size: 45px;
  }
  .sixtyfour {
    background-color: #1d915f;
    font-size: 45px;
  }
  .onetwoeight {
    background-color: #1ed1af;
    font-size: 45px;
  }
  .twofivesix {
    background-color: #049a8f;
    font-size: 45px;
  }
  .fiveonetwo {
    background-color: #f77f00;
    font-size: 45px;
  }
  .onezerotwofour {
    background-color: #de121d;
    font-size: 35px;
  }
  .twozerofoureight {
    background-color: #e7e247;
    font-size: 35px;
  }
  .more {
    background-color: #ede62f;
    font-size: 35px;
  }

  .heading:after {
    content: "";
    display: block;
    clear: both;
  }

  .heading {
    padding: 0 8px 0 8px;
  }

  .game-intro {
    padding: 0 8px 0 8px;
  }

  .game-intro a {
    cursor: pointer
  }

  .heading .title {
    font-size: 80px;
    font-weight: 700;
    margin: 0;
    display: block;
    float: left;
  }

  .heading .title a {
    text-decoration: none;
  }

  .scores-container {
    float: right;
    text-align: right;
  }

  .score-container,.best-container {
    position: relative;
    display: inline-block;
    background: #f4f4f49e;
    padding: 15px 25px;
    font-size: 25px;
    height: 25px;
    line-height: 47px;
    font-weight: 700;
    border-radius: 3px;
    color: #fff;
    margin-top: 8px;
    text-align: center;
  }

  .score-container:after,.best-container:after {
    position: absolute;
    width: 100%;
    top: 10px;
    left: 0;
    text-transform: uppercase;
    font-size: 13px;
    line-height: 13px;
    text-align: center;
    color: #eee4da;
  }

  .score-container .score-addition,.best-container .score-addition {
    position: absolute;
    right: 30px;
    color: red;
    font-size: 25px;
    line-height: 25px;
    font-weight: 700;
    color: rgba(119,110,101,.9);
    z-index: 100;
  }

  .score-container:after {
    content: "Score";
  }

  .best-container:after {
    content: "Best";
  }

  @media screen and (max-width:520px) {
    html,
    body {
      font-size: 15px
    }

    body {
      margin: 20px 0;
      padding: 0 20px
    }

    .container {
      width: 280px;
      margin: 0 auto
    }

    .game-container {
      margin-left: 6px;
      /*margin-top: 17px;*/
      position: relative;
      padding: 10px 0 10px 10px;
      cursor: default;
      touch-action: none;
      background: #f4f4f49e;
      border-radius: 6px;
      width: 278px;
      height: 280px;
      box-sizing: border-box
    }

    .game-container .game-message {
      display: none;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: rgba(238, 228, 218, .5);
      z-index: 100;
      text-align: center;
    }

    .game-container .game-message p {
      font-size: 30px;
      font-weight: 700;
      height: 20px;
      line-height: 60px;
      margin-top: 100px
    }

    .game-container .game-message .lower {
      display: block;
      margin-top: 60px
    }

    .game-container .game-message a {
      display: inline-block;
      background: #8f7a66;
      border-radius: 17px;
      padding: 0 20px;
      text-decoration: none;
      color: #f9f6f2;
      height: 40px;
      line-height: 42px;
      margin-left: 0px;
      font-size: 15px;
    }

    .game-container .game-message a.keep-playing-button {
      display: none
    }

    .game-container .game-message.game-won {
      background: rgba(30, 158, 55, .4);
      color: #f9f6f2
    }

    .game-container .game-message.game-won a.keep-playing-button {
      display: inline-block;
      background: #416849;
    }

    .game-container .game-message.game-over a.retry-button {
      display: inline-block;
      background: #416849;
    }

    .game-container .game-message.game-won,
    .game-container .game-message.game-over {
      display: block
    }

    .grid-container {
      position: absolute;
      z-index: 1
    }

    .grid-row {
      margin-bottom: 10px
    }

    .grid-row:last-child {
      margin-bottom: 0
    }

    .grid-row:after {
      content: "";
      display: block;
      clear: both
    }

    .tile {
      width: 55px;
      height: 55px;
      margin-right: 12px;
      float: left;
      border-radius: 3px;
      background-color: rgba(238, 228, 218, .35);
    }

    .two {
      background-color: #777777;
      font-size: 25px;
    }
    .four {
      background-color: #595756;
      font-size: 25px;
    }
    .eight {
      background-color: #d4d700;
      font-size: 25px;
    }
    .sixteen {
      background-color: #80b918;
      font-size: 25px;
    }
    .thirtytwo {
      background-color: #2b863f;
      font-size: 25px;
    }
    .sixtyfour {
      background-color: #1d915f;
      font-size: 25px;
    }
    .onetwoeight {
      background-color: #1ed1af;
      font-size: 25px;
    }
    .twofivesix {
      background-color: #049a8f;
      font-size: 25px;
    }
    .fiveonetwo {
      background-color: #f77f00;
      font-size: 25px;
    }
    .onezerotwofour {
      background-color: #f77f00;
      font-size: 15px;
    }
    .twozerofoureight {
      background-color: #e7e247;
      font-size: 15px;
    }
    .more {
      background-color: #ede62f;
      font-size: 15px;
    }

    .heading {
      margin-bottom: 10px;
      padding: 0 6px 0 6px;
    }

    .game-intro {
      padding: 0 6px 0 6px;
      margin-bottom: 10px;
    }

    h1.title {
      font-size: 27px;
      margin-top: 15px;
    }

    .title {
      float: none;
    }

    .heading .title {
      float: left;
    }

    .right {
      float: right;
    }

    .left {
      float: left;
    }

    .clearfix {
      clear: both;
    }

    .play-now {
      margin-top: 22px;
    }

    .play-now a {
      border-radius: 6px;
      padding: 12px;
      text-decoration: none;
      background-color: #bbada0;
      color: #fff;
    }

    .game-intro {
      font-size: 17px;
      margin-bottom: 10px;
    }

    .game-intro a {
      margin-right: 10px;
    }

    .play-now a:hover {
      text-decoration: underline;
    }
  }

</style>

<svelte:window
  on:keydown={keyPress}
  on:touchstart={(event) => handleTouchStart(event)}
  on:touchend={(event) => handleTouchEnd(event)}
/>

<div class="container">
  <div class="heading">
    <h1 class="title"><a href='/'>2048</a></h1>
    <div class="scores-container">
      <div class="score-container">{game.score}</div>
      <div class="best-container">{game.best}</div>
    </div>
  </div>
  <div class="game-intro">
    <a class="restart-button" on:click={reset}>Заново</a>
    <a on:click={() => helpIsAsked = true}>Помощь</a>
  </div>
  <div class="game-container">
    <div class="game-messages">
    {#if gameIsOver}
      <div class="game-message game-over" in:fade on:close="{() => gameIsOver = false}" >
        <p>Вы проиграли.</p>
        <div class="lower">
          <a class="retry-button" on:click={() => reset()}>Попробовать снова</a>
        </div>
      </div>
    {/if}
    {#if gameIsWon}
      <div class="game-message game-won" in:fade>
        <p>Вы выиграли!</p>
        <div class="lower">
          <a class="keep-playing-button" on:click="{() => gameIsWon = false}">Продолжить</a>
        </div>
      </div>
    {/if}
    {#if helpIsAsked}
      <Help on:close="{() => helpIsAsked = false}">
        <h2 slot="header">
          2048 Правила игры
        </h2>
        <div slot="rules" style="color:black">
          2048 - головоломка, в которой нужно соединять одинаковые числа,
          перемещая их влево, вправо, вверх или вниз.
          После каждого хода на поле в случайном месте появляется либо 2 либо 4.
          Чтобы выиграть нужно, чтобы одно из чисел стало равным 2048.
        </div>
      </Help>
    {/if}
    </div>
    <div class="grid-container">
      {#each numbers as arr, i}
        <div class="grid-row">
          {#each arr as num, i}
            <div
              class="tile {num === 2 ? 'two' : num === 4 ? 'four' : num === 8 ? 'eight' : num === 16 ? 'sixteen' :
              num === 32 ? 'thirtytwo' : num === 64 ? 'sixtyfour' : num === 128 ? 'onetwoeight' :
              num === 256 ? 'twofivesix' : num === 512 ? 'fiveonetwo' : num === 1024 ? 'onezerotwofour' :
              num === 2048 ? 'twozerofoureight' : num > 2048 ? 'more' : ''}">
              {num !== 0 ? num : ''}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>
