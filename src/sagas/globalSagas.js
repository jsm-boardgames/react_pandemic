import { takeEvery, END } from 'redux-saga';
import { put, select, call } from 'redux-saga/effects';
import { browserHistory } from 'react-router';
import { sampleSize, shuffle } from 'lodash';

import * as types from '../constants/actionTypes';
import ROLES from '../constants/roles';
import NAMES from '../constants/names';
import { PLAYER_DECK, INFECTION_DECK } from '../constants/decks';
import { createGame, dealCards, insertPlayerCard, startGame, defeat, victory } from '../actions/globalActions';
import { useDiseaseCubes, infectCity } from '../actions/diseaseActions';
import { discardTopInfectionCard } from '../actions/cardActions';
import * as sel from '../selectors';


export function* createQuickGame(action) {
  const { numberOfPlayers } = action;
  const availableRoles = Object.keys(ROLES);
  const rolesPicked = sampleSize(availableRoles, numberOfPlayers);
  const namesPicked = sampleSize(NAMES, numberOfPlayers);
  const players = [];
  for (let i = 0; i < numberOfPlayers; i++) {
    players.push({
      name: namesPicked[i],
      role: rolesPicked[i]
    });
  }

  const playerDeck = shuffle(PLAYER_DECK);
  const infectionDeck = shuffle(INFECTION_DECK);
  yield put(createGame(players, playerDeck, infectionDeck));

  browserHistory.push('/');
}

export function* dealCardsToPlayers() {
  const cardCountMap = {
    1: 5,
    2: 4,
    3: 3,
    4: 2,
    5: 1
  };

  const players = yield select(sel.getPlayers);
  const cardsToDeal = cardCountMap[players.length];
  for (let i = 0; i < players.length; i++) {
    const deck = yield select(sel.getPlayerDeck);
    const cards = sampleSize(deck, cardsToDeal);
    yield put(dealCards(players[i].id, cards));
  }

  const playerDeck = yield select(sel.getPlayerDeck);
  const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min)) + min; // max is not included
  const deckLength = playerDeck.length;

  const difficulty = 5;
  for (let i = 0; i < difficulty; i++) {
    const epidemicIndex = getRandomInt(Math.floor(i / difficulty * deckLength),
      Math.floor((i + 1) / difficulty * deckLength));
    yield put(insertPlayerCard(epidemicIndex, { cardType: 'epidemic', id: 'epidemic' }));
  }

  for (let i = 3; i > 0; i--) {
    for (let j = 0; j < 3; j++) {
      const topInfectionCard = yield select(sel.peekAtInfectionDeck);
      const color = yield select(sel.getCityColor, topInfectionCard);
      yield put(useDiseaseCubes(color, i));
      yield put(infectCity(topInfectionCard, color, i));
      yield put(discardTopInfectionCard());
    }
  }
  yield put(startGame());
}

export function* checkForVictory() {
  const allCured = yield select(sel.areAllDiseasesCured);

  if (allCured) {
    yield call(yieldVictory);
  }
}

export function* checkForInfectionRateDefeat() {
  if (yield select(sel.isInfectionRateOutOfBounds)) {
    yield call(yieldDefeat);
  }
}

export function* checkForOutbreaksDefeat() {
  if (yield select(sel.isOutbreaksCountOutOfBounds)) {
    yield call(yieldDefeat);
  }
}

export function* yieldDefeat() {
  yield put(defeat());
  yield put(END);
}

export function* yieldVictory() {
  yield put(victory());
  yield put(END);
}

export function* watchVictory() {
  yield* takeEvery(types.PLAYER_CURE_DISEASE_COMPLETE, checkForVictory);
}

export function* watchInfectionRateDefeat() {
  yield* takeEvery(types.EPIDEMIC_INCREASE, checkForInfectionRateDefeat);
}

export function* watchOutbreaksDefeat() {
  yield* takeEvery(types.OUTBREAK_INIT, checkForOutbreaksDefeat);
}

export function* watchCreateQuickGame() {
  yield* takeEvery(types.CREATE_QUICK_GAME_INIT, createQuickGame);
}

export function* watchDealCards() {
  yield* takeEvery(types.DEAL_CARDS_INIT, dealCardsToPlayers);
}
