'use strict';
import { fromJS } from 'immutable';
import { assert as assert0, expect as expect0, should as should0 } from 'chai';

import iChaiImmutable from 'chai';
import chaiImmutable from 'chai-immutable';

iChaiImmutable.use(chaiImmutable)

const { assert, expect, should } = iChaiImmutable;

import loggerMiddleware from 'redux-logger';

import { createStore, combineReducers, applyMiddleware } from 'redux';

import json from './mocks/articles.json';
import jsonUpdate from './mocks/articles_update.json';
import { normalize, Schema, arrayOf, NormalizedRecord } from '../src/NormalizrImmutable';
import { normalize as normalize0/*, Schema as Schema0*/, arrayOf as arrayOf0 } from 'normalizr';

import { Record, List, Map } from 'immutable';

const Tag = new Record({
  id:null,
  label: null
});

const User = new Record({
  id:null,
  nickName: null,
});

const Article = new Record({
  //base comment
  id:null,
  txt:null,
  user:new User(),
  tags:new List()
});

const schemas = {
  article : new Schema('articles', { idAttribute: 'id', record: Article }),
  user : new Schema('users', { idAttribute: 'id', record: User  }),
  tag : new Schema('tags', { idAttribute: 'id', record: Tag  })
};

schemas.article.define({
  user: schemas.user,
  tags: arrayOf(schemas.tag)
});

const initialState = new NormalizedRecord();

function myReducer(state = initialState, action) {
  return state.merge(action.payload);
};

const store = createStore(combineReducers({
  myReducer
}),{},applyMiddleware(
  // loggerMiddleware()
));

const reducerKey = 'myReducer';

describe("test normalizr", () => {
    it("should work against the default normalizr", () => {

      const schemas0 = {
        article : new Schema('articles', { idAttribute: 'id', record: Article }),
        user : new Schema('users', { idAttribute: 'id', record: User  }),
        tag : new Schema('tags', { idAttribute: 'id', record: Tag  })
      };

      schemas0.article.define({
        user: schemas.user,
        tags: arrayOf0(schemas.tag)
      });

      const normalized = normalize0(json.articles.items, arrayOf0(schemas0.article),{});

      expect0(normalized.entities).to.have.property('users');
    });

    it("should work against the immutable normalizr", () => {

      const normalized = normalize(json.articles.items, arrayOf(schemas.article),{});

      expect(normalized).to.have.property('entities');
      expect(normalized).to.have.property('result');
      expect(normalized.result).to.have.size(3);
      expect(normalized.entities).to.have.property('users');
      expect(normalized.entities.users).to.have.property(193);
      expect(normalized.entities).to.have.property('articles');
      expect(normalized.entities.articles).to.have.property(49441);
      expect(normalized.entities.articles[49441]).to.have.property('user');
      expect(normalized.entities.articles[49441].user).to.equal(193);
    });

    it("should allow a proxy function to lazy load the reference", () => {

      const normalized = normalize(json.articles.items, arrayOf(schemas.article),{
        getState:store.getState,
        reducerKey
      });

      store.dispatch({
        type:'any',
        payload:normalized
      })

      expect(normalized.entities.articles[49443].user.id).to.equal(192);
      expect(normalized.entities.articles.get(49443).user.get('id')).to.equals(192);
      expect(normalized.entities.articles.get(49443).user.nickName).to.equal('Marc');

    });

    it("show dynamic state changes after the reference has passed and not just a passed static state", () => {

      let normalized = normalize(json.articles.items, arrayOf(schemas.article),{
        getState:store.getState,
        reducerKey
      });

      store.dispatch({
        type:'any',
        payload:normalized
      });

      normalized = normalize(jsonUpdate.articles.items, arrayOf(schemas.article),{
        getState:store.getState,
        reducerKey
      });

      expect(normalized.entities.articles[49444].user.id).to.equal(193);
    });

    it("show updated content leads to updated / merged state", () => {

    });

    it("show processing of iterables", () => {

      const normalized = normalize(json.articles.items, arrayOf(schemas.article),{
        getState:store.getState,
        reducerKey
      });

      store.dispatch({
        type:'any',
        payload:normalized
      })

      expect(normalized.entities.articles[49443].tags).to.have.size(2);
      expect(normalized.entities.articles.get(49443).tags.get(0).label).to.equal("React");
    });

    it("show processing of unions", () => {

    });
});
