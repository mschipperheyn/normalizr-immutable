import * as types from '../articleActionTypes';
import { NormalizedRecord } from 'normalizr-immutable';

//NormalizedRecord is simply a convenience object that is the base record that we use to return the normalized structure.
const initialState = new NormalizedRecord({});

export default function articleReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LOAD_ARTICLES:
      return state.merge(action.payload);
    default:
      return state;
  }
}
