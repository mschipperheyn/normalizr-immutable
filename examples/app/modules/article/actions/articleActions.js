import * as types from './../articleActionTypes';

import { articleSchema } from '../schemas/articleSchema';
import { normalize, arrayOf } from 'normalizr-immutable';

export function processArticles(payload) {
  return {
    type: types.LOAD_ARTICLES,
    payload
  };
}

export function loadArticles(){

  return ( dispatch, getState) => {

    return fetch('../__tests__/mocks/articles.json',{
      method:'GET'
    })
    .then(response => response.json())
    .then(json => {

      const normalized = normalize(json.articles.items, arrayOf(articleSchema),{
        getState,
        reducerKey:'articleReducer'
      });

      dispatch(processArticles(normalized));
    })
    .catch(err => {
      console.log(err);
    });
  }
}
