'use strict';

import { Schema, arrayOf } from 'normalizr-immutable';

import Article from './articleRecord';
import User from './userRecord';
import Tag from './tagRecord';

const schemas = {
  article   : new Schema('articles', Article, { reducerKey:'articleReducer' }),
  user      : new Schema('users', User, { reducerKey:'articleReducer' }),
  tag       : new Schema('tags', Tag, { reducerKey:'articleReducer' }),
};

schemas.article.define({
  user: schemas.user,
  tags: arrayOf(schemas.tag)
});

const articleSchema = schemas.article;

export {
  articleSchema
};
