import initialState from './initialState';
import * as actionTypes from '../constants/actionTypes';

export default function mapReducer(state = initialState.map, action) {
  switch (action.type) {
    case actionTypes.PLAYER_MOVE_TO_CITY:
      return {
        ...state,
        playersLocations: {
          ...state.players,
          [action.playerId]: action.destinationId
        }
      };
    default:
      return state;
  }
}
