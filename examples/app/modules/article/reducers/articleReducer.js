import * as types from '../articleActionTypes';
import Immutable, { fromJS, Map, List } from 'immutable';
import { NormalizedRecord } from 'normalizr-immutable';

const initialState = new NormalizedRecord({});

export default function articleReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_ARTICLES:
      return state.merge(action.payload);
    default:
      return state;
  }
}
