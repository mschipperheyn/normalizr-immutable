Normalizr-Immutable is an opiniated immutable version of Dan Abramov's [Normalizr](https://github.com/gaearon/normalizr) using Facebook's [Immutable](https://facebook.github.io/immutable-js).
We recommend reading the documentation for Normalizr and Immutable first, to get a basic idea of the intent of these concepts.

### Installation
```
npm install --save normalizr-immutable
```

### Changes to API version 0.0.3!
Based on user feedback I decided to make some changes to the API:
* `reducerKey` is now an attribute for Schema. This makes it possible to reference entities that are stored in other reducers.

It does mean that if you receive different levels of detail for a single type of entity across REST endpoints, or you want to maintain the original functionality of referencing entities within one reducer, you may need to maintain different Schema definitions for that entity.

If you do want to maintain entities across reducers, you have to be careful not to reference a reducer through the Proxy that has not been hydrated yet.
* The Record object is now part of the method signature for Schema. Since it's not optional, it shouldn't be an option.
* added a new option `useMapsForEntityObjects` to the `options` object, which defaults to `false`. When `useMapsForEntityObjects` is set to `true`, it will use a Map for the entity objects (e.g. articles). When set to `false`, it will use a Record for this. See the API description for more info.

`normalize(json.articles.items, arrayOf(schemas.article),{getState: store.getState,useMapsForEntityObjects: true});`

### What does Normalizr-Immutable do?
It normalizes a deeply nested json structure according to a schema for Redux apps and makes the resulting object immutable.
It does this in a way that preserves the ability to reference objects using traditional javascript object notation.
So, after normalizing an object, you can still reference the tree in the normalized object like a traditional javascript object:

Before normalization
```json
"article": {
  "id": 1,
  "txt": "Bla",
  "user":{
    "id":15,
    "name":"Marc"
  }
}
```

After normalization
```javascript
const normalized = {
  entities:{//Record
    articles: {//Record
      1: {//Record
        id:1,
        txt: 'Bla',
        user: 15 //Optionally a proxy
      }
    },
    users:{//Record
      15:{//Record
        id:15,
        name:'Marc'
      }
    }
  },
  result:[1]//List
}
```

If you use Redux, it optionally, allows you to reference the normalized object through a proxy. This should also work in other environments, but this has not been tested.
This allows you to say:

```
normalized.entities.articles[1].user.name
```

### How is this different from Normalizr?
* Normalizr-Immutable is immutable
* Normalizr puts an id in the place of the object reference, Normalizr-Immutable (optionally) places a proxy there so you can keep using the object as if nothing changed.
* Normalizr-Immutable adds an extra attribute to a schema: Record. This is an Immutable Record that defines the contract for the referenced 'class'.

### What are the benefits of Normalizr-Immutable?
* Because each Schema uses a Record to define its contract, there is a clearly understandable and visible contract that any developer can read and understand.
* Because Record defines defaults, any unexpected changes to the incoming json structure will be less likely to create unforeseen errors and it will be easier to identify them.
* It gives you the benefit of immutability without sacrificing the convenience of object.property access.
* When you render your data, you don't want to retrieve objects separately for normalized references or marshal your normalized object back into a denormalized one. The use of the Proxy allows you to use your normalized structure as if it was a normal object.
* You can transition to using immutable with minimal changes.
* If you use the proxy, you can serialize a normalized structure back to its original JSON structure with `normalized.toJSON()`.

### How about Maps, Lists, etc?
Normalizr-Immutable uses Records where possible in order to maintain object.property style access. Sequences are implemented through Lists.
If you defined an object reference on your to-be-normalized object, it will be processed as a Record if the property has a Schema defined for it. Otherwise, it will become a Map (and require object.get('property') style access).

When you work with Lists and Maps, such as with loops, you should use es6 style `.forEach`, `.map`, etc. Using `for...in`, `for...of` and the like will not work.

### Creating a schema
Creating a schema is the same as originally in Normalizr, but we now add a Record to the definition. Please note that you need to use arrayOf, unionOf and valuesOf of Normalizr-Immutable.

```javascript
import { Record, List, Map } from 'immutable';
import { Schema, arrayOf } from 'normalizr-immutable';

const User = new Record({
  id:null,
  name:null
});

const Tag = new Record({
  id:null,
  label:null
});

const Article = new Record({
  id:null,
  txt:null,
  user: new User({}),
  tags: new List()
});

const schemas = {
  article : new Schema('articles', Article),
  user    : new Schema('users', User),
  tag     : new Schema('tags', Tag)
};

schemas.article.define({
  user    : schemas.user,
  tags    : arrayOf(schemas.tag)
});

```

### Normalizing your dataSource
Normalizing data is executed as follows.

```javascript
import { normalize, arrayOf } from 'normalizr-immutable';

const normalized = normalize(json, arrayOf(schemas.article),{});
```

### Working with Proxies
Normally, if you normalize an object, the resulting structure will look something like this (All the Object definitions except for `List` are `Record` implementations).

```javascript
new NormalizedRecord({
  result: new List([1, 2]),
  entities: new EntityStructure({
    articles: new ValueStructure({
      1: new Article({
        id      : 1,
        title   : 'Some Article',
        user    : 1,
        tags    : new List([5])
      })
    }),
    users: new ValueStructure({
      1: new User({
        id: 1,
        name: 'Marc'
      })
    }),
    tags: new ValueStructure({
      5: new Tag({
        id:5,
        label:'React'
      })
    })
  })
})

```

So, if you're rendering an Article, in order to render the associated user, you will have to retrieve it from the entity structure. You could do this manually, or you could denormalize/marshal your structure when you retrieve it for rendering. But this can be expensive.

For this purpose, we introduce the proxy. The idea, is that you can simply reference `articles[1].user.name`. The proxy will take care of looking up the related object.

Please note that `Proxy` support is not yet consistent across browsers and can also give headaches in testing environments with incomplete support (I've had stuff like infinite loops happen using node-inspector, etc). Tread with care.

So, with the proxy, an Article Record essentially looks like this:

```javascript
new Article({
  id      : 1,
  title   : 'Some Article',
  author  : new Proxy({id:1}),
  tags    : new List([new Proxy({id:5})])
})
```

In order to use the proxy, you will need to give it access to the actual object structure. We have developed this feature testing against Redux, so we pass it the getState function reference and the reference to the reducer inside the state structure.

```javascript
const schemas = {
  article : new Schema('articles', Article, { idAttribute: 'id', reducerKey: 'articleReducer' }),
  user    : new Schema('users', User, { idAttribute: 'id', reducerKey: 'userReducer'  }),
  tag     : new Schema('tags', Tag, { idAttribute: 'id', reducerKey: 'tagReducer'   })
};


const normalized = normalize(json.articles.items, arrayOf(schemas.article),{
  getState,
  reducerKey:'articleReducer'
});
```

Please note that we pass `getState` and not `getState()`. `getState` is a function reference to the method that will return the current state of the Redux store. If you are using Redux, you can get a reference to this method like so

```javascript
export function loadArticles(){

  return ( dispatch, getState) => {
    [...]

    const normalized = normalize(json, schema,{
      getState
    });

    [...]
  }
}
```

`articleReducer` in this case, is the name of the reducer. Currently we assume that the `result` and `entitites` keys are available in the root of the referenced reducer. This will be made more flexible in future versions.

### Browser support
This library has currently only been tested against React-Native, so I would like to hear about experiences in the browser. For a list of browsers with appropriate Proxy support [http://caniuse.com/#feat=proxy](http://caniuse.com/#feat=proxy).

## API Reference
This API Reference borrows heavily from the original Normalizr project.

### `new Schema(key, [options])`

Schema lets you define a type of entity returned by your API.  
This should correspond to model in your server code.  

The `key` parameter lets you specify the name of the dictionary for this kind of entity.  
The `record` parameter lets you specify the Record that defines your entity.

```javascript
const User = new Record({
  id:null,
  nickName: null,
});

const Article = new Record({
  //base comment
  id:null,
  txt:null,
  author:new User(),
});

const article = new Schema('articles', Article);

// You can use a custom id attribute
const article = new Schema('articles', Article, { idAttribute: 'slug' });

// Or you can specify a function to infer it
function generateSlug(entity) { /* ... */ }
const article = new Schema('articles', Article { idAttribute: generateSlug });
```

### `Schema.prototype.define(nestedSchema)`

Lets you specify relationships between different entities.  

```javascript
const article = new Schema('articles', Article);
const user = new Schema('users', User);

article.define({
  author: user
});
```

### `Schema.prototype.getKey()`

Returns the key of the schema.

```javascript
const article = new Schema('articles');

article.getKey();
// articles
```

### `Schema.prototype.getIdAttribute()`

Returns the idAttribute of the schema.

### `Schema.prototype.getRecord()`

Returns the Record of the schema.

```javascript
const article = new Schema('articles', Article);
const slugArticle = new Schema('articles', Article, { idAttribute: 'slug' });

article.getIdAttribute();
// id
slugArticle.getIdAttribute();
// slug
```

### `arrayOf(schema, [options])`

Describes an array of the schema passed as argument.

```javascript
const article = new Schema('articles', Article);
const user = new Schema('users', User);

article.define({
  author: user,
  contributors: arrayOf(user)
});
```

If the array contains entities with different schemas, you can use the `schemaAttribute` option to specify which schema to use for each entity:

```javascript
const article = new Schema('articles', Article);
const image = new Schema('images', Image);
const video = new Schema('videos', Video);
const asset = {
  images: image,
  videos: video
};

// You can specify the name of the attribute that determines the schema
article.define({
  assets: arrayOf(asset, { schemaAttribute: 'type' })
});

// Or you can specify a function to infer it
function inferSchema(entity) { /* ... */ }
article.define({
  assets: arrayOf(asset, { schemaAttribute: inferSchema })
});
```

### `normalize(obj, schema, [options])`

Normalizes object according to schema.  
Passed `schema` should be a nested object reflecting the structure of API response.

You may optionally specify any of the following options:

* `useMapsForEntityObjects` (boolean): When `useMapsForEntityObjects` is set to `true`, it will use a Map for the entity objects (e.g. articles). When set to `false`, it will use a Record for this, but this comes at the expense of not being able to merge new entity objects into the resulting Record object. The advantage of using Records, is that you have dot-property access, but if you use the Proxy, the impact on your code of `useMapsForEntityObjects: true` is really minimal. I recommend using it.

* `assignEntity` (function): This is useful if your backend emits additional fields, such as separate ID fields, you'd like to delete in the normalized entity. See [the tests](https://github.com/gaearon/normalizr/blob/a0931d7c953b24f8f680b537b5f23a20e8483be1/test/index.js#L89-L200) and the [discussion](https://github.com/gaearon/normalizr/issues/10) for a usage example.

* `mergeIntoEntity` (function): You can use this to resolve conflicts when merging entities with the same key. See [the test](https://github.com/gaearon/normalizr/blob/47ed0ecd973da6fa7c8b2de461e35b293ae52047/test/index.js#L132-L197) and the [discussion](https://github.com/gaearon/normalizr/issues/34) for a usage example.

```javascript
const article = new Schema('articles', Article);
const user = new Schema('users', User);

article.define({
  author: user,
  contributors: arrayOf(user),
  meta: {
    likes: arrayOf({
      user: user
    })
  }
});

// ...

// Normalize one article object
const json = { id: 1, author: ... };
const normalized = normalize(json, article);

// Normalize an array of article objects
const arr = [{ id: 1, author: ... }, ...]
const normalized = normalize(arr, arrayOf(article));

// Normalize an array of article objects, referenced by an object key:
const wrappedArr = { articles: [{ id: 1, author: ... }, ...] }
const normalized = normalize(wrappedArr, {
  articles: arrayOf(article)
});
```

### Final remarks
The use of the Proxy as a way of accessing the entity structure transparently, would be totally possible also in the original Normalizr library as well. I'm still studying on ways to override functions in a non class structure. If anyone has any suggestions on this, I could spin off the Proxy functionality into a separate library that could serve both libraries.

The way I turn a list of entities into Records (the ValueStructure Record) is a bit of a hack. I basically create the Record with the actual values as defaults, which is not the way you should be using Records. I apply this hack to ensure that we can keep referencing objects through dot notation. If someone has any problems with this in terms of performance, I would like to hear about it.

This library has been developed as part of [Ology](https://www.ology.com.br), the social network for physicians.

I removed harmony-reflect because it's a rather big library and more recent versions of v8 don't need it. I'm just maintaining the harmony-proxy shim.

### TODO
* API description
* Verify working of unionOf and valuesOf. I haven't really worked with that yet.

### Troubleshooting
* If you get any error message with regards to the Proxy object being unknown, please make sure you have set up your babel presets correctly to support proxies. If you use mocha for testing, you will need to add `--harmony-proxies` to the mocha command
* If you get unexpected results, please check that you are not accidently using arrayOf, unionOf and valuesOf of the original Normalizr library. Because this library doesn't export some of the components these functions use, I had to copy them and they will fail instanceof even though they are functionally equivalent.
