'use strict'

import { Record, List } from 'immutable';
import User from './userRecord';

const Article = new Record({
  id:null,
  txt: null,
  tags: new List(),
  user:new User()
});

export default Article;
