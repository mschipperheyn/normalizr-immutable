import { Schema } from 'normalizr';
import { Record } from 'immutable';

export default class RecordEntitySchema extends Schema{
  constructor(key, record, options = {}) {
    super(key, options);
    if (!key || typeof key !== 'string') {
      throw new Error('A string non-empty key is required');
    }

    if(!record || typeof record !== 'function')
      throw new Error('A record is required');

    this._key = key;
    this._record = record;

    const idAttribute = options.idAttribute || 'id';
    this._getId = typeof idAttribute === 'function' ? idAttribute : x => x[idAttribute];
    this._idAttribute = idAttribute;
    this._reducerKey = options.reducerKey;
  }

  getRecord() {
    return this._record;
  }

  getReducerKey() {
    return this._reducerKey;
  }

  toString(){
    return `EntitySchema, key: ${this._key}, idAttribute: ${this._idAttribute}, reducerKey: ${this._reducerKey}`;
  }
}
