'use strict';

import { Schema, arrayOf } from 'normalizr-immutable';

import Article from './articleRecord';
import User from './userRecord';
import Tag from './tagRecord';

const schemas = {
  article   : new Schema('articles', { idAttribute: 'id', record: Post }),
  user      : new Schema('users', { idAttribute: 'id', record: User  }),
  tag       : new Schema('tags', { idAttribute: 'id', record: Tag  }),
};

schemas.article.define({
  user: schemas.user,
  tags: arrayOf(schemas.tag)
});

const articleSchema = schemas.article;

export {
  articleSchema
};
