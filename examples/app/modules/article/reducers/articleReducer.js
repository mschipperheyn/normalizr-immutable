import * as types from '../articleActionTypes';
import Immutable, { Map, List } from 'immutable';

const initialState = {
    entities        : null,
    result          : new List()
};

export default function articleReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_ARTICLES:
      return state.merge(action.payload);
    default:
      return state;
  }
}
